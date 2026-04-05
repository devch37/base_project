package be.com.springbootclaude.integration.grpc.basic

import be.com.springbootclaude.basic.exception.BusinessException
import io.grpc.Status
import io.grpc.StatusException
import org.springframework.stereotype.Component

/**
 * GrpcErrorMapper: 예외 -> gRPC Status 변환
 *
 * 학습 포인트:
 * - gRPC는 HTTP 상태코드 대신 Status를 사용합니다.
 * - 도메인 예외를 Status로 매핑하면 클라이언트가 일관되게 처리할 수 있습니다.
 */
@Component
class GrpcErrorMapper {

    fun toStatusException(ex: Throwable): StatusException {
        return when (ex) {
            is BusinessException -> mapBusinessException(ex)
            is IllegalArgumentException -> Status.INVALID_ARGUMENT.withDescription(ex.message).asException()
            else -> Status.INTERNAL.withDescription("알 수 없는 서버 오류").asException()
        }
    }

    private fun mapBusinessException(ex: BusinessException): StatusException {
        val status = when (ex.httpStatus.value()) {
            400 -> Status.INVALID_ARGUMENT
            401 -> Status.UNAUTHENTICATED
            403 -> Status.PERMISSION_DENIED
            404 -> Status.NOT_FOUND
            409 -> Status.ALREADY_EXISTS
            else -> Status.INTERNAL
        }
        return status.withDescription(ex.message).asException()
    }
}
