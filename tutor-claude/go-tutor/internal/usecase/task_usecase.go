package usecase

import (
	"github.com/yourusername/go-tutor/internal/domain"
	"github.com/yourusername/go-tutor/internal/repository"
)

// TaskUseCase implements the business logic for task operations
// UseCase: 비즈니스 로직을 담당하는 레이어
//
// Clean Architecture에서 UseCase의 역할:
// - 애플리케이션의 비즈니스 규칙 구현
// - 여러 Repository를 조율
// - 도메인 엔티티를 조작
// - 트랜잭션 경계 정의
//
// UseCase vs Domain:
// - Domain: 단일 엔티티의 비즈니스 규칙 (예: Task 검증)
// - UseCase: 여러 엔티티 간의 비즈니스 흐름 (예: Task 생성 워크플로우)
type TaskUseCase struct {
	repo repository.TaskRepository
}

// NewTaskUseCase creates a new task use case
// 생성자 함수: Dependency Injection 패턴
//
// 의존성 주입 (Dependency Injection):
// - 생성자를 통해 의존성(repo)을 외부에서 주입
// - 구체적인 구현이 아닌 인터페이스에 의존
// - 테스트 시 Mock으로 쉽게 교체 가능
//
// Go Best Practice: "Accept interfaces, return structs"
// - 매개변수: repository.TaskRepository (인터페이스)
// - 반환값: *TaskUseCase (구체 타입)
func NewTaskUseCase(repo repository.TaskRepository) *TaskUseCase {
	return &TaskUseCase{
		repo: repo,
	}
}

// CreateTask creates a new task
// Task 생성 비즈니스 로직
//
// 책임:
// 1. 도메인 엔티티 생성 (domain.NewTask)
// 2. 비즈니스 규칙 검증 (task.Validate)
// 3. Repository를 통한 영속화
//
// Input: 원시 데이터 (title, description, status)
// Output: 생성된 Task 엔티티 또는 에러
func (uc *TaskUseCase) CreateTask(title, description, status string) (*domain.Task, error) {
	// 1. 도메인 엔티티 생성
	// NewTask는 기본값으로 pending 상태를 설정
	task := domain.NewTask(title, description)

	// 2. 상태가 명시적으로 제공된 경우 업데이트
	if status != "" {
		task.Status = status
	}

	// 3. 도메인 검증
	// 비즈니스 규칙 위반 시 조기 반환 (Early Return)
	// Go Pattern: 에러는 가능한 빨리 반환
	if err := task.Validate(); err != nil {
		return nil, err
	}

	// 4. 영속화
	// Repository 호출하여 데이터 저장
	if err := uc.repo.Create(task); err != nil {
		return nil, err
	}

	// 5. 생성된 엔티티 반환
	return task, nil
}

// GetTaskByID retrieves a task by its ID
// ID로 Task 조회
//
// 단순한 조회 로직:
// - 추가적인 비즈니스 로직 없음
// - Repository 호출을 위임
//
// 질문: 이렇게 단순하면 왜 UseCase가 필요한가?
// 답변:
// 1. 일관된 계층 구조 유지
// 2. 향후 비즈니스 로직 추가 가능 (예: 권한 검사)
// 3. 로깅, 모니터링 등 횡단 관심사 추가 위치
// 4. 여러 Repository 조합 가능
func (uc *TaskUseCase) GetTaskByID(id uint) (*domain.Task, error) {
	return uc.repo.FindByID(id)
}

// GetAllTasks retrieves all tasks
// 모든 Task 조회
//
// 향후 확장 가능성:
// - 필터링 (status별 조회)
// - 정렬 (생성일, 제목 등)
// - 페이지네이션
// - 사용자별 Task 조회 (인증 추가 시)
func (uc *TaskUseCase) GetAllTasks() ([]*domain.Task, error) {
	return uc.repo.FindAll()
}

