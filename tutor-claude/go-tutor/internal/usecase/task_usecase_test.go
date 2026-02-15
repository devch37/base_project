package usecase

import (
	"testing"

	"github.com/yourusername/go-tutor/internal/domain"
	"github.com/yourusername/go-tutor/internal/repository/memory"
)

// TestCreateTask tests the CreateTask use case
// CreateTask 유스케이스 테스트
//
// Go Testing 기본 구조:
// - 함수명: Test{FunctionName}
// - 매개변수: *testing.T
// - go test 명령으로 실행
func TestCreateTask(t *testing.T) {
	// Arrange: 테스트 환경 설정
	// - Repository 생성 (in-memory 구현체)
	// - UseCase 생성 (의존성 주입)
	repo := memory.NewTaskMemoryRepository()
	uc := NewTaskUseCase(repo)

	// Act: 테스트 대상 실행
	task, err := uc.CreateTask("Test Task", "Test Description", "")

	// Assert: 결과 검증
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if task == nil {
		t.Fatal("Expected task, got nil")
	}
	if task.Title != "Test Task" {
		t.Errorf("Expected title 'Test Task', got '%s'", task.Title)
	}
	if task.Status != domain.TaskStatusPending {
		t.Errorf("Expected status '%s', got '%s'", domain.TaskStatusPending, task.Status)
	}
}

// TestCreateTaskWithInvalidTitle tests validation
// 검증 로직 테스트
func TestCreateTaskWithInvalidTitle(t *testing.T) {
	repo := memory.NewTaskMemoryRepository()
	uc := NewTaskUseCase(repo)

	// 빈 title로 task 생성 시도
	_, err := uc.CreateTask("", "Description", "")

	// 에러가 발생해야 함
	if err != domain.ErrInvalidTaskTitle {
		t.Errorf("Expected error %v, got %v", domain.ErrInvalidTaskTitle, err)
	}
}

// TestGetTaskByID tests task retrieval
// Task 조회 테스트
func TestGetTaskByID(t *testing.T) {
	repo := memory.NewTaskMemoryRepository()
	uc := NewTaskUseCase(repo)

	// 테스트 데이터 생성
	created, _ := uc.CreateTask("Test", "Description", "")

	// 조회
	retrieved, err := uc.GetTaskByID(created.ID)

	// 검증
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if retrieved.ID != created.ID {
		t.Errorf("Expected ID %d, got %d", created.ID, retrieved.ID)
	}
}

// TestGetTaskByIDNotFound tests not found case
// 존재하지 않는 Task 조회 테스트
func TestGetTaskByIDNotFound(t *testing.T) {
	repo := memory.NewTaskMemoryRepository()
	uc := NewTaskUseCase(repo)

	// 존재하지 않는 ID로 조회
	_, err := uc.GetTaskByID(999)

	// ErrTaskNotFound 에러가 발생해야 함
	if err != domain.ErrTaskNotFound {
		t.Errorf("Expected error %v, got %v", domain.ErrTaskNotFound, err)
	}
}

// TestUpdateTask tests task update
// Task 업데이트 테스트
func TestUpdateTask(t *testing.T) {
	repo := memory.NewTaskMemoryRepository()
	uc := NewTaskUseCase(repo)

	// 1. Task 생성
	created, _ := uc.CreateTask("Original", "Description", "")

	// 2. 업데이트
	updated, err := uc.UpdateTask(created.ID, "Updated", "New Description", domain.TaskStatusCompleted)

	// 3. 검증
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if updated.Title != "Updated" {
		t.Errorf("Expected title 'Updated', got '%s'", updated.Title)
	}
	if updated.Status != domain.TaskStatusCompleted {
		t.Errorf("Expected status '%s', got '%s'", domain.TaskStatusCompleted, updated.Status)
	}
}

