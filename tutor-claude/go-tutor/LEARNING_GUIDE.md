# Go & Gin Clean Architecture Learning Guide

이 가이드는 프로젝트를 통해 Go와 Gin을 학습하는 단계별 경로를 제공합니다.

## Phase 1: Go 언어 기초 이해 (1-2주)

### 1.1 Go 기본 문법 복습
프로젝트에서 사용된 Go 개념들:

#### Structs (구조체)
**파일**: `internal/domain/task.go`
```go
type Task struct {
    ID          uint      `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Status      string    `json:"status"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

**학습 포인트**:
- 구조체 정의와 필드
- Struct tags (`json:"id"`)의 용도
- 대문자/소문자 네이밍의 의미 (exported vs unexported)

#### Methods (메서드)
**파일**: `internal/domain/task.go`
```go
// Pointer receiver - 구조체 수정 가능
func (t *Task) Validate() error {
    // ...
}

// Value receiver - 읽기 전용
func (t Task) IsCompleted() bool {
    return t.Status == TaskStatusCompleted
}
```

**학습 포인트**:
- Pointer receiver vs Value receiver
- 언제 어떤 것을 사용해야 하는가?
- 메서드 네이밍 규칙 (Is, Has, Get 등)

#### Interfaces (인터페이스)
**파일**: `internal/repository/task_repository.go`
```go
type TaskRepository interface {
    Create(task *domain.Task) error
    FindByID(id uint) (*domain.Task, error)
    // ...
}
```

**학습 포인트**:
- 인터페이스 정의
- 암시적 구현 (implicit implementation)
- "Accept interfaces, return structs" 원칙

#### Error Handling (에러 처리)
**파일**: `internal/domain/errors.go`
```go
var (
    ErrInvalidTaskTitle = errors.New("task title cannot be empty")
    ErrTaskNotFound     = errors.New("task not found")
)
```

**학습 포인트**:
- Sentinel errors 패턴
- 에러 반환 및 처리
- errors.Is(), errors.As() 사용법

### 1.2 실습 과제

#### 과제 1: Domain Layer 확장
`internal/domain/task.go`에 새로운 기능 추가:

1. Task에 `Priority` 필드 추가 (high, medium, low)
2. `SetPriority()` 메서드 구현
3. Priority 검증 로직 추가
4. 새로운 에러 정의 (`ErrInvalidPriority`)

#### 과제 2: Repository 메서드 추가
`internal/repository/task_repository.go`에 메서드 추가:

1. 인터페이스에 `FindByStatus(status string)` 추가
2. `memory/task_memory.go`에 구현
3. 동시성 안전성 고려 (mutex 사용)

---

## Phase 2: Clean Architecture 이해 (1주)

### 2.1 레이어별 역할 이해

#### Domain Layer (도메인 레이어)
- **위치**: `internal/domain/`
- **책임**: 비즈니스 엔티티와 규칙
- **의존성**: 없음 (가장 안쪽 레이어)

**읽어볼 파일**:
1. `task.go` - 엔티티와 비즈니스 규칙
2. `errors.go` - 도메인 에러 정의

**이해할 점**:
- 왜 외부 라이브러리에 의존하지 않는가?
- Validation이 여기에 있는 이유는?

#### Repository Layer (저장소 레이어)
- **위치**: `internal/repository/`
- **책임**: 데이터 접근 추상화
- **의존성**: Domain Layer

**읽어볼 파일**:
1. `task_repository.go` - 인터페이스 정의
2. `memory/task_memory.go` - In-memory 구현

**이해할 점**:
- 인터페이스와 구현의 분리
- 왜 map이 아닌 인터페이스를 사용하는가?
- 동시성 처리 (sync.RWMutex)

#### UseCase Layer (유즈케이스 레이어)
- **위치**: `internal/usecase/`
- **책임**: 비즈니스 로직 오케스트레이션
- **의존성**: Domain, Repository Interface

**읽어볼 파일**:
1. `task_usecase.go` - 비즈니스 로직
2. `task_usecase_test.go` - 테스트

**이해할 점**:
- Domain과 UseCase의 차이
- Dependency Injection 패턴
- 에러 처리 흐름

#### Delivery Layer (전달 레이어)
- **위치**: `internal/delivery/http/`
- **책임**: HTTP 요청/응답 처리
- **의존성**: UseCase

**읽어볼 파일**:
1. `task_handler.go` - HTTP 핸들러
2. `middleware.go` - 미들웨어
3. `response.go` - 응답 헬퍼

**이해할 점**:
- Handler가 "얇은(thin)" 이유
- DTO vs Domain Entity
- HTTP 상태 코드 매핑

### 2.2 실습 과제

#### 과제 3: 새로운 UseCase 추가
`internal/usecase/task_usecase.go`에 기능 추가:

1. `GetCompletedTasks()` 메서드 구현
2. `GetPendingTasks()` 메서드 구현
3. 테스트 작성 (`task_usecase_test.go`)

#### 과제 4: 새로운 엔드포인트 추가
완료된 과제 3을 HTTP로 노출:

1. Handler에 `GetCompletedTasks` 메서드 추가
2. `cmd/api/main.go`에 라우트 추가
3. curl로 테스트

---

## Phase 3: Gin Framework 마스터 (1주)

### 3.1 Gin 핵심 개념

#### Router와 Handler
**파일**: `cmd/api/main.go`
```go
router := gin.New()
router.GET("/health", healthHandler)
```

**학습 포인트**:
- gin.New() vs gin.Default()
- HTTP 메서드 (GET, POST, PUT, DELETE)
- Route parameters vs Query parameters

#### Middleware
**파일**: `internal/delivery/http/middleware.go`

**학습 포인트**:
- 미들웨어 체인
- c.Next() vs c.Abort()
- 전처리/후처리 패턴

#### Request Binding
**파일**: `internal/delivery/http/task_handler.go`
```go
var req CreateTaskRequest
if err := c.ShouldBindJSON(&req); err != nil {
    // ...
}
```

**학습 포인트**:
- Binding tags (required, oneof 등)
- ShouldBindJSON vs BindJSON
- 검증 에러 처리

#### Context 사용
```go
func handler(c *gin.Context) {
    // URL 파라미터
    id := c.Param("id")

    // Query 파라미터
    status := c.Query("status")

    // 헤더
    token := c.GetHeader("Authorization")

    // JSON 응답
    c.JSON(200, data)
}
```

### 3.2 실습 과제

#### 과제 5: 커스텀 미들웨어 작성
`internal/delivery/http/middleware.go`에 추가:

1. RequestID 미들웨어 구현
   - 각 요청에 고유 ID 부여
   - 응답 헤더에 포함
   - 로그에 포함

2. Timing 미들웨어 구현
   - 요청 처리 시간 측정
   - 느린 요청 로깅 (>1초)

#### 과제 6: 고급 Binding
Query parameter와 Binding 조합:

1. `GET /api/v1/tasks?status=pending&sort=created_at` 지원
2. Query struct 정의
3. Pagination 추가 (limit, offset)

---

## Phase 4: 테스팅 (1주)

### 4.1 Unit Testing

#### Table-Driven Tests
**파일**: `internal/usecase/task_usecase_test.go`
```go
tests := []struct {
    name          string
    input         string
    expectedError error
}{
    {"Valid", "Title", nil},
    {"Empty", "", ErrInvalidTitle},
}

