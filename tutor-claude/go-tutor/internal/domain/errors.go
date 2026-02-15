package domain

import "errors"

// Domain errors define business rule violations
// 도메인 에러: 비즈니스 규칙 위반을 나타내는 에러들
//
// Go Best Practice: 에러는 패키지 레벨 변수로 정의
// - errors.New()로 생성
// - Err 접두사 사용 (Go Convention)
// - 재사용 가능하고 비교 가능한 에러

var (
	// Task validation errors
	// Task 검증 관련 에러
	ErrInvalidTaskTitle        = errors.New("task title cannot be empty")
	ErrTaskTitleTooLong        = errors.New("task title cannot exceed 100 characters")
	ErrTaskDescriptionTooLong  = errors.New("task description cannot exceed 500 characters")
	ErrInvalidTaskStatus       = errors.New("invalid task status")

	// Task not found errors
	// Task 조회 관련 에러
	ErrTaskNotFound = errors.New("task not found")

	// Task operation errors
	// Task 작업 관련 에러
	ErrTaskAlreadyExists = errors.New("task already exists")
)

/*
왜 도메인 레이어에 에러를 정의하는가?

1. 비즈니스 규칙의 일부
   - 에러는 비즈니스 규칙 위반을 나타냄
   - 도메인 로직과 밀접하게 관련

2. 레이어 독립성
   - 상위 레이어(usecase, delivery)가 도메인 에러 참조
   - 도메인 레이어는 다른 레이어에 의존하지 않음

3. 재사용성
   - 여러 레이어에서 동일한 에러 사용
   - 에러 비교 및 처리 용이

Go의 에러 처리 패턴:

1. Sentinel Errors (감시 에러)
   var ErrNotFound = errors.New("not found")
   - 패키지 레벨 변수로 정의
   - errors.Is()로 비교

2. Custom Error Types (커스텀 에러 타입)
   type ValidationError struct { ... }
   - 더 많은 컨텍스트가 필요할 때
   - Error() 메서드 구현

3. Error Wrapping (에러 래핑)
   fmt.Errorf("failed to save: %w", err)
   - 에러에 컨텍스트 추가
   - errors.Unwrap()으로 원본 에러 추출

현재 프로젝트는 Sentinel Errors 패턴 사용:
- 간단하고 명확
- 비교하기 쉬움
- 학습 목적에 적합
*/
