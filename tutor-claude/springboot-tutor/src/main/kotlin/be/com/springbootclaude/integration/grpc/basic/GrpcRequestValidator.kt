package be.com.springbootclaude.integration.grpc.basic

import be.com.springbootclaude.basic.exception.BusinessException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

/**
 * GrpcRequestValidator: gRPC 입력 검증 전용 컴포넌트
 *
 * 학습 포인트:
 * - gRPC는 HTTP/JSON이 아니라서 @Valid를 그대로 쓰기 어렵습니다.
 * - 서비스 계층 앞에서 명시적으로 검증하는 패턴이 실무에서 흔합니다.
 */
@Component
class GrpcRequestValidator {

    fun validateName(name: String) {
        if (name.isBlank()) {
            throw GrpcValidationException("name은 비어 있을 수 없습니다")
        }
        if (name.length > 50) {
            throw GrpcValidationException("name은 50자 이하만 허용됩니다")
        }
    }

    fun validateCount(count: Int) {
        if (count <= 0) {
            throw GrpcValidationException("count는 1 이상이어야 합니다")
        }
        if (count > 20) {
            throw GrpcValidationException("count는 20 이하만 허용됩니다")
        }
    }
}

/**
 * gRPC 전용 Validation 예외
 *
 * 실무 팁:
 * - 도메인 예외와 분리하면 에러 매핑이 명확해집니다.
 */
class GrpcValidationException(message: String) : BusinessException(
    message = message,
    errorCode = "GRPC_INVALID_ARGUMENT",
    httpStatus = HttpStatus.BAD_REQUEST
)