// TestDeleteTask tests task deletion
// Task 삭제 테스트
func TestDeleteTask(t *testing.T) {
	repo := memory.NewTaskMemoryRepository()
	uc := NewTaskUseCase(repo)

	// 1. Task 생성
	created, _ := uc.CreateTask("To Delete", "Description", "")

	// 2. 삭제
	err := uc.DeleteTask(created.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// 3. 삭제 확인 (조회 시 에러 발생해야 함)
	_, err = uc.GetTaskByID(created.ID)
	if err != domain.ErrTaskNotFound {
		t.Errorf("Expected error %v after deletion, got %v", domain.ErrTaskNotFound, err)
	}
}

// TestMarkTaskAsCompleted tests marking task as completed
// Task 완료 표시 테스트
func TestMarkTaskAsCompleted(t *testing.T) {
	repo := memory.NewTaskMemoryRepository()
	uc := NewTaskUseCase(repo)

	// 1. Task 생성
	created, _ := uc.CreateTask("Task", "Description", "")

	// 2. 완료 표시
	completed, err := uc.MarkTaskAsCompleted(created.ID)

	// 3. 검증
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if completed.Status != domain.TaskStatusCompleted {
		t.Errorf("Expected status '%s', got '%s'", domain.TaskStatusCompleted, completed.Status)
	}
	if !completed.IsCompleted() {
		t.Error("Expected task to be completed")
	}
}

// TestGetAllTasks tests retrieving all tasks
// 모든 Task 조회 테스트 (Table-Driven Test 예시)
func TestGetAllTasks(t *testing.T) {
	repo := memory.NewTaskMemoryRepository()
	uc := NewTaskUseCase(repo)

	// 여러 task 생성
	uc.CreateTask("Task 1", "Description 1", "")
	uc.CreateTask("Task 2", "Description 2", "")
	uc.CreateTask("Task 3", "Description 3", "")

	// 조회
	tasks, err := uc.GetAllTasks()

	// 검증
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if len(tasks) != 3 {
		t.Errorf("Expected 3 tasks, got %d", len(tasks))
	}
}

// TestGetTasksByStatus tests filtering by status
// 상태별 Task 조회 테스트 (Table-Driven Test)
//
// Table-Driven Test:
// - 여러 테스트 케이스를 구조체 슬라이스로 정의
// - 반복문으로 모든 케이스 실행
// - 코드 중복 감소
// - 새로운 케이스 추가 용이
func TestGetTasksByStatus(t *testing.T) {
	// 테스트 케이스 정의
	tests := []struct {
		name           string // 테스트 케이스 이름
		tasksToCreate  []struct {
			title  string
			status string
		}
		filterStatus   string
		expectedCount  int
	}{
		{
			name: "Filter pending tasks",
			tasksToCreate: []struct{ title, status string }{
				{"Task 1", domain.TaskStatusPending},
				{"Task 2", domain.TaskStatusCompleted},
				{"Task 3", domain.TaskStatusPending},
			},
			filterStatus:  domain.TaskStatusPending,
			expectedCount: 2,
		},
		{
			name: "Filter completed tasks",
			tasksToCreate: []struct{ title, status string }{
				{"Task 1", domain.TaskStatusCompleted},
				{"Task 2", domain.TaskStatusCompleted},
				{"Task 3", domain.TaskStatusPending},
			},
			filterStatus:  domain.TaskStatusCompleted,
			expectedCount: 2,
		},
		{
			name: "No tasks match status",
			tasksToCreate: []struct{ title, status string }{
				{"Task 1", domain.TaskStatusPending},
			},
			filterStatus:  domain.TaskStatusCompleted,
			expectedCount: 0,
		},
	}

	// 각 테스트 케이스 실행
	for _, tt := range tests {
		// t.Run으로 서브테스트 실행
		// - 각 케이스가 독립적으로 실행
		// - 실패 시 어떤 케이스가 실패했는지 명확
		t.Run(tt.name, func(t *testing.T) {
			// 각 테스트마다 새로운 repository 생성 (격리)
			repo := memory.NewTaskMemoryRepository()
			uc := NewTaskUseCase(repo)

			// 테스트 데이터 생성
			for _, tc := range tt.tasksToCreate {
				uc.CreateTask(tc.title, "Description", tc.status)
			}

			// 실행
			tasks, err := uc.GetTasksByStatus(tt.filterStatus)

			// 검증
			if err != nil {
				t.Errorf("Expected no error, got %v", err)
			}
			if len(tasks) != tt.expectedCount {
				t.Errorf("Expected %d tasks, got %d", tt.expectedCount, len(tasks))
			}
		})
	}
}

/*
주요 학습 포인트:

1. Go Testing 기본
   - Test{FunctionName} 네이밍
   - *testing.T 매개변수
   - t.Errorf, t.Fatal 등 assertion 메서드

2. AAA Pattern (Arrange-Act-Assert)
   - Arrange: 테스트 환경 설정
   - Act: 테스트 대상 실행
   - Assert: 결과 검증

3. Table-Driven Tests
   - 구조체 슬라이스로 테스트 케이스 정의
   - 반복문으로 실행
   - t.Run으로 서브테스트 생성

4. Test Isolation (테스트 격리)
   - 각 테스트마다 새로운 repository 생성
   - 테스트 간 상태 공유 방지
   - 순서 독립적 실행

5. Dependency Injection의 장점
   - 실제 DB 없이 in-memory repository로 테스트
   - 빠른 테스트 실행
   - 외부 의존성 제거

테스트 실행:
$ go test ./internal/usecase/... -v

특정 테스트만 실행:
$ go test ./internal/usecase/... -run TestCreateTask -v

커버리지 확인:
$ go test ./internal/usecase/... -cover
*/
