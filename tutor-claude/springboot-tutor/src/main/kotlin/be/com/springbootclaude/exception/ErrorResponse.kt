package be.com.springbootclaude.exception

import com.fasterxml.jackson.annotation.JsonInclude
import org.springframework.http.HttpStatus
import java.time.LocalDateTime

/**
 * ErrorResponse: RFC 7807 Problem Details 스펙을 참고한 에러 응답
 *
 * 학습 포인트:
 * 1. RFC 7807은 HTTP API의 표준 에러 응답 포맷입니다.
 * 2. @JsonInclude(JsonInclude.Include.NON_NULL): null 필드는 JSON에서 제외합니다.
 * 3. timestamp, path 등의 메타데이터를 추가하면 디버깅이 쉬워집니다.
 *
 * 실무 팁:
 * - 일관된 에러 응답 포맷을 사용하면 클라이언트 개발자가 에러를 처리하기 쉽습니다.
 * - errorCode를 추가하면 클라이언트가 에러 종류를 프로그래밍적으로 판단할 수 있습니다.
 * - validation 에러는 errors 배열에 필드별 상세 정보를 담습니다.
 *
 * RFC 7807 표준 필드:
 * - type: 에러 타입 URI (선택)
 * - title: 짧은 에러 제목
 * - status: HTTP 상태 코드
 * - detail: 상세 에러 메시지
 * - instance: 요청 경로
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class ErrorResponse(
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val status: Int,
    val error: String,
    val errorCode: String,
    val message: String,
    val path: String? = null,
    val errors: List<FieldError>? = null
) {
    companion object {
        /**
         * BusinessException으로부터 ErrorResponse 생성
         */
        fun from(ex: BusinessException, path: String?): ErrorResponse {
            return ErrorResponse(
                status = ex.httpStatus.value(),
                error = ex.httpStatus.reasonPhrase,
                errorCode = ex.errorCode,
                message = ex.message ?: "알 수 없는 오류가 발생했습니다",
                path = path
            )
        }

        /**
         * 일반 예외로부터 ErrorResponse 생성
         */
        fun from(httpStatus: HttpStatus, message: String, path: String?): ErrorResponse {
            return ErrorResponse(
                status = httpStatus.value(),
                error = httpStatus.reasonPhrase,
                errorCode = "INTERNAL_ERROR",
                message = message,
                path = path
            )
        }

        /**
         * Validation 에러로부터 ErrorResponse 생성
         */
        fun fromValidationErrors(
            errors: List<FieldError>,
            path: String?
        ): ErrorResponse {
            return ErrorResponse(
                status = HttpStatus.BAD_REQUEST.value(),
                error = HttpStatus.BAD_REQUEST.reasonPhrase,
                errorCode = "VALIDATION_ERROR",
                message = "입력값 검증에 실패했습니다",
                path = path,
                errors = errors
            )
        }
    }
}

/**
 * FieldError: 필드별 검증 에러
 *
 * 학습 포인트:
 * - Validation 에러는 어떤 필드에서 어떤 이유로 실패했는지 상세히 알려줘야 합니다.
 * - 클라이언트는 이 정보로 사용자에게 친절한 에러 메시지를 표시할 수 있습니다.
 */
data class FieldError(
    val field: String,
    val rejectedValue: Any?,
    val message: String
)
