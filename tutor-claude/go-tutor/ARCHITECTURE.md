# Architecture Diagram & Flow

## Clean Architecture Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                        External World                             │
│                      (HTTP Requests)                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DELIVERY LAYER                                 │
│                  internal/delivery/http/                          │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐            │
│  │   Handler   │  │  Middleware  │  │  Response   │            │
│  │             │  │              │  │   Helper    │            │
│  │ - HTTP      │  │ - Logger     │  │             │            │
│  │   Request   │  │ - CORS       │  │ - Success   │            │
│  │ - Binding   │  │ - Recovery   │  │ - Error     │            │
│  │ - Response  │  │ - Auth       │  │             │            │
│  └──────┬──────┘  └──────────────┘  └─────────────┘            │
│         │                                                         │
│         │ calls                                                  │
└─────────┼─────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    USE CASE LAYER                                 │
│                   internal/usecase/                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │           Task Use Case                          │            │
│  │                                                  │            │
│  │  - CreateTask()                                  │            │
│  │  - GetTaskByID()                                 │            │
│  │  - GetAllTasks()                                 │            │
│  │  - UpdateTask()                                  │            │
│  │  - DeleteTask()                                  │            │
│  │  - MarkTaskAsCompleted()                         │            │
│  │                                                  │            │
│  │  Business Logic Orchestration                    │            │
│  └────────────────────┬─────────────────────────────┘            │
│                       │                                           │
│                       │ uses interface                           │
└───────────────────────┼───────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER                                │
│                  internal/repository/                             │
│                                                                   │
│  ┌─────────────────────────────────────┐                        │
│  │    TaskRepository Interface          │                        │
│  │                                      │                        │
│  │  - Create(task) error                │                        │
│  │  - FindByID(id) (task, error)        │                        │
│  │  - FindAll() ([]*task, error)        │                        │
│  │  - Update(task) error                │                        │
│  │  - Delete(id) error                  │                        │
│  └──────────────┬───────────────────────┘                        │
│                 │                                                 │
│                 │ implemented by                                 │
│                 ▼                                                 │
│  ┌──────────────────────┐  ┌─────────────────────┐              │
│  │  Memory Repository   │  │  Postgres Repo      │              │
│  │                      │  │  (future)           │              │
│  │  - In-memory map     │  │                     │              │
│  │  - Mutex for safety  │  │  - GORM/sqlx        │              │
│  │  - Auto-increment ID │  │  - Connection pool  │              │
│  └──────────────────────┘  └─────────────────────┘              │
│                                                                   │
│         Data Access Abstraction                                  │
└───────────────────────┬───────────────────────────────────────────┘
                        │
                        │ uses
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                                  │
│                   internal/domain/                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │               Task Entity                        │            │
│  │                                                  │            │
│  │  Fields:                                         │            │
│  │    - ID, Title, Description, Status              │            │
│  │    - CreatedAt, UpdatedAt                        │            │
│  │                                                  │            │
│  │  Methods:                                        │            │
│  │    - Validate() error                            │            │
│  │    - IsCompleted() bool                          │            │
│  │    - MarkAsCompleted()                           │            │
│  │    - Update(...)                                 │            │
│  │                                                  │            │
│  │  Business Rules & Validation                     │            │
│  └──────────────────────────────────────────────────┘            │
│                                                                   │
│  ┌──────────────────────────────────┐                           │
│  │      Domain Errors                │                           │
│  │                                   │                           │
│  │  - ErrInvalidTaskTitle            │                           │
│  │  - ErrTaskNotFound                │                           │
│  │  - ErrInvalidTaskStatus           │                           │
│  └───────────────────────────────────┘                           │
│                                                                   │
│         Business Entities (No External Dependencies)             │
└──────────────────────────────────────────────────────────────────┘
```

## Request Flow Example: Create Task

```
1. HTTP POST /api/v1/tasks
   {
     "title": "Learn Go",
     "description": "Study Go fundamentals"
   }
   │
   ▼
2. Middleware Chain
   ├─> RecoveryMiddleware (catch panics)
   ├─> LoggerMiddleware (log request)
   └─> CORSMiddleware (handle CORS)
   │
   ▼
3. Handler: task_handler.CreateTask(c *gin.Context)
   ├─> Bind JSON to CreateTaskRequest struct
   ├─> Validate with binding tags
   └─> Call UseCase
   │
   ▼
4. UseCase: task_usecase.CreateTask(title, desc, status)
   ├─> Create Task entity (domain.NewTask)
   ├─> Validate with task.Validate()
   └─> Call Repository
   │
   ▼
5. Repository: memory.Create(task)
   ├─> Lock mutex (concurrency safety)
   ├─> Assign ID
   ├─> Store in map
   └─> Unlock mutex
   │
   ▼
6. Response Flow (back up the chain)
   ├─> Repository returns nil (success)
   ├─> UseCase returns created task
   ├─> Handler calls RespondSuccess()
   └─> JSON response with 201 status
   │
   ▼
7. HTTP Response
   {
     "success": true,
     "message": "Task created successfully",
     "data": {
       "id": 1,
       "title": "Learn Go",
       "description": "Study Go fundamentals",
       "status": "pending",
       "created_at": "2024-02-10T00:00:00Z",
       "updated_at": "2024-02-10T00:00:00Z"
     }
   }
