package be.com.springbootclaude.integration.graphql.basic

/**
 * GraphQL 입력 타입
 *
 * 학습 포인트:
 * - REST 요청 DTO와 분리하여 GraphQL 스키마에 맞춘 입력 객체를 둡니다.
 */

data class CreateArticleInput(
    val authorId: Long,
    val title: String,
    val content: String
)

/**
 * 고급 필터 입력
 *
 * 실무 팁:
 * - 날짜는 ISO-8601 문자열로 받는 것이 가장 무난합니다. (예: 2026-03-29T12:00:00)
 */
data class ArticleFilterInput(
    val status: be.com.springbootclaude.basic.domain.ArticleStatus? = null,
    val authorId: Long? = null,
    val keyword: String? = null,
    val from: String? = null,
    val to: String? = null
)

data class CursorPageInput(
    val after: String? = null,
    val size: Int? = 10
)
