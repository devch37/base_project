package be.com.springbootclaude.integration.graphql.advanced

import be.com.springbootclaude.basic.repository.UserRepository
import be.com.springbootclaude.integration.graphql.shared.GraphqlArticle
import be.com.springbootclaude.integration.graphql.shared.GraphqlUser
import org.springframework.graphql.data.method.annotation.BatchMapping
import org.springframework.stereotype.Controller

/**
 * GraphqlAuthorBatchResolver: N+1 문제 해결 예시
 *
 * 학습 포인트:
 * - GraphQL에서 가장 흔한 성능 문제는 N+1입니다.
 * - @BatchMapping을 사용하면 한 번의 쿼리로 해결 가능합니다.
 */
@Controller
class GraphqlAuthorBatchResolver(
    private val userRepository: UserRepository
) {

    @BatchMapping(typeName = "Article", field = "author")
    fun author(articles: List<GraphqlArticle>): Map<GraphqlArticle, GraphqlUser> {
        val authorIds = articles.map { it.authorId }.distinct()
        val users = userRepository.findAllById(authorIds).associateBy { it.id!! }

        return articles.associateWith { article ->
            val user = users[article.authorId]
            requireNotNull(user) { "Author not found: ${article.authorId}" }
            GraphqlUser.from(user)
        }
    }
}
