package be.com.springbootclaude.integration.grpc.basic

import org.springframework.stereotype.Service
import java.time.Clock
import java.time.Instant

/**
 * GreeterApplicationService: gRPC 비즈니스 로직 (Application Layer)
 *
 * 학습 포인트:
 * - gRPC 서비스 구현체는 얇게 유지하고, 비즈니스 로직은 별도 서비스로 분리합니다.
 * - 테스트가 쉬워지고, HTTP/GraphQL 등 다른 채널에서 재사용 가능합니다.
 */
@Service
class GreeterApplicationService {

    private val clock: Clock = Clock.systemUTC()

    fun buildGreeting(name: String, requestId: String): GreetingResult {
        return GreetingResult(
            message = "Hello, $name!",
            requestId = requestId,
            serverTime = Instant.now(clock).toString()
        )
    }
}

data class GreetingResult(
    val message: String,
    val requestId: String,
    val serverTime: String
)
