package domain

import (
	"strings"
	"time"
)

// Task represents a task entity in our domain
// 도메인 엔티티: 비즈니스의 핵심 개념을 표현하는 구조체
//
// Clean Architecture에서 Domain 레이어는:
// - 비즈니스 규칙과 엔티티를 포함
// - 외부 프레임워크나 라이브러리에 의존하지 않음
// - 가장 안정적이고 변경이 적은 레이어
type Task struct {
	ID          uint      `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"` // pending, in_progress, completed
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TaskStatus constants define valid task statuses
// 상수를 사용하여 유효한 상태값을 명시적으로 정의
// Go Best Practice: 매직 스트링 대신 상수 사용
const (
	TaskStatusPending    = "pending"
	TaskStatusInProgress = "in_progress"
	TaskStatusCompleted  = "completed"
)

// NewTask creates a new task with default values
// 생성자 함수: 엔티티를 올바른 초기 상태로 생성
//
// Go Convention: New{TypeName} 패턴으로 생성자 함수 명명
// 왜 생성자 함수를 사용하는가?
// - 기본값 설정 보장
// - 생성 로직의 중앙화
// - 추후 생성 로직 변경 시 한 곳만 수정
func NewTask(title, description string) *Task {
	return &Task{
		Title:       title,
		Description: description,
		Status:      TaskStatusPending, // 기본 상태는 pending
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// Validate checks if the task has valid values
// 도메인 검증: 비즈니스 규칙에 따른 유효성 검사
//
// Go Pattern: Validate() error 패턴
// - 검증 실패 시 에러 반환
// - 검증 성공 시 nil 반환
func (t *Task) Validate() error {
	// Title은 필수이며 비어있으면 안됨
	if strings.TrimSpace(t.Title) == "" {
		return ErrInvalidTaskTitle
	}

	// Title은 100자를 초과할 수 없음
	if len(t.Title) > 100 {
		return ErrTaskTitleTooLong
	}

	// Description은 500자를 초과할 수 없음
	if len(t.Description) > 500 {
		return ErrTaskDescriptionTooLong
	}

	// Status는 정의된 값 중 하나여야 함
	if !t.IsValidStatus() {
		return ErrInvalidTaskStatus
	}

	return nil
}

// IsValidStatus checks if the task status is valid
// 상태 유효성 검사 헬퍼 메서드
//
// Go Best Practice: Boolean 반환 메서드는 Is, Has, Can 등으로 시작
func (t *Task) IsValidStatus() bool {
	switch t.Status {
	case TaskStatusPending, TaskStatusInProgress, TaskStatusCompleted:
		return true
	default:
		return false
	}
}

// IsCompleted checks if the task is completed
// 비즈니스 로직: 완료 여부 확인
func (t *Task) IsCompleted() bool {
	return t.Status == TaskStatusCompleted
}

// MarkAsCompleted marks the task as completed
// 상태 변경 메서드: 도메인 규칙에 따라 상태 변경
//
// Go Convention: 포인터 리시버(*Task)를 사용하여 구조체를 수정
// 왜 포인터 리시버를 사용하는가?
// - 구조체의 값을 실제로 변경해야 하므로
// - 값 복사 오버헤드 방지
func (t *Task) MarkAsCompleted() {
	t.Status = TaskStatusCompleted
	t.UpdatedAt = time.Now()
}

// MarkAsInProgress marks the task as in progress
func (t *Task) MarkAsInProgress() {
	t.Status = TaskStatusInProgress
	t.UpdatedAt = time.Now()
}

// Update updates the task with new values
// 엔티티 업데이트 메서드
//
// Design Choice: 부분 업데이트를 허용하는 구조
// - title이나 description이 빈 문자열이면 변경하지 않음
// - 항상 UpdatedAt을 갱신
func (t *Task) Update(title, description, status string) {
	if title != "" {
		t.Title = title
	}
	if description != "" {
		t.Description = description
	}
	if status != "" && t.isValidStatusValue(status) {
		t.Status = status
	}
	t.UpdatedAt = time.Now()
}

// isValidStatusValue is a private helper method
// private 헬퍼 메서드 (소문자로 시작 = unexported)
//
// Go Visibility: 소문자로 시작하는 함수/메서드는 패키지 내부에서만 사용 가능
func (t *Task) isValidStatusValue(status string) bool {
	switch status {
	case TaskStatusPending, TaskStatusInProgress, TaskStatusCompleted:
		return true
	default:
		return false
	}
}

// GetValidStatuses returns all valid task statuses
// 유효한 상태값 목록을 반환하는 헬퍼 함수
//
// Go Pattern: 함수는 대문자로 시작하여 exported (패키지 외부에서 접근 가능)
func GetValidStatuses() []string {
	return []string{
		TaskStatusPending,
		TaskStatusInProgress,
		TaskStatusCompleted,
	}
}

/*
주요 학습 포인트:

1. Domain Entity (도메인 엔티티)
   - 비즈니스의 핵심 개념을 표현
   - 프레임워크에 독립적
   - 비즈니스 규칙 포함

2. Constructor Pattern (생성자 패턴)
   - NewTask()로 일관된 초기 상태 보장
   - 기본값 설정의 중앙화

3. Method Receiver (메서드 리시버)
   - Pointer receiver (*Task): 구조체 수정
   - Value receiver (Task): 읽기 전용 (이 예제에는 없음)

4. Validation (검증)
   - 도메인 규칙에 따른 유효성 검사
   - 에러를 반환하여 호출자가 처리

5. Encapsulation (캡슐화)
   - public 메서드 (대문자): 외부 노출
   - private 메서드 (소문자): 내부 구현

6. Constants (상수)
   - 매직 스트링 대신 상수 사용
   - 코드의 가독성과 유지보수성 향상
*/