for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        // ...
    })
}
```

**학습 포인트**:
- 테스트 구조체 정의
- t.Run() 서브테스트
- 테스트 격리

#### Mock과 Dependency Injection
```go
// Mock repository
type mockRepo struct {
    tasks []*domain.Task
}

func (m *mockRepo) FindByID(id uint) (*domain.Task, error) {
    // Mock implementation
}
```

### 4.2 실습 과제

#### 과제 7: Handler 테스트 작성
`internal/delivery/http/task_handler_test.go` 생성:

1. httptest 패키지 사용
2. POST /tasks 엔드포인트 테스트
3. 검증 에러 케이스 테스트
4. Mock UseCase 사용

예시 코드:
```go
func TestCreateTask(t *testing.T) {
    // Setup
    router := gin.Default()
    mockUC := &mockTaskUseCase{}
    handler := NewTaskHandler(mockUC)
    router.POST("/tasks", handler.CreateTask)

    // Test
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("POST", "/tasks", body)
    router.ServeHTTP(w, req)

    // Assert
    assert.Equal(t, 201, w.Code)
}
```

---

## Phase 5: 고급 주제 (2주)

### 5.1 데이터베이스 통합

#### PostgreSQL Repository 구현
새 파일: `internal/repository/postgres/task_postgres.go`

1. GORM 또는 sqlx 사용
2. TaskRepository 인터페이스 구현
3. Migration 작성
4. Connection pooling 설정

```go
type TaskPostgresRepository struct {
    db *gorm.DB
}