```

## Dependency Injection Flow

```
main() function (cmd/api/main.go)
│
├─> 1. Initialize Configuration
│   └─> config.LoadConfig()
│
├─> 2. Initialize Repository
│   └─> memory.NewTaskMemoryRepository()
│       │
│       └─> returns: *TaskMemoryRepository
│           implements: repository.TaskRepository interface
│
├─> 3. Initialize UseCase
│   └─> usecase.NewTaskUseCase(repo)
│       │
│       ├─> Inject: repository.TaskRepository interface
│       └─> returns: *TaskUseCase
│
├─> 4. Initialize Handler
│   └─> http.NewTaskHandler(usecase)
│       │
│       ├─> Inject: *TaskUseCase
│       └─> returns: *TaskHandler
│
└─> 5. Setup Router & Routes
    └─> router.POST("/tasks", handler.CreateTask)
```

## Dependency Direction (Clean Architecture Rule)

```
The Dependency Rule:
Source code dependencies must point INWARD toward higher-level policies.

┌─────────────┐
│   Delivery  │  ──────┐
└─────────────┘        │
                       ▼
┌─────────────┐     depends on
│   UseCase   │  ──────┐
└─────────────┘        │
                       ▼
┌─────────────┐     depends on
│ Repository  │  ──────┐
│ (Interface) │        │
└─────────────┘        │
                       ▼
┌─────────────┐     depends on
│   Domain    │  (No dependencies!)
└─────────────┘

Inner layers (Domain) don't know about outer layers (Delivery).
Outer layers depend on inner layers through INTERFACES.
```

## Error Handling Flow

```
Error occurs in Repository
│
├─> Repository returns domain.ErrTaskNotFound
│
▼
UseCase receives error
│
├─> UseCase propagates error (no wrapping in this example)
│
▼
Handler receives error
│
├─> Handler calls RespondError(c, err)
│
▼
RespondError maps domain error to HTTP
│
├─> domain.ErrTaskNotFound → 404 Not Found
├─> domain.ErrInvalidTaskTitle → 400 Bad Request
└─> Unknown error → 500 Internal Server Error
│
▼
JSON error response
{
  "success": false,
  "error": "task not found"
}
```

## Interface Implementation Pattern

```
1. Define Interface (in repository package)
   ┌─────────────────────────────────┐
   │ type TaskRepository interface { │
   │   Create(task) error            │
   │   FindByID(id) (*Task, error)   │
   │   ...                           │
   │ }                               │
   └─────────────────────────────────┘

2. Implement Interface (in memory sub-package)
   ┌──────────────────────────────────┐
   │ type TaskMemoryRepository struct │
   │ {                                │
   │   tasks  map[uint]*Task          │
   │   mu     sync.RWMutex            │
   │ }                                │
   └──────────────────────────────────┘

   Implements all methods automatically:
   - func (r *TaskMemoryRepository) Create(...)
   - func (r *TaskMemoryRepository) FindByID(...)

3. Use Interface (in usecase)
   ┌───────────────────────────┐
   │ type TaskUseCase struct { │
   │   repo TaskRepository     │  ← Interface, not concrete type!
   │ }                         │
   └───────────────────────────┘

Benefits:
✓ Testability (easy to mock)
✓ Flexibility (swap implementations)
✓ Decoupling (usecase doesn't know about memory/postgres)
```

## Testing Strategy

```
Unit Tests (UseCase Layer)
│
├─> Mock Repository
│   └─> type mockRepo struct {}
│       └─> implements TaskRepository interface
│
├─> Test Business Logic
│   ├─> Test happy paths
│   ├─> Test error cases
│   └─> Test edge cases
│
└─> No external dependencies needed!

Integration Tests (Handler Layer)
│
├─> Use httptest
│   └─> httptest.NewRecorder()
│
├─> Real UseCase + Mock Repository
│   └─> Test HTTP layer without database
│
└─> Verify HTTP responses

E2E Tests (Full Stack)
│
├─> Real HTTP server
├─> Real database (test DB)
└─> Test entire flow
```

## Concurrency Safety Example

```
Memory Repository with Multiple Goroutines

Request 1 (Goroutine 1)          Request 2 (Goroutine 2)
     │                                  │
     ├─> Create Task "A"                ├─> Create Task "B"
     │                                  │
     ▼                                  ▼
   Lock()                             Lock()
     │                                  │ (waits)
     ├─> tasks[1] = "A"                 │
     ├─> nextID = 2                     │
     │                                  │
   Unlock()                             │
                                        ▼
                                      Lock() acquired
                                        │
                                        ├─> tasks[2] = "B"
                                        ├─> nextID = 3
                                        │
                                      Unlock()

Without mutex → Race condition!
With mutex → Safe concurrent access ✓
```

## Key Design Patterns Used

1. **Repository Pattern**: Abstract data access
2. **Dependency Injection**: Constructor-based injection
3. **Factory Pattern**: New{TypeName}() constructors
4. **Chain of Responsibility**: Middleware chain
5. **Strategy Pattern**: Multiple repository implementations
6. **Adapter Pattern**: HTTP to domain translation

## Benefits of This Architecture

### Testability
- Each layer can be tested independently
- Easy to mock dependencies
- Fast unit tests (no DB required)

### Maintainability
- Clear separation of concerns
- Changes in one layer don't affect others
- Easy to understand and navigate

### Flexibility
- Swap implementations (memory → postgres)
- Add new delivery methods (GraphQL, gRPC)
- Change frameworks without touching business logic

### Scalability
- Horizontal scaling (stateless handlers)
- Can separate layers into microservices
- Database replication strategies

---

This architecture is production-ready and follows industry best practices!
