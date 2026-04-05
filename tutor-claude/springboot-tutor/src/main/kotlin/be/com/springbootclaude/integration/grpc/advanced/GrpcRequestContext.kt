package be.com.springbootclaude.integration.grpc.advanced

import io.grpc.Context

/**
 * GrpcRequestContext: gRPC Context를 활용한 요청 스코프 데이터 저장
 *
 * 학습 포인트:
 * - gRPC는 ThreadLocal 대신 Context를 사용합니다.
 * - Interceptor에서 넣고 Service에서 꺼내는 패턴이 실무에서 자주 쓰입니다.
 */
object GrpcRequestContext {

    private val requestIdKey: Context.Key<String> = Context.key("requestId")
    private val userIdKey: Context.Key<String> = Context.key("userId")

    fun getRequestId(): String? = requestIdKey.get()

    fun getUserId(): String? = userIdKey.get()

    fun contextWith(requestId: String, userId: String?): Context {
        var ctx = Context.current().withValue(requestIdKey, requestId)
        if (userId != null) {
            ctx = ctx.withValue(userIdKey, userId)
        }
        return ctx
    }

    fun contextWithUserId(userId: String): Context {
        return Context.current().withValue(userIdKey, userId)
    }
}
