package be.com.springbootclaude.integration.graphql.basic

import be.com.springbootclaude.basic.domain.ArticleStatus
import be.com.springbootclaude.basic.exception.EntityNotFoundException
import be.com.springbootclaude.basic.repository.ArticleRepository
import be.com.springbootclaude.integration.graphql.shared.GraphqlArticle
import be.com.springbootclaude.integration.graphql.shared.ArticleConnection
import be.com.springbootclaude.integration.graphql.shared.ArticleEdge
import be.com.springbootclaude.integration.graphql.shared.GraphqlArticlePage
import be.com.springbootclaude.integration.graphql.shared.CursorPageInfo
import be.com.springbootclaude.integration.graphql.shared.PageInfo
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import be.com.springbootclaude.integration.graphql.advanced.GraphqlCursorUtils

/**
 * GraphqlArticleQueryService: GraphQL 전용 조회 서비스
 *
 * 학습 포인트:
 * - GraphQL Query는 사이드 이펙트가 없어야 합니다.
 * - REST 서비스와 분리해도 되고, 공용 서비스로 합쳐도 됩니다.
 */
@Service
@Transactional(readOnly = true)
class GraphqlArticleQueryService(
    private val articleRepository: ArticleRepository
) {

    fun getArticleById(id: Long): GraphqlArticle {
        val article = articleRepository.findByIdOrNull(id)
            ?: throw EntityNotFoundException("Article", id)
        return GraphqlArticle.from(article)
    }

    fun getPublishedArticles(page: Int, size: Int): GraphqlArticlePage {
        val pageable = pageRequest(page, size)
        val result = articleRepository.findPublishedArticlesWithAuthor(
            status = ArticleStatus.PUBLISHED,
            pageable = pageable
        )

        return GraphqlArticlePage(
            content = result.content.map { GraphqlArticle.from(it) },
            pageInfo = toPageInfo(result.number, result.size, result.totalElements, result.totalPages)
        )
    }

    fun searchArticles(keyword: String, page: Int, size: Int): GraphqlArticlePage {
        val pageable = pageRequest(page, size)
        val result = articleRepository.findByTitleContainingIgnoreCase(keyword, pageable)

        return GraphqlArticlePage(
            content = result.content.map { GraphqlArticle.from(it) },
            pageInfo = toPageInfo(result.number, result.size, result.totalElements, result.totalPages)
        )
    }

    fun searchArticlesAdvanced(
        filter: ArticleFilterInput?,
        page: Int,
        size: Int
    ): GraphqlArticlePage {
        val pageable = pageRequest(page, size)
        val result = articleRepository.searchArticlesAdvanced(
            status = filter?.status,
            authorId = filter?.authorId,
            keyword = filter?.keyword,
            fromDate = parseDate(filter?.from, "from"),
            toDate = parseDate(filter?.to, "to"),
            pageable = pageable
        )

        return GraphqlArticlePage(
            content = result.content.map { GraphqlArticle.from(it) },
            pageInfo = toPageInfo(result.number, result.size, result.totalElements, result.totalPages)
        )
    }

    fun publishedArticlesCursor(input: CursorPageInput?): ArticleConnection {
        val size = (input?.size ?: 10).coerceIn(1, 50)

        val cursor = input?.after?.let { GraphqlCursorUtils.decode(it) }
        val result = articleRepository.findPublishedAfterCursor(
            status = ArticleStatus.PUBLISHED,
            cursorCreatedAt = cursor?.createdAt,
            cursorId = cursor?.id,
            pageable = PageRequest.of(0, size + 1)
        )

        val hasNext = result.size > size
        val slice = result.take(size)
        val edges = slice.map { article ->
            val graphqlArticle = GraphqlArticle.from(article)
            ArticleEdge(
                cursor = GraphqlCursorUtils.encode(graphqlArticle.createdAt, graphqlArticle.id),
                node = graphqlArticle
            )
        }

        val endCursor = edges.lastOrNull()?.cursor
        return ArticleConnection(
            edges = edges,
            pageInfo = CursorPageInfo(endCursor = endCursor, hasNext = hasNext)
        )
    }

    private fun pageRequest(page: Int, size: Int): PageRequest {
        val safePage = page.coerceAtLeast(0)
        val safeSize = size.coerceIn(1, 50)
        return PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
    }

    private fun toPageInfo(page: Int, size: Int, totalElements: Long, totalPages: Int): PageInfo {
        return PageInfo(
            page = page,
            size = size,
            totalElements = totalElements,
            totalPages = totalPages,
            hasNext = page + 1 < totalPages
        )
    }

    private fun parseDate(value: String?, fieldName: String): LocalDateTime? {
        if (value.isNullOrBlank()) return null
        return runCatching { LocalDateTime.parse(value) }
            .getOrElse { throw IllegalArgumentException("$fieldName 날짜 포맷이 올바르지 않습니다: $value") }
    }
}