func (r *TaskPostgresRepository) Create(task *domain.Task) error {
    return r.db.Create(task).Error
}
```

#### main.go 수정
```go
// 환경에 따라 repository 선택
var taskRepo repository.TaskRepository
if cfg.IsProduction() {
    taskRepo = postgres.NewTaskPostgresRepository(db)
} else {
    taskRepo = memory.NewTaskMemoryRepository()
}
```

### 5.2 인증/인가 추가

#### JWT 미들웨어
```go
func JWTAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        claims, err := validateJWT(token)
        if err != nil {
            c.AbortWithStatusJSON(401, ...)
            return
        }
        c.Set("userID", claims.UserID)
        c.Next()
    }
}
```

#### User Domain 추가
1. `internal/domain/user.go` 생성
2. User Repository 구현
3. Auth UseCase 작성
4. Login/Register 엔드포인트

### 5.3 실습 과제

#### 과제 8: PostgreSQL 통합
1. Docker로 PostgreSQL 실행
2. GORM으로 Repository 구현
3. Migration 작성
4. 기존 테스트 모두 통과 확인

#### 과제 9: JWT 인증
1. User 도메인 추가
2. Password hashing (bcrypt)
3. JWT 생성/검증
4. Protected routes

---

## Phase 6: 프로덕션 준비 (1주)

### 6.1 로깅 개선
```go
// zerolog 사용
logger := zerolog.New(os.Stdout).With().Timestamp().Logger()
logger.Info().
    Str("method", "POST").
    Str("path", "/tasks").
    Int("status", 201).
    Msg("Task created")
```

### 6.2 Graceful Shutdown
```go
srv := &http.Server{
    Addr:    ":8080",
    Handler: router,
}

go func() {
    if err := srv.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}()

// Wait for interrupt signal
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// Graceful shutdown
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
if err := srv.Shutdown(ctx); err != nil {
    log.Fatal(err)
}
```

### 6.3 Docker 컨테이너화
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main cmd/api/main.go

FROM alpine:latest
COPY --from=builder /app/main /main
EXPOSE 8080
CMD ["/main"]
```

### 6.4 실습 과제

#### 과제 10: 프로덕션 배포
1. Dockerfile 작성
2. docker-compose.yaml 작성 (API + PostgreSQL)
3. 환경 변수 관리 (.env)
4. Health check 엔드포인트 개선

---

## 추가 학습 자료

### Go 언어
- [A Tour of Go](https://go.dev/tour/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go by Example](https://gobyexample.com/)

### Clean Architecture
- [Uncle Bob - Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Go Clean Architecture Example](https://github.com/bxcodec/go-clean-arch)

### Gin Framework
- [Gin Documentation](https://gin-gonic.com/docs/)
- [Gin Examples](https://github.com/gin-gonic/examples)

### Testing
- [Learn Go with Tests](https://quii.gitbook.io/learn-go-with-tests/)
- [Go Testing Best Practices](https://github.com/golang/go/wiki/TableDrivenTests)

---

## 학습 체크리스트

### Go 기초
- [ ] Structs와 Methods 이해
- [ ] Interfaces 사용법
- [ ] Error handling 패턴
- [ ] Pointers vs Values
- [ ] Packages와 imports
- [ ] Goroutines와 channels (기본)

### Clean Architecture
- [ ] 각 레이어의 역할 이해
- [ ] Dependency Rule 준수
- [ ] Interface 기반 설계
- [ ] Dependency Injection

### Gin Framework
- [ ] Router 설정
- [ ] Middleware 작성
- [ ] Request binding
- [ ] Response handling
- [ ] Error handling

### 테스팅
- [ ] Unit tests 작성
- [ ] Table-driven tests
- [ ] Mocking
- [ ] Test coverage

### 고급 주제
- [ ] Database 통합
- [ ] 인증/인가
- [ ] Structured logging
- [ ] Docker 컨테이너화

---

즐거운 학습 되세요! 질문이 있으면 GitHub Issues에 올려주세요.
