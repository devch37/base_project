# Go & Gin Framework Tutorial with Clean Architecture

A comprehensive tutorial project for learning Go programming and the Gin web framework using clean architecture principles.

이 프로젝트는 Go 언어와 Gin 프레임워크를 클린 아키텍처 원칙에 따라 학습하기 위한 튜토리얼입니다.

## Table of Contents
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Architecture Layers](#architecture-layers)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Learning Path](#learning-path)
- [Best Practices Demonstrated](#best-practices-demonstrated)
- [Resources](#resources)

## Project Overview

This project implements a Task Management API that demonstrates:
- RESTful API design with CRUD operations
- Clean Architecture (Domain, Use Case, Repository, Delivery layers)
- Dependency Injection
- Error handling patterns
- Middleware usage
- Configuration management
- Unit testing

**Domain**: Task Management
- Create tasks
- List all tasks
- Get task by ID
- Update tasks
- Delete tasks

## Prerequisites

- Go 1.21 or higher
- Basic understanding of HTTP and REST APIs
- Familiarity with JSON

Install Go from [https://go.dev/dl/](https://go.dev/dl/)

## Project Structure

```
go-tutor/
├── cmd/
│   └── api/
│       └── main.go                 # Application entry point (애플리케이션 시작점)
├── internal/
│   ├── domain/
│   │   ├── task.go                 # Business entities (비즈니스 엔티티)
│   │   └── errors.go               # Domain errors (도메인 에러 정의)
│   ├── usecase/
│   │   ├── task_usecase.go         # Business logic (비즈니스 로직)
│   │   └── task_usecase_test.go    # Use case tests
│   ├── repository/
│   │   ├── task_repository.go      # Data access interface (데이터 접근 인터페이스)
│   │   └── memory/
│   │       └── task_memory.go      # In-memory implementation (메모리 기반 구현)
│   └── delivery/
│       └── http/
│           ├── task_handler.go     # HTTP handlers (HTTP 핸들러)
│           ├── middleware.go       # Custom middleware (커스텀 미들웨어)
│           └── response.go         # Response helpers (응답 헬퍼)
├── pkg/
│   └── logger/
│       └── logger.go               # Reusable logger (재사용 가능한 로거)
├── config/
│   └── config.go                   # Configuration management (설정 관리)
├── go.mod                          # Go module definition
├── go.sum                          # Dependency checksums
├── .gitignore
└── README.md
```

## Architecture Layers

### 1. Domain Layer (`internal/domain/`)
**역할**: 비즈니스 엔티티와 도메인 규칙 정의

The domain layer contains:
- Business entities (structs that represent core business concepts)
- Domain-specific errors
- Business rules and validations
- **NO external dependencies** (framework-agnostic)

**Key Principle**: This layer should be pure Go with no external framework dependencies.

### 2. Use Case Layer (`internal/usecase/`)
**역할**: 비즈니스 로직 구현

The use case layer contains:
- Application business logic
- Orchestration of domain entities
- Calls to repositories through interfaces
- Input validation and error handling

**Key Principle**: Depends on domain layer and repository interfaces, NOT implementations.

### 3. Repository Layer (`internal/repository/`)
**역할**: 데이터 접근 추상화

The repository layer contains:
- Interfaces defining data access operations
- Concrete implementations (in-memory, database, etc.)
- Data persistence logic

**Key Principle**: Implementation details are hidden behind interfaces.

### 4. Delivery Layer (`internal/delivery/http/`)
**역할**: HTTP 요청/응답 처리

The delivery layer contains:
- HTTP handlers (Gin handlers)
- Request/response DTOs
- Middleware
- Routing configuration

**Key Principle**: Thin layer that translates HTTP to use case calls.

### 5. Config (`config/`)
**역할**: 애플리케이션 설정 관리

Application configuration:
- Environment variables
- Server settings
- Feature flags

### 6. Pkg (`pkg/`)
**역할**: 재사용 가능한 유틸리티

Reusable packages:
- Logger
- Validators
- Helpers

**Key Principle**: Code here can be extracted to separate libraries.

## Getting Started

### 1. Initialize the Project

```bash
# Clone or navigate to the project directory
cd /Users/chulhanlee/Desktop/workspace/study/base_project/tutor-claude/go-tutor

# Initialize Go module (if not already done)
go mod init github.com/yourusername/go-tutor

# Download dependencies
go mod tidy
```

### 2. Run the Application

```bash
# Run from project root
go run cmd/api/main.go
```

The server will start on `http://localhost:8080`

### 3. Test the API

```bash
# Create a task
curl -X POST http://localhost:8080/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Go","description":"Study Go fundamentals","status":"pending"}'

# Get all tasks
curl http://localhost:8080/api/v1/tasks

# Get task by ID
curl http://localhost:8080/api/v1/tasks/1

# Update a task
curl -X PUT http://localhost:8080/api/v1/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Go","description":"Study Go fundamentals","status":"completed"}'

# Delete a task
curl -X DELETE http://localhost:8080/api/v1/tasks/1
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks` | Create a new task |
| GET | `/api/v1/tasks` | Get all tasks |
| GET | `/api/v1/tasks/:id` | Get task by ID |
| PUT | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task |

## Learning Path

Follow this order to understand the project:

### Step 1: Understand the Domain
Start here: `internal/domain/task.go`
- Learn about domain entities
- Understand business rules
- See validation logic

### Step 2: Explore Repository Pattern
Next: `internal/repository/task_repository.go`
- Understand interface-based design
- See how abstraction works
- Check the in-memory implementation

### Step 3: Study Use Cases
Then: `internal/usecase/task_usecase.go`
- Learn business logic orchestration
- See dependency injection
- Understand error handling

### Step 4: Examine HTTP Delivery
After: `internal/delivery/http/task_handler.go`
- Learn Gin framework basics
- Understand request binding
- See response patterns

### Step 5: Review Main Entry Point
Finally: `cmd/api/main.go`
- See dependency wiring
- Understand initialization
- Learn middleware setup

### Step 6: Run Tests
```bash
go test ./internal/usecase/... -v
```

## Best Practices Demonstrated

### Go Language Best Practices
1. **Error Handling**: Every error is checked and handled appropriately
2. **Interface Usage**: Accept interfaces, return structs
3. **Package Organization**: Clear separation of concerns
4. **Naming Conventions**: Following Go's naming guidelines
5. **Comments**: Exported functions have proper documentation

### Gin Framework Best Practices
1. **Router Grouping**: Organized routes with versioning
2. **Middleware**: Custom middleware for logging and error handling
3. **Request Validation**: Using binding tags
4. **Context Usage**: Proper use of Gin context
5. **Error Responses**: Consistent error response format

### Clean Architecture Best Practices
1. **Dependency Rule**: Dependencies point inward
2. **Interface Segregation**: Small, focused interfaces
3. **Dependency Injection**: Constructor injection pattern
4. **Testability**: Easy to mock and test each layer
5. **Framework Independence**: Business logic has no framework dependencies

### Testing Best Practices
1. **Table-Driven Tests**: Testing multiple scenarios
2. **Mocking**: Using interfaces for test doubles
3. **Test Organization**: Tests next to implementation
4. **Test Naming**: Clear test function names

## Key Go Concepts Demonstrated

### 1. Structs and Methods
```go
type Task struct {
    ID          uint      `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Status      string    `json:"status"`
    CreatedAt   time.Time `json:"created_at"`
}

func (t *Task) Validate() error {
    // Method on struct
}
```

### 2. Interfaces
```go
type TaskRepository interface {
    Create(task *domain.Task) error
    FindByID(id uint) (*domain.Task, error)
    FindAll() ([]*domain.Task, error)
    Update(task *domain.Task) error
    Delete(id uint) error
}
```

### 3. Error Handling
```go
task, err := r.usecase.GetTaskByID(id)
if err != nil {
    RespondError(c, err)
    return
}
```

### 4. Dependency Injection
```go
func NewTaskUseCase(repo repository.TaskRepository) *TaskUseCase {
    return &TaskUseCase{
        repo: repo,
    }
}
```

### 5. Pointer vs Value
```go
// Pointer receiver - can modify the struct
func (t *Task) Update(title string) {
    t.Title = title
}

// Value receiver - read-only
func (t Task) IsCompleted() bool {
    return t.Status == "completed"
}
```

## Resources

### Official Documentation
- [Go Documentation](https://go.dev/doc/)
- [Gin Framework](https://gin-gonic.com/docs/)
- [Effective Go](https://go.dev/doc/effective_go)

### Go Best Practices
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md)
- [Go Proverbs](https://go-proverbs.github.io/)

### Clean Architecture
- [The Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Go Clean Architecture Example](https://github.com/bxcodec/go-clean-arch)

### Learning Resources
- [A Tour of Go](https://go.dev/tour/)
- [Go by Example](https://gobyexample.com/)
- [Learn Go with Tests](https://quii.gitbook.io/learn-go-with-tests/)

## Next Steps

After completing this tutorial:

1. **Add Database**: Replace in-memory repository with PostgreSQL/MySQL
2. **Add Authentication**: Implement JWT authentication middleware
3. **Add Validation**: Use validator library for complex validations
4. **Add Logging**: Implement structured logging with zerolog or zap
5. **Add Docker**: Containerize the application
6. **Add CI/CD**: Set up GitHub Actions for testing and deployment

## License

This is a tutorial project for educational purposes.

---

Happy Learning! 즐거운 학습 되세요!

For questions or improvements, feel free to open an issue or PR.
