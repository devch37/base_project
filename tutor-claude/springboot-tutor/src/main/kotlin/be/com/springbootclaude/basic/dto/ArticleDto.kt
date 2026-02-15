package be.com.springbootclaude.basic.dto

import be.com.springbootclaude.basic.domain.Article
import be.com.springbootclaude.basic.domain.ArticleStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

/**
 * ArticleDto: 기사 관련 DTO(Data Transfer Object)
 *
 * 학습 포인트:
 * 1. DTO는 엔티티와 API 계층을 분리합니다.
 * 2. Jakarta Validation: @NotBlank, @Size 등으로 입력 검증을 선언적으로 처리합니다.
 * 3. data class: equals, hashCode, toString, copy를 자동 생성합니다.
 *
 * 실무 팁:
 * - 엔티티를 직접 노출하지 마세요! DTO로 변환하면 API 스펙이 안정적입니다.
 * - 요청과 응답 DTO를 분리하면 각각의 책임이 명확해집니다.
 * - validation을 DTO에 넣으면 컨트롤러가 깔끔해집니다.
 */

/**
 * 기사 생성 요청 DTO
 */
data class CreateArticleRequest(
    @field:NotBlank(message = "제목은 필수입니다")
    @field:Size(min = 1, max = 200, message = "제목은 1~200자 사이여야 합니다")
    val title: String,

    @field:NotBlank(message = "내용은 필수입니다")
    @field:Size(min = 1, max = 10000, message = "내용은 1~10000자 사이여야 합니다")
    val content: String,

    val authorId: Long
) {
    /**
     * 학습 포인트: DTO -> Entity 변환 로직을 DTO에 넣으면 응집도가 높아집니다.
     */
    fun toEntity(author: be.com.springbootclaude.basic.domain.User): Article {
        return Article(
            title = this.title,
            content = this.content,
            author = author
        )
    }
}

/**
 * 기사 수정 요청 DTO
 */
data class UpdateArticleRequest(
    @field:NotBlank(message = "제목은 필수입니다")
    @field:Size(min = 1, max = 200, message = "제목은 1~200자 사이여야 합니다")
    val title: String,

    @field:NotBlank(message = "내용은 필수입니다")
    @field:Size(min = 1, max = 10000, message = "내용은 1~10000자 사이여야 합니다")
    val content: String
)

/**
 * 기사 응답 DTO
 *
 * 학습 포인트:
 * - 응답 DTO는 클라이언트에게 필요한 정보만 선택적으로 제공합니다.
 * - author 정보를 간단하게 표현하여 불필요한 데이터 노출을 방지합니다.
 */
data class ArticleResponse(
    val id: Long,
    val title: String,
    val content: String,
    val status: ArticleStatus,
    val viewCount: Long,
    val author: AuthorInfo,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        /**
         * 학습 포인트: Entity -> DTO 변환 로직을 companion object에 넣으면 편리합니다.
         */
        fun from(article: Article): ArticleResponse {
            return ArticleResponse(
                id = article.id!!,
                title = article.title,
                content = article.content,
                status = article.status,
                viewCount = article.viewCount,
                author = AuthorInfo(
                    id = article.author.id!!,
                    name = article.author.name,
                    email = article.author.email
                ),
                createdAt = article.createdAt,
                updatedAt = article.updatedAt
            )
        }
    }
}

/**
 * 작성자 정보 (간략)
 */
data class AuthorInfo(
    val id: Long,
    val name: String,
    val email: String
)

/**
 * 기사 목록 응답 DTO (간략 정보)
 *
 * 실무 팁:
 * - 목록 조회 시에는 전체 내용을 보내지 않고 요약 정보만 제공합니다.
 * - 이렇게 하면 네트워크 트래픽과 응답 시간을 줄일 수 있습니다.
 */
data class ArticleSummaryResponse(
    val id: Long,
    val title: String,
    val status: ArticleStatus,
    val viewCount: Long,
    val authorName: String,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(article: Article): ArticleSummaryResponse {
            return ArticleSummaryResponse(
                id = article.id!!,
                title = article.title,
                status = article.status,
                viewCount = article.viewCount,
                authorName = article.author.name,
                createdAt = article.createdAt
            )
        }
    }
}
