package be.com.springbootclaude.integration.grpc.advanced

import io.grpc.Contexts
import io.grpc.Metadata
import io.grpc.ServerCall
import io.grpc.ServerCallHandler
import io.grpc.ServerInterceptor
import net.devh.boot.grpc.server.interceptor.GrpcGlobalServerInterceptor
import org.slf4j.LoggerFactory
import java.util.UUID

/**
 * GrpcCorrelationInterceptor: 요청 추적을 위한 Correlation ID 처리
 *
 * 학습 포인트:
 * - gRPC Metadata 헤더에서 request-id를 읽고, 없으면 생성합니다.
 * - Context에 저장하여 Service에서 꺼내 사용할 수 있게 합니다.
 */
@GrpcGlobalServerInterceptor
class GrpcCorrelationInterceptor : ServerInterceptor {

    private val logger = LoggerFactory.getLogger(javaClass)
    private val requestIdKey: Metadata.Key<String> =
        Metadata.Key.of("x-request-id", Metadata.ASCII_STRING_MARSHALLER)

    override fun <ReqT : Any?, RespT : Any?> interceptCall(
        call: ServerCall<ReqT, RespT>,
        headers: Metadata,
        next: ServerCallHandler<ReqT, RespT>
    ): ServerCall.Listener<ReqT> {
        val requestId = headers.get(requestIdKey) ?: UUID.randomUUID().toString()
        logger.debug("gRPC request-id: {}", requestId)

        val context = GrpcRequestContext.contextWith(requestId = requestId, userId = null)
        return Contexts.interceptCall(context, call, headers, next)
    }
}
