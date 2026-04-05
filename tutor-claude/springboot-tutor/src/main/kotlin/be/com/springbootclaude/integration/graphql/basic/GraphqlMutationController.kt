package be.com.springbootclaude.integration.graphql.basic

import be.com.springbootclaude.basic.dto.CreateArticleRequest
import be.com.springbootclaude.basic.service.ArticleService
import be.com.springbootclaude.integration.graphql.shared.GraphqlArticle
import be.com.springbootclaude.integration.graphql.shared.GraphqlArticlePayload
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.MutationMapping
import org.springframework.stereotype.Controller

/**
 * GraphqlMutationController: Mutation 전용 Resolver
 *
 * 학습 포인트:
 * - Mutation은 상태 변경 전용
 * - REST용 Service를 재사용하되, GraphQL 입력/출력 DTO는 분리합니다.
 */
@Controller
class GraphqlMutationController(
    private val articleService: ArticleService
) {

    @MutationMapping
    fun createArticle(@Argument input: CreateArticleInput): GraphqlArticlePayload {
        val response = articleService.createArticle(
            CreateArticleRequest(
                title = input.title,
                content = input.content,
                authorId = input.authorId
            )
        )

        return GraphqlArticlePayload(
            article = GraphqlArticle.from(response),
            message = "기사 생성 완료"
        )
    }

    @MutationMapping
    fun publishArticle(@Argument id: Long): GraphqlArticlePayload {
        val response = articleService.publishArticle(id)
        return GraphqlArticlePayload(
            article = GraphqlArticle.from(response),
            message = "기사 게시 완료"
        )
    }
}
