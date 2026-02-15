package be.com.springbootclaude.basic.exception

import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

private val logger = KotlinLogging.logger {}

/**
 * GlobalExceptionHandler: 전역 예외 처리
 *
 * 학습 포인트:
 * 1. @RestControllerAdvice: 모든 컨트롤러에서 발생하는 예외를 중앙에서 처리합니다.
 * 2. @ExceptionHandler: 특정 예외 타입을 처리하는 메서드를 지정합니다.
 * 3. ResponseEntity: HTTP 상태 코드와 응답 본문을 함께 반환합니다.
 *
 * 실무 팁:
 * - 컨트롤러마다 try-catch를 작성하지 마세요! GlobalExceptionHandler에서 일관되게 처리하세요.
 * - 예외별로 로깅 레벨을 다르게 설정하세요 (비즈니스 예외는 WARN, 시스템 예외는 ERROR).
 * - 운영 환경에서는 상세한 에러 메시지(스택 트레이스 등)를 클라이언트에 노출하지 마세요.
 *
 * 예외 처리 우선순위:
 * 1. 가장 구체적인 예외 타입부터 처리
 * 2. 부모 클래스 예외는 나중에 처리
 * 3. Exception(최상위)은 맨 마지막에 처리
 */
@RestControllerAdvice
class GlobalExceptionHandler {

    /**
     * BusinessException 처리
     *
     * 학습 포인트:
     * - 비즈니스 로직 예외는 예상 가능한 예외이므로 WARN 레벨로 로깅합니다.
     * - 예외에 정의된 HTTP 상태 코드를 사용합니다.
     */
    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(
        ex: BusinessException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn { "Business exception occurred: ${ex.message}" }

        val errorResponse = ErrorResponse.from(ex, request.requestURI)
        return ResponseEntity
            .status(ex.httpStatus)
            .body(errorResponse)
    }

    /**
     * Validation 예외 처리 (Jakarta Validation)
     *
     * 학습 포인트:
     * - @Valid 어노테이션으로 DTO 검증 실패 시 발생합니다.
     * - MethodArgumentNotValidException에서 필드별 에러 정보를 추출합니다.
     * - 클라이언트에게 어떤 필드가 왜 실패했는지 상세히 알려줍니다.
     *
     * 실무 팁:
     * - Validation 에러는 클라이언트의 잘못이므로 INFO 레벨로 로깅합니다.
     * - 모든 검증 에러를 한 번에 반환하면 사용자 경험이 좋아집니다.
     */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.info { "Validation failed: ${ex.bindingResult.errorCount} errors" }

        val fieldErrors = ex.bindingResult.fieldErrors.map { error ->
            FieldError(
                field = error.field,
                rejectedValue = error.rejectedValue,
                message = error.defaultMessage ?: "검증 실패"
            )
        }

        val errorResponse = ErrorResponse.fromValidationErrors(
            errors = fieldErrors,
            path = request.requestURI
        )

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorResponse)
    }

    /**
     * NoSuchElementException 처리
     *
     * 학습 포인트:
     * - Kotlin의 표준 예외를 처리하는 예시
     * - 엔티티를 찾지 못했을 때 발생
     */
    @ExceptionHandler(NoSuchElementException::class)
    fun handleNoSuchElementException(
        ex: NoSuchElementException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn { "Entity not found: ${ex.message}" }

        val errorResponse = ErrorResponse.from(
            httpStatus = HttpStatus.NOT_FOUND,
            message = ex.message ?: "요청한 리소스를 찾을 수 없습니다",
            path = request.requestURI
        )

        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(errorResponse)
    }

    /**
     * IllegalArgumentException 처리
     *
     * 학습 포인트:
     * - 잘못된 인자가 전달되었을 때 발생
     * - 비즈니스 규칙 위반 시 사용
     */
    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(
        ex: IllegalArgumentException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn { "Invalid argument: ${ex.message}" }

        val errorResponse = ErrorResponse.from(
            httpStatus = HttpStatus.BAD_REQUEST,
            message = ex.message ?: "잘못된 요청입니다",
            path = request.requestURI
        )

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorResponse)
    }

    /**
     * 예상하지 못한 예외 처리 (최후의 방어선)
     *
     * 학습 포인트:
     * - 모든 예외의 최상위 클래스(Exception)를 처리합니다.
     * - 예상하지 못한 예외이므로 ERROR 레벨로 로깅하고, 스택 트레이스를 기록합니다.
     * - 운영 환경에서는 상세한 에러 메시지를 숨기고 일반적인 메시지만 반환합니다.
     *
     * 실무 팁:
     * - 이 핸들러가 자주 호출된다면 예외 처리 전략을 재검토해야 합니다.
     * - Sentry, CloudWatch 등의 모니터링 도구와 연동하면 좋습니다.
     */
    @ExceptionHandler(Exception::class)
    fun handleException(
        ex: Exception,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error(ex) { "Unexpected exception occurred: ${ex.message}" }

        val errorResponse = ErrorResponse.from(
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
            message = "서버 내부 오류가 발생했습니다", // 운영에서는 상세 정보 노출 금지
            path = request.requestURI
        )

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(errorResponse)
    }
}
