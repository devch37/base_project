package be.com.springbootclaude.exception

import org.springframework.http.HttpStatus

/**
 * BusinessException: 비즈니스 로직 예외의 기본 클래스
 *
 * 학습 포인트:
 * 1. 도메인별 예외 계층을 만들면 예외 처리가 체계적입니다.
 * 2. HTTP 상태 코드를 예외에 포함시키면 GlobalExceptionHandler에서 일관되게 처리할 수 있습니다.
 * 3. errorCode를 추가하면 클라이언트가 에러를 프로그래밍적으로 처리할 수 있습니다.
 *
 * 실무 팁:
 * - RuntimeException을 상속하면 @Transactional에서 자동 롤백됩니다.
 * - Checked Exception(Exception 상속)은 롤백되지 않으므로 주의!
 * - 도메인별로 예외를 분리하면 각 계층의 책임이 명확해집니다.
 */
abstract class BusinessException(
    message: String,
    val errorCode: String,
    val httpStatus: HttpStatus = HttpStatus.BAD_REQUEST
) : RuntimeException(message)

/**
 * EntityNotFoundException: 엔티티를 찾을 수 없을 때
 *
 * 학습 포인트:
 * - 404 Not Found를 반환하는 예외
 * - NoSuchElementException 대신 커스텀 예외를 사용하면 더 명확합니다.
 */
class EntityNotFoundException(
    entityName: String,
    id: Any
) : BusinessException(
    message = "$entityName 을(를) 찾을 수 없습니다: $id",
    errorCode = "ENTITY_NOT_FOUND",
    httpStatus = HttpStatus.NOT_FOUND
)

/**
 * DuplicateEntityException: 중복된 엔티티가 있을 때
 *
 * 학습 포인트:
 * - 409 Conflict를 반환하는 예외
 * - 이메일 중복 등의 케이스에 사용
 */
class DuplicateEntityException(
    message: String
) : BusinessException(
    message = message,
    errorCode = "DUPLICATE_ENTITY",
    httpStatus = HttpStatus.CONFLICT
)

/**
 * InvalidStateException: 유효하지 않은 상태 전이 시도
 *
 * 학습 포인트:
 * - 400 Bad Request를 반환하는 예외
 * - 예: 이미 게시된 기사를 다시 게시하려고 할 때
 */
class InvalidStateException(
    message: String
) : BusinessException(
    message = message,
    errorCode = "INVALID_STATE",
    httpStatus = HttpStatus.BAD_REQUEST
)

/**
 * UnauthorizedException: 인증되지 않은 접근
 *
 * 학습 포인트:
 * - 401 Unauthorized를 반환
 * - Phase 4에서 Security를 구현할 때 사용할 예정
 */
class UnauthorizedException(
    message: String = "인증이 필요합니다"
) : BusinessException(
    message = message,
    errorCode = "UNAUTHORIZED",
    httpStatus = HttpStatus.UNAUTHORIZED
)

/**
 * ForbiddenException: 권한 없는 접근
 *
 * 학습 포인트:
 * - 403 Forbidden을 반환
 * - 인증은 되었지만 권한이 없을 때 (예: 다른 사람의 글 수정 시도)
 */
class ForbiddenException(
    message: String = "권한이 없습니다"
) : BusinessException(
    message = message,
    errorCode = "FORBIDDEN",
    httpStatus = HttpStatus.FORBIDDEN
)
