package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/go-tutor/internal/domain"
)

// Response represents a standard API response
// 표준 API 응답 구조체
//
// 일관된 응답 형식:
// - 모든 API가 동일한 형식으로 응답
// - 클라이언트가 예측 가능한 응답 처리
// - 에러 처리 표준화
type Response struct {
	Success bool        `json:"success"`           // 성공 여부
	Message string      `json:"message,omitempty"` // 메시지 (선택적)
	Data    interface{} `json:"data,omitempty"`    // 응답 데이터 (선택적)
	Error   string      `json:"error,omitempty"`   // 에러 메시지 (선택적)
}

// RespondSuccess sends a successful response
// 성공 응답 전송
//
// Go Best Practice: 헬퍼 함수로 중복 코드 제거
// - 모든 핸들러에서 동일한 응답 형식 사용
// - 변경 시 한 곳만 수정
func RespondSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// RespondError sends an error response
// 에러 응답 전송
//
// 도메인 에러를 HTTP 응답으로 변환:
// - 도메인 에러 타입에 따라 적절한 HTTP 상태 코드 선택
// - 에러 메시지를 사용자 친화적으로 변환
func RespondError(c *gin.Context, err error) {
	// 에러 타입별 HTTP 상태 코드 매핑
	statusCode := http.StatusInternalServerError
	errorMessage := err.Error()

	// Go Pattern: Type Switch로 에러 타입 분기
	// Domain 에러를 HTTP 상태 코드로 변환
	switch err {
	case domain.ErrTaskNotFound:
		statusCode = http.StatusNotFound
	case domain.ErrInvalidTaskTitle,
		domain.ErrTaskTitleTooLong,
		domain.ErrTaskDescriptionTooLong,
		domain.ErrInvalidTaskStatus:
		statusCode = http.StatusBadRequest
	case domain.ErrTaskAlreadyExists:
		statusCode = http.StatusConflict
	default:
		// 알 수 없는 에러는 500 Internal Server Error
		statusCode = http.StatusInternalServerError
		// 프로덕션에서는 내부 에러 상세를 숨기고 일반 메시지 반환
		errorMessage = "Internal server error"
	}

	c.JSON(statusCode, Response{
		Success: false,
		Error:   errorMessage,
	})
}

// RespondValidationError sends a validation error response
// 요청 검증 에러 응답
//
// Gin의 binding 검증 실패 시 사용
func RespondValidationError(c *gin.Context, err error) {
	c.JSON(http.StatusBadRequest, Response{
		Success: false,
		Error:   "Validation failed: " + err.Error(),
	})
}

/*
주요 학습 포인트:

1. Consistent API Response (일관된 API 응답)
   - 모든 엔드포인트가 동일한 형식 사용
   - 클라이언트 통합 용이
   - 에러 처리 표준화

2. HTTP Status Codes (HTTP 상태 코드)
   - 200 OK: 성공
   - 201 Created: 리소스 생성 성공
   - 400 Bad Request: 잘못된 요청 (검증 실패)
   - 404 Not Found: 리소스 없음
   - 409 Conflict: 충돌 (이미 존재)
   - 500 Internal Server Error: 서버 에러

3. Domain to HTTP Translation (도메인-HTTP 변환)
   - 도메인 에러를 HTTP 상태 코드로 매핑
   - 비즈니스 로직과 HTTP 레이어 분리

4. Error Handling Best Practices
   - 내부 에러 상세 정보 숨김 (보안)
   - 사용자 친화적 에러 메시지
   - 로깅으로 디버깅 정보 별도 관리

5. JSON Tags
   - json:"field_name": JSON 필드명 지정
   - omitempty: 빈 값이면 JSON에서 제외

응답 예시:

성공:
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1,
    "title": "Learn Go",
    "status": "pending"
  }
}

에러:
{
  "success": false,
  "error": "task not found"
}
*/
