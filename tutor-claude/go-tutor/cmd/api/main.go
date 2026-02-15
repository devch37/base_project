package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/go-tutor/config"
	httpDelivery "github.com/yourusername/go-tutor/internal/delivery/http"
	"github.com/yourusername/go-tutor/internal/repository/memory"
	"github.com/yourusername/go-tutor/internal/usecase"
	"github.com/yourusername/go-tutor/pkg/logger"
)

// main is the entry point of the application
// 애플리케이션 진입점
//
// main 함수의 책임:
// 1. 설정 로드
// 2. 의존성 초기화 (Dependency Injection)
// 3. 라우터 설정
// 4. 서버 시작
//
// Go Convention: package main의 main() 함수는 실행 파일의 시작점
func main() {
	// 1. Load Configuration
	// 설정 로드
	cfg := config.LoadConfig()
	log.Printf("Starting %s v%s in %s mode", cfg.App.Name, cfg.App.Version, cfg.App.Environment)

	// 2. Initialize Logger
	// 로거 초기화
	logger := logger.New()
	logger.Info("Logger initialized")

	// 3. Initialize Gin Router
	// Gin 라우터 초기화
	// cfg.Server.Mode에 따라 "debug", "release", "test" 모드 설정
	gin.SetMode(cfg.Server.Mode)
	router := gin.New() // gin.Default() 대신 gin.New() 사용하여 커스텀 미들웨어 적용

	// 4. Apply Global Middleware
	// 전역 미들웨어 적용
	// 순서가 중요! Recovery → Logger → CORS
	router.Use(httpDelivery.RecoveryMiddleware()) // Panic 복구
	router.Use(httpDelivery.LoggerMiddleware())   // 요청 로깅
	router.Use(httpDelivery.CORSMiddleware())     // CORS 처리

	// 5. Initialize Dependencies (Dependency Injection)
	// 의존성 초기화 및 주입
	//
	// Clean Architecture의 의존성 흐름:
	// main → handler → usecase → repository
	// 모든 의존성은 여기서 생성하고 주입
	//
	// 의존성 방향: 외부 → 내부 (인터페이스에 의존)

	// Repository Layer
	// 데이터 접근 계층 초기화
	taskRepo := memory.NewTaskMemoryRepository()
	logger.Info("Task repository initialized (in-memory)")

	// UseCase Layer
	// 비즈니스 로직 계층 초기화
	// Repository 인터페이스를 주입
	taskUseCase := usecase.NewTaskUseCase(taskRepo)
	logger.Info("Task use case initialized")

	// Delivery Layer (HTTP Handlers)
	// HTTP 핸들러 초기화
	// UseCase를 주입
	taskHandler := httpDelivery.NewTaskHandler(taskUseCase)
	logger.Info("Task handler initialized")

	// 6. Setup Routes
	// 라우트 설정
	setupRoutes(router, taskHandler)
	logger.Info("Routes configured")

	// 7. Start Server
	// 서버 시작
	serverAddr := cfg.GetServerAddress()
	logger.Info("Starting server on %s", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// setupRoutes configures all application routes
// 라우트 설정 함수
//
// RESTful API 설계:
// - /api/v1: API 버전 관리
// - 명확한 리소스 경로
// - HTTP 메서드로 의도 표현
func setupRoutes(router *gin.Engine, taskHandler *httpDelivery.TaskHandler) {
	// Health check endpoint
	// 헬스체크 엔드포인트: 서버 상태 확인용
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"service": "go-tutor-api",
		})
	})

	// API v1 routes
	// API 버전 1 그룹
	// 장점:
	// - API 버전 관리
	// - 하위 호환성 유지
	// - 점진적 마이그레이션
	v1 := router.Group("/api/v1")
	{
		// Task routes
		// Task 관련 라우트
		tasks := v1.Group("/tasks")
		{
			tasks.POST("", taskHandler.CreateTask)              // POST /api/v1/tasks
			tasks.GET("", taskHandler.GetAllTasks)              // GET /api/v1/tasks
			tasks.GET("/:id", taskHandler.GetTaskByID)          // GET /api/v1/tasks/:id
			tasks.PUT("/:id", taskHandler.UpdateTask)           // PUT /api/v1/tasks/:id
			tasks.DELETE("/:id", taskHandler.DeleteTask)        // DELETE /api/v1/tasks/:id
			tasks.POST("/:id/complete", taskHandler.MarkTaskAsCompleted) // POST /api/v1/tasks/:id/complete
		}
	}

	// 향후 추가 가능한 라우트 예시:
	// - POST /api/v1/users (사용자 생성)
	// - GET /api/v1/users/:id/tasks (사용자별 task 조회)
	// - POST /api/v1/auth/login (로그인)
}

/*
주요 학습 포인트:

1. Application Entry Point (애플리케이션 진입점)
   - package main
   - main() 함수
   - 실행 파일 생성

2. Dependency Injection (의존성 주입)
   - main에서 모든 의존성 생성
   - 생성자를 통해 주입
   - 의존성 방향: 외부 → 내부

   의존성 그래프:
   main
    ├─> taskHandler (의존: taskUseCase)
    └─> taskUseCase (의존: taskRepo)
        └─> taskRepo (의존: 없음)

3. Clean Architecture Wiring
   - 각 레이어는 인터페이스에 의존
   - main에서 구체 타입 연결
   - 프레임워크 독립적

4. Gin Router Setup
   - gin.New(): 빈 라우터 생성
   - gin.Default(): 기본 미들웨어 포함
   - router.Use(): 전역 미들웨어
   - router.Group(): 라우트 그룹화

5. Route Organization
   - API 버전 관리 (/api/v1)
   - 리소스별 그룹화 (/tasks)
   - RESTful 패턴

6. Middleware Order
   1. Recovery (panic 복구)
   2. Logger (로깅)
   3. CORS (CORS 처리)
   4. Auth (인증, 향후 추가)
   5. Handlers (실제 로직)

프로젝트 실행:

1. 의존성 설치:
   go mod tidy

2. 애플리케이션 실행:
   go run cmd/api/main.go

3. 다른 터미널에서 테스트:
   curl http://localhost:8080/health

4. Task 생성:
   curl -X POST http://localhost:8080/api/v1/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Learn Go","description":"Study Go basics"}'

빌드 및 배포:

1. 빌드:
   go build -o bin/api cmd/api/main.go

2. 실행:
   ./bin/api

3. 크로스 컴파일:
   GOOS=linux GOARCH=amd64 go build -o bin/api-linux cmd/api/main.go

향후 개선:

1. Graceful Shutdown
   - 시그널 처리 (SIGTERM, SIGINT)
   - 진행 중인 요청 완료 대기
   - 리소스 정리

2. Configuration Validation
   - 필수 환경 변수 검증
   - 유효성 검사

3. Database Integration
   - PostgreSQL/MySQL 연결
   - Migration 실행
   - Connection pooling

4. Monitoring
   - Prometheus metrics
   - Health check 개선
   - APM 통합
*/
