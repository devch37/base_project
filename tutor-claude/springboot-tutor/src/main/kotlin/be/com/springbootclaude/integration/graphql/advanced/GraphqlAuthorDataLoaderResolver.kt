package be.com.springbootclaude.integration.graphql.advanced

import be.com.springbootclaude.integration.graphql.shared.GraphqlArticle
import be.com.springbootclaude.integration.graphql.shared.GraphqlUser
import graphql.schema.DataFetchingEnvironment
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.stereotype.Controller
import java.util.concurrent.CompletableFuture

/**
 * GraphqlAuthorDataLoaderResolver: DataLoader 기반 Resolver
 *
 * 학습 포인트:
 * - DataLoader는 요청 내 캐시 + 배치 처리 제공
 * - @BatchMapping과 비교 학습용으로 별도 필드를 제공
 */
@Controller
class GraphqlAuthorDataLoaderResolver {

    @SchemaMapping(typeName = "Article", field = "authorViaLoader")
    fun authorViaLoader(
        article: GraphqlArticle,
        env: DataFetchingEnvironment
    ): CompletableFuture<GraphqlUser> {
        val loader = env.getDataLoader<Long, GraphqlUser>("authorLoader")
        return loader.load(article.authorId)
    }
}
