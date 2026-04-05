package be.com.springbootclaude.integration.graphql.shared

import be.com.springbootclaude.basic.domain.Article
import be.com.springbootclaude.basic.domain.ArticleStatus
import be.com.springbootclaude.basic.dto.ArticleResponse
import be.com.springbootclaude.basic.domain.User
import be.com.springbootclaude.basic.dto.UserResponse
import java.time.LocalDateTime

/**
 * GraphQL 공통 모델
 *
 * 학습 포인트:
 * - GraphQL은 Schema-First이므로, 스키마 타입과 1:1로 매칭되는 DTO를 두면 명확합니다.
 * - REST DTO와 분리하면 채널별 스펙 변화에 유연해집니다.
 */

data class GraphqlUser(
    val id: Long,
    val email: String,
    val name: String,
    val role: String
) {
    companion object {
        fun from(user: UserResponse): GraphqlUser {
            return GraphqlUser(
                id = user.id,
                email = user.email,
                name = user.name,
                role = user.role.name
            )
        }

        fun from(user: User): GraphqlUser {
            return GraphqlUser(
                id = user.id!!,
                email = user.email,
                name = user.name,
                role = user.role.name
            )
        }
    }
}

data class GraphqlArticle(
    val id: Long,
    val title: String,
    val content: String,
    val status: ArticleStatus,
    val viewCount: Long,
    val authorId: Long,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun from(article: Article): GraphqlArticle {
            return GraphqlArticle(
                id = article.id!!,
                title = article.title,
                content = article.content,
                status = article.status,
                viewCount = article.viewCount,
                // Hibernate 프록시는 ID를 즉시 제공할 수 있어 N+1을 줄입니다.
                authorId = article.author.id!!,
                createdAt = article.createdAt,
                updatedAt = article.updatedAt
            )
        }

        fun from(response: ArticleResponse): GraphqlArticle {
            return GraphqlArticle(
                id = response.id,
                title = response.title,
                content = response.content,
                status = response.status,
                viewCount = response.viewCount,
                authorId = response.author.id,
                createdAt = response.createdAt,
                updatedAt = response.updatedAt
            )
        }
    }
}

data class PageInfo(
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val hasNext: Boolean
)

data class GraphqlArticlePage(
    val content: List<GraphqlArticle>,
    val pageInfo: PageInfo
)

data class GraphqlArticlePayload(
    val article: GraphqlArticle,
    val message: String?
)

data class ArticleEdge(
    val cursor: String,
    val node: GraphqlArticle
)

data class CursorPageInfo(
    val endCursor: String?,
    val hasNext: Boolean
)

data class ArticleConnection(
    val edges: List<ArticleEdge>,
    val pageInfo: CursorPageInfo
)
