package memory

import (
	"sync"

	"github.com/yourusername/go-tutor/internal/domain"
	"github.com/yourusername/go-tutor/internal/repository"
)

// TaskMemoryRepository implements TaskRepository interface using in-memory storage
// 메모리 기반 Repository 구현체
//
// 이 구현체는:
// - 학습 및 개발 목적으로 사용
// - 실제 데이터베이스 없이 빠른 테스트 가능
// - 애플리케이션 재시작 시 데이터 소실
//
// Go Pattern: 구조체가 인터페이스를 구현
// - "implements" 키워드 없음
// - 모든 메서드만 구현하면 자동으로 인터페이스 만족
type TaskMemoryRepository struct {
	tasks  map[uint]*domain.Task // ID를 키로 하는 task 저장소
	nextID uint                   // 다음 task에 할당할 ID
	mu     sync.RWMutex           // 동시성 제어를 위한 뮤텍스
}

// Compile-time interface implementation check
// 컴파일 타임에 인터페이스 구현 확인
//
// Go Trick: 이 줄은 TaskMemoryRepository가 repository.TaskRepository를
// 구현하는지 컴파일 타임에 검증
// - 구현하지 않으면 컴파일 에러 발생
// - 개발 초기에 인터페이스 불일치 발견
var _ repository.TaskRepository = (*TaskMemoryRepository)(nil)

// NewTaskMemoryRepository creates a new in-memory task repository
// 생성자 함수: Repository 인스턴스 생성
//
// Go Convention: New{TypeName} 패턴
// 왜 생성자 함수가 필요한가?
// - map 초기화 (nil map에 쓰기는 panic 발생)
// - nextID 초기값 설정
// - 일관된 초기 상태 보장
func NewTaskMemoryRepository() *TaskMemoryRepository {
	return &TaskMemoryRepository{
		tasks:  make(map[uint]*domain.Task), // map 초기화 필수!
		nextID: 1,                            // ID는 1부터 시작
	}
}

// Create adds a new task to the repository
// task 생성 및 저장
//
// 주의사항:
// - ID 자동 할당
// - 동시성 안전 (mutex 사용)
// - 도메인 검증 수행
func (r *TaskMemoryRepository) Create(task *domain.Task) error {
	// 1. 도메인 검증
	// Repository는 유효한 데이터만 저장해야 함
	if err := task.Validate(); err != nil {
		return err
	}

	// 2. 동시성 제어: Write Lock
	// 여러 고루틴이 동시에 Create를 호출할 수 있으므로
	// map 쓰기 전에 락 획득 필요
	r.mu.Lock()
	defer r.mu.Unlock() // 함수 종료 시 자동으로 락 해제

	// 3. ID 할당
	task.ID = r.nextID
	r.nextID++

	// 4. 저장
	// Go에서 map에 포인터를 저장하는 이유:
	// - 메모리 효율 (큰 구조체 복사 방지)
	// - 참조 유지 (같은 객체를 가리킴)
	r.tasks[task.ID] = task

	return nil
}

// FindByID retrieves a task by its ID
// ID로 task 조회
//
// Go Pattern: (value, error) 반환
// - 성공: (task, nil)
// - 실패: (nil, error)
func (r *TaskMemoryRepository) FindByID(id uint) (*domain.Task, error) {
	// Read Lock: 읽기 작업은 여러 고루틴이 동시에 수행 가능
	// RLock은 다른 RLock과 동시 실행 가능하지만 Lock과는 배타적
	r.mu.RLock()
	defer r.mu.RUnlock()

	// map 조회: ok 패턴
	// task, ok := map[key]
	// - ok가 true면 키가 존재
	// - ok가 false면 키가 없음 (task는 zero value)
	task, ok := r.tasks[id]
	if !ok {
		return nil, domain.ErrTaskNotFound
	}

	// 주의: 포인터를 반환하므로 호출자가 task를 수정하면
	// repository의 데이터도 변경됨
	// 프로덕션에서는 복사본을 반환하는 것이 더 안전할 수 있음
	return task, nil
}

// FindAll retrieves all tasks
// 모든 task 조회
//
// 반환 타입: []*domain.Task (task 포인터의 슬라이스)
func (r *TaskMemoryRepository) FindAll() ([]*domain.Task, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// 슬라이스 생성: 용량을 미리 할당하여 성능 최적화
	// len(r.tasks)만큼의 용량을 가진 슬라이스 생성
	tasks := make([]*domain.Task, 0, len(r.tasks))

	// map 순회: for key, value := range map
	// Go의 map 순회는 순서가 보장되지 않음 (의도적 설계)
	for _, task := range r.tasks {
		tasks = append(tasks, task)
	}

	return tasks, nil
}

// Update modifies an existing task
// 기존 task 수정
//
// 업데이트 전략:
// 1. task 존재 확인
// 2. 도메인 검증
// 3. 데이터 교체
func (r *TaskMemoryRepository) Update(task *domain.Task) error {
	// 1. 검증
	if err := task.Validate(); err != nil {
		return err
	}

	// 2. Write Lock
	r.mu.Lock()
	defer r.mu.Unlock()

	// 3. 존재 확인
	if _, ok := r.tasks[task.ID]; !ok {
		return domain.ErrTaskNotFound
	}

	// 4. 업데이트
	// 기존 task를 새 task로 완전히 교체
	r.tasks[task.ID] = task

	return nil
}

// Delete removes a task by its ID
// ID로 task 삭제
//
// Go의 map delete:
// - delete(map, key) 내장 함수 사용
// - 키가 없어도 에러 발생하지 않음 (우리는 명시적으로 에러 반환)
func (r *TaskMemoryRepository) Delete(id uint) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// 존재 확인
	if _, ok := r.tasks[id]; !ok {
		return domain.ErrTaskNotFound
	}

	// 삭제: Go 내장 delete 함수
	delete(r.tasks, id)

	return nil
}

/*
주요 학습 포인트:

1. Interface Implementation (인터페이스 구현)
   - 명시적 선언 없이 메서드만 구현
   - var _ 패턴으로 컴파일 타임 체크

2. Concurrency Safety (동시성 안전)
   - sync.RWMutex 사용
   - Lock: 쓰기 작업 (Create, Update, Delete)
   - RLock: 읽기 작업 (FindByID, FindAll)
   - defer로 락 해제 보장

3. Map Usage (map 사용법)
   - make()로 초기화 필수
   - value, ok := map[key] 패턴
   - delete(map, key) 삭제
   - 순회 순서 비보장

4. Error Handling (에러 처리)
   - 도메인 에러 재사용
   - nil 체크와 에러 반환

5. Memory Management (메모리 관리)
   - 포인터 vs 값 저장
   - 슬라이스 용량 미리 할당
   - defer를 이용한 자원 해제

실제 프로덕션에서는:
- 데이터베이스 (PostgreSQL, MySQL 등) 사용
- ORM (GORM) 또는 SQL 빌더 사용
- 트랜잭션 처리 추가
- 페이지네이션 구현
- 하지만 인터페이스는 동일하게 유지!
*/
