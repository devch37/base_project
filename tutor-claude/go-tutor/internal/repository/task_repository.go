package repository

import "github.com/yourusername/go-tutor/internal/domain"

// TaskRepository defines the interface for task data access
// Repository 인터페이스: 데이터 접근 추상화
//
// Clean Architecture의 핵심 원칙:
// - 상위 레이어(usecase)는 인터페이스에 의존
// - 하위 레이어(구현체)는 인터페이스를 구현
// - 의존성 역전 원칙 (Dependency Inversion Principle)
//
// Go Best Practice: "Accept interfaces, return structs"
// - 함수는 인터페이스를 매개변수로 받음
// - 함수는 구체적인 타입을 반환
type TaskRepository interface {
	// Create adds a new task to the repository
	// task를 저장하고 ID를 할당
	Create(task *domain.Task) error

	// FindByID retrieves a task by its ID
	// ID로 task를 조회하거나 ErrTaskNotFound 반환
	FindByID(id uint) (*domain.Task, error)

	// FindAll retrieves all tasks
	// 모든 task를 조회
	FindAll() ([]*domain.Task, error)

	// Update modifies an existing task
	// 기존 task를 수정하거나 ErrTaskNotFound 반환
	Update(task *domain.Task) error

	// Delete removes a task by its ID
	// ID로 task를 삭제하거나 ErrTaskNotFound 반환
	Delete(id uint) error
}

/*
왜 인터페이스를 사용하는가?

1. 의존성 역전 (Dependency Inversion)
   - UseCase는 구체적인 구현이 아닌 인터페이스에 의존
   - 데이터베이스를 MySQL에서 PostgreSQL로 변경해도 UseCase 코드는 변경 없음

   Before (나쁜 예):
   type TaskUseCase struct {
       mysqlRepo *MySQLTaskRepository  // 구체적인 구현에 의존
   }

   After (좋은 예):
   type TaskUseCase struct {
       repo TaskRepository  // 인터페이스에 의존
   }

2. 테스트 용이성 (Testability)
   - Mock 구현체를 쉽게 만들 수 있음
   - 실제 데이터베이스 없이 UseCase 테스트 가능

   type MockTaskRepository struct {}
   func (m *MockTaskRepository) Create(task *domain.Task) error {
       // Mock implementation for testing
       return nil
   }

3. 유연성 (Flexibility)
   - 여러 구현체를 만들 수 있음
   - InMemoryRepository (개발/테스트용)
   - MySQLRepository (프로덕션용)
   - RedisRepository (캐싱용)

4. 계약 정의 (Contract Definition)
   - 인터페이스는 "무엇을" 할 수 있는지 정의
   - 구현체는 "어떻게" 하는지 정의

Go 인터페이스의 특징:

1. Implicit Implementation (암시적 구현)
   - Java/C#처럼 "implements" 키워드 불필요
   - 메서드 시그니처만 일치하면 자동으로 구현

   type InMemoryRepo struct {}
   // 모든 메서드를 구현하면 자동으로 TaskRepository 구현

2. Small Interfaces (작은 인터페이스)
   - Go 철학: 작고 집중된 인터페이스
   - io.Reader는 단 하나의 메서드만 가짐
   - "The bigger the interface, the weaker the abstraction"

3. Interface Segregation (인터페이스 분리)
   - 필요한 메서드만 가진 작은 인터페이스 선호
   - 사용하지 않는 메서드에 의존하지 않음

현재 Repository 인터페이스 설계:

✓ CRUD 작업만 포함
✓ 도메인 타입(*domain.Task)만 사용
✓ 구현 세부사항 숨김 (SQL, NoSQL 등)
✓ 에러 처리 명확 (error 반환)
*/
