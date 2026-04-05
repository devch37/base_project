package be.com.springbootclaude.integration.graphql.basic

import be.com.springbootclaude.integration.graphql.shared.GraphqlArticle
import be.com.springbootclaude.integration.graphql.shared.ArticleConnection
import be.com.springbootclaude.integration.graphql.shared.GraphqlArticlePage
import be.com.springbootclaude.integration.graphql.shared.GraphqlUser
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.stereotype.Controller

/**
 * GraphqlQueryController: Query 전용 Resolver
 *
 * 학습 포인트:
 * - Query는 조회 전용, 사이드 이펙트가 없어야 합니다.
 * - 복잡한 로직은 서비스로 위임합니다.
 */
@Controller
class GraphqlQueryController(
    private val articleQueryService: GraphqlArticleQueryService,
    private val userQueryService: GraphqlUserQueryService
) {

    @QueryMapping
    fun userById(@Argument id: Long): GraphqlUser {
        return userQueryService.getUserById(id)
    }

    @QueryMapping
    fun userByEmail(@Argument email: String): GraphqlUser {
        return userQueryService.getUserByEmail(email)
    }

    @QueryMapping
    fun articleById(@Argument id: Long): GraphqlArticle {
        return articleQueryService.getArticleById(id)
    }

    @QueryMapping
    fun publishedArticles(
        @Argument page: Int?,
        @Argument size: Int?
    ): GraphqlArticlePage {
        return articleQueryService.getPublishedArticles(
            page = page ?: 0,
            size = size ?: 10
        )
    }

    @QueryMapping
    fun searchArticles(
        @Argument keyword: String,
        @Argument page: Int?,
        @Argument size: Int?
    ): GraphqlArticlePage {
        return articleQueryService.searchArticles(
            keyword = keyword,
            page = page ?: 0,
            size = size ?: 10
        )
    }

    @QueryMapping
    fun searchArticlesAdvanced(
        @Argument filter: ArticleFilterInput?,
        @Argument page: Int?,
        @Argument size: Int?
    ): GraphqlArticlePage {
        return articleQueryService.searchArticlesAdvanced(
            filter = filter,
            page = page ?: 0,
            size = size ?: 10
        )
    }

    @QueryMapping
    fun publishedArticlesCursor(@Argument input: CursorPageInput?): ArticleConnection {
        return articleQueryService.publishedArticlesCursor(input)
    }
}
