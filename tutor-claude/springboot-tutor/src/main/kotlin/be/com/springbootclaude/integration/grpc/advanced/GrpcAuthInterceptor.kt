package be.com.springbootclaude.integration.grpc.advanced

import io.grpc.Context
import io.grpc.Contexts
import io.grpc.Metadata
import io.grpc.ServerCall
import io.grpc.ServerCallHandler
import io.grpc.ServerInterceptor
import net.devh.boot.grpc.server.interceptor.GrpcGlobalServerInterceptor
import org.slf4j.LoggerFactory

/**
 * GrpcAuthInterceptor: 메타데이터 기반 간단 인증 처리
 *
 * 학습 포인트:
 * - 실무에서는 JWT/MTLS 등을 사용하지만, 학습용으로 x-user-id 헤더를 사용합니다.
 * - 인증/인가 로직은 Interceptor에서 처리하는 것이 일반적입니다.
 */
@GrpcGlobalServerInterceptor
class GrpcAuthInterceptor : ServerInterceptor {

    private val logger = LoggerFactory.getLogger(javaClass)
    private val userIdKey: Metadata.Key<String> =
        Metadata.Key.of("x-user-id", Metadata.ASCII_STRING_MARSHALLER)

    override fun <ReqT : Any?, RespT : Any?> interceptCall(
        call: ServerCall<ReqT, RespT>,
        headers: Metadata,
        next: ServerCallHandler<ReqT, RespT>
    ): ServerCall.Listener<ReqT> {
        val userId = headers.get(userIdKey)

        if (userId.isNullOrBlank()) {
            // 학습용: 인증 없으면 익명으로 처리
            // 실무에서는 아래처럼 차단하는 것이 일반적입니다.
            // call.close(Status.UNAUTHENTICATED.withDescription("로그인이 필요합니다"), Metadata())
            // return object : ServerCall.Listener<ReqT>() {}
            logger.debug("gRPC anonymous request")
            return Contexts.interceptCall(Context.current(), call, headers, next)
        }

        val context = GrpcRequestContext.contextWithUserId(userId)
        return Contexts.interceptCall(context, call, headers, next)
    }
}