// UpdateTask updates an existing task
// Task 업데이트 비즈니스 로직
//
// 업데이트 전략:
// 1. 기존 Task 조회 (존재 확인)
// 2. 도메인 메서드를 통한 업데이트
// 3. 검증
// 4. 영속화
//
// Go Pattern: Retrieve-Modify-Save
func (uc *TaskUseCase) UpdateTask(id uint, title, description, status string) (*domain.Task, error) {
	// 1. 기존 Task 조회
	task, err := uc.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// 2. 도메인 메서드를 통한 업데이트
	// task.Update()는 도메인 로직을 사용하여 안전하게 업데이트
	// - 빈 문자열 처리
	// - UpdatedAt 자동 갱신
	// - 유효하지 않은 status 무시
	task.Update(title, description, status)

	// 3. 검증
	// 업데이트 후 도메인 규칙을 여전히 만족하는지 확인
	if err := task.Validate(); err != nil {
		return nil, err
	}

	// 4. 영속화
	if err := uc.repo.Update(task); err != nil {
		return nil, err
	}

	return task, nil
}

// DeleteTask deletes a task by its ID
// Task 삭제
//
// 삭제 전략:
// - Soft Delete vs Hard Delete
// - 현재는 Hard Delete (물리적 삭제)
// - 실제 프로덕션에서는 Soft Delete 고려
//   (DeletedAt 필드 추가, 조회 시 제외)
func (uc *TaskUseCase) DeleteTask(id uint) error {
	return uc.repo.Delete(id)
}

// MarkTaskAsCompleted marks a task as completed
// Task를 완료 상태로 변경
//
// 비즈니스 로직 예시:
// - 도메인 메서드(MarkAsCompleted) 사용
// - 상태 변경에 대한 추가 로직 가능
//   (예: 알림 발송, 이벤트 발행 등)
func (uc *TaskUseCase) MarkTaskAsCompleted(id uint) (*domain.Task, error) {
	// 1. Task 조회
	task, err := uc.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// 2. 도메인 메서드로 상태 변경
	// 비즈니스 규칙:
	// - 이미 완료된 Task라면? (현재는 멱등성 보장)
	// - 삭제된 Task라면? (현재는 없음)
	task.MarkAsCompleted()

	// 3. 영속화
	if err := uc.repo.Update(task); err != nil {
		return nil, err
	}

	return task, nil
}

// GetTasksByStatus retrieves tasks by status
// 상태별 Task 조회
//
// 비즈니스 로직:
// - 모든 Task를 조회한 후 필터링
// - 데이터베이스 레벨 필터링이 더 효율적
// - 학습 목적으로 간단한 구현 사용
//
// 실제 프로덕션 개선안:
// - Repository에 FindByStatus 메서드 추가
// - 데이터베이스 쿼리로 필터링
func (uc *TaskUseCase) GetTasksByStatus(status string) ([]*domain.Task, error) {
	// 1. 모든 Task 조회
	allTasks, err := uc.repo.FindAll()
	if err != nil {
		return nil, err
	}

	// 2. 필터링
	// Go Pattern: 새 슬라이스를 만들어 필터링된 결과 저장
	var filteredTasks []*domain.Task
	for _, task := range allTasks {
		if task.Status == status {
			filteredTasks = append(filteredTasks, task)
		}
	}

	return filteredTasks, nil
}

/*
주요 학습 포인트:

1. Dependency Injection (의존성 주입)
   - 생성자를 통한 의존성 주입
   - 인터페이스에 의존 (구현체 X)
   - 테스트 용이성 향상

2. Business Logic Layer (비즈니스 로직 레이어)
   - Domain과 Repository 조율
   - 트랜잭션 경계 정의
   - 복잡한 비즈니스 플로우 구현

3. Error Handling (에러 처리)
   - Early Return 패턴
   - 에러 전파 (propagation)
   - 도메인 에러 재사용

4. Domain-Driven Design
   - 도메인 메서드 활용 (task.Update, task.Validate)
   - 비즈니스 규칙을 도메인에 위임
   - UseCase는 오케스트레이션에 집중

5. Single Responsibility (단일 책임)
   - 각 메서드는 하나의 비즈니스 작업만 수행
   - 명확한 입출력
   - 부수 효과 최소화

실제 프로덕션 확장:
- 트랜잭션 관리
- 이벤트 발행 (예: Task 생성 시 알림)
- 캐싱 전략
- 권한 검사
- 감사 로그
*/
