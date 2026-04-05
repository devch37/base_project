package be.com.springbootclaude.integration.graphql.advanced

import be.com.springbootclaude.basic.exception.BusinessException
import graphql.GraphQLError
import graphql.GraphqlErrorBuilder
import graphql.schema.DataFetchingEnvironment
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter
import org.springframework.graphql.execution.ErrorType
import org.springframework.stereotype.Component

/**
 * GraphqlExceptionResolver: 예외 -> GraphQL 에러 변환
 *
 * 학습 포인트:
 * - GraphQL은 HTTP 200으로 에러를 포함해 응답하는 경우가 많습니다.
 * - 에러 코드/메시지를 extensions에 넣어 클라이언트가 처리하기 쉽게 합니다.
 */
@Component
class GraphqlExceptionResolver : DataFetcherExceptionResolverAdapter() {

    override fun resolveToSingleError(ex: Throwable, env: DataFetchingEnvironment): GraphQLError? {
        return when (ex) {
            is BusinessException -> GraphqlErrorBuilder.newError(env)
                .message(ex.message)
                .errorType(ErrorType.BAD_REQUEST)
                .extensions(mapOf("code" to ex.errorCode))
                .build()
            is IllegalArgumentException -> GraphqlErrorBuilder.newError(env)
                .message(ex.message ?: "잘못된 요청입니다")
                .errorType(ErrorType.BAD_REQUEST)
                .build()
            else -> GraphqlErrorBuilder.newError(env)
                .message("알 수 없는 서버 오류")
                .errorType(ErrorType.INTERNAL_ERROR)
                .build()
        }
    }
}
