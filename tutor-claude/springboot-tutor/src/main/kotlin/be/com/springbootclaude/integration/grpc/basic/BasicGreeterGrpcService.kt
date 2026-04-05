package be.com.springbootclaude.integration.grpc.basic

import be.com.springbootclaude.grpc.GreeterGrpcKt
import be.com.springbootclaude.grpc.GreetingRequest
import be.com.springbootclaude.grpc.HelloReply
import be.com.springbootclaude.grpc.HelloRequest
import be.com.springbootclaude.integration.grpc.advanced.GrpcRequestContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import net.devh.boot.grpc.server.service.GrpcService
import org.slf4j.LoggerFactory
import java.util.UUID

/**
 * BasicGreeterGrpcService: gRPC 기본 서비스 구현체
 *
 * 학습 포인트:
 * - 서비스 구현체는 얇게, 비즈니스 로직은 ApplicationService로 위임
 * - 예외는 StatusException으로 변환하여 명확한 에러를 반환
 */
@GrpcService
class BasicGreeterGrpcService(
    private val validator: GrpcRequestValidator,
    private val greeterApplicationService: GreeterApplicationService,
    private val errorMapper: GrpcErrorMapper
) : GreeterGrpcKt.GreeterCoroutineImplBase() {

    private val logger = LoggerFactory.getLogger(javaClass)

    override suspend fun sayHello(request: HelloRequest): HelloReply {
        return try {
            validator.validateName(request.name)

            val requestId = request.requestId.ifBlank {
                GrpcRequestContext.getRequestId() ?: UUID.randomUUID().toString()
            }
            val result = greeterApplicationService.buildGreeting(request.name, requestId)

            HelloReply.newBuilder()
                .setMessage(result.message)
                .setRequestId(result.requestId)
                .setServerTime(result.serverTime)
                .build()
        } catch (ex: Exception) {
            logger.warn("gRPC SayHello 실패: ${ex.message}", ex)
            throw errorMapper.toStatusException(ex)
        }
    }

    override fun streamGreetings(request: GreetingRequest): Flow<HelloReply> {
        return flow {
            try {
                validator.validateName(request.name)
                validator.validateCount(request.count)

                val requestId = GrpcRequestContext.getRequestId() ?: UUID.randomUUID().toString()

                repeat(request.count) { index ->
                    val result = greeterApplicationService.buildGreeting(
                        name = request.name,
                        requestId = "$requestId-$index"
                    )

                    emit(
                        HelloReply.newBuilder()
                            .setMessage(result.message)
                            .setRequestId(result.requestId)
                            .setServerTime(result.serverTime)
                            .build()
                    )

                    // streaming 체험을 위한 딜레이 (실무에서는 제거/조정)
                    delay(200)
                }
            } catch (ex: Exception) {
                logger.warn("gRPC StreamGreetings 실패: ${ex.message}", ex)
                throw errorMapper.toStatusException(ex)
            }
        }
    }
}
