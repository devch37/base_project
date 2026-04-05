package be.com.springbootclaude.integration.grpc.advanced

import be.com.springbootclaude.grpc.GreeterGrpcKt
import be.com.springbootclaude.grpc.GreetingRequest
import be.com.springbootclaude.grpc.HelloRequest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import net.devh.boot.grpc.client.inject.GrpcClient
import org.springframework.stereotype.Service

/**
 * GrpcClientExample: gRPC Client 사용 예시
 *
 * 학습 포인트:
 * - @GrpcClient로 Stub 주입
 * - 같은 앱 내에서 gRPC 호출도 가능 (로컬 통신 시 유용)
 */
@Service
class GrpcClientExample(
    @GrpcClient("local")
    private val greeterStub: GreeterGrpcKt.GreeterCoroutineStub
) {

    suspend fun callHello(name: String): String {
        val response = greeterStub.sayHello(
            HelloRequest.newBuilder()
                .setName(name)
                .setRequestId("client-${System.currentTimeMillis()}")
                .build()
        )
        return response.message
    }

    suspend fun streamGreetings(name: String, count: Int): List<String> {
        return greeterStub.streamGreetings(
            GreetingRequest.newBuilder()
                .setName(name)
                .setCount(count)
                .build()
        ).map { it.message }.toList()
    }
}
