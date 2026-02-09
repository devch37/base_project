package be.com.springbootclaude.service

import be.com.springbootclaude.domain.Article
import be.com.springbootclaude.domain.ArticleStatus
import be.com.springbootclaude.dto.*
import be.com.springbootclaude.exception.EntityNotFoundException
import be.com.springbootclaude.repository.ArticleRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * ArticleService: 기사 비즈니스 로직
 *
 * 학습 포인트:
 * 1. 여러 Repository와 협업하는 패턴
 * 2. Pageable을 활용한 페이징 처리
 * 3. 도메인 로직 vs 서비스 로직의 분리
 *
 * 실무 팁:
 * - Service는 여러 Repository를 조율하고 트랜잭션을 관리합니다.
 * - 도메인 엔티티의 메서드(article.publish())와 서비스 메서드를 적절히 분리하세요.
 */
@Service
@Transactional(readOnly = true)
class ArticleService(
    private val articleRepository: ArticleRepository,
    private val userService: UserService
) {

    /**
     * 기사 생성
     */
    @Transactional
    fun createArticle(request: CreateArticleRequest): ArticleResponse {
        // 작성자 조회
        val author = userService.findUserById(request.authorId)

        // 기사 생성 및 저장
        val article = request.toEntity(author)
        val savedArticle = articleRepository.save(article)

        return ArticleResponse.from(savedArticle)
    }

    /**
     * 기사 수정
     *
     * 학습 포인트:
     * - JPA의 변경 감지(Dirty Checking)를 활용합니다.
     * - 트랜잭션 안에서 엔티티를 수정하면 자동으로 UPDATE 쿼리가 실행됩니다.
     * - save()를 명시적으로 호출하지 않아도 됩니다!
     */
    @Transactional
    fun updateArticle(id: Long, request: UpdateArticleRequest): ArticleResponse {
        val article = findArticleById(id)

        // 엔티티 수정 (변경 감지)
        article.title = request.title
        article.content = request.content

        return ArticleResponse.from(article)
    }

    /**
     * 기사 게시
     *
     * 학습 포인트:
     * - 상태 변경 로직은 도메인 엔티티의 메서드(article.publish())를 사용합니다.
     * - 이렇게 하면 비즈니스 규칙이 엔티티에 캡슐화되어 응집도가 높아집니다.
     */
    @Transactional
    fun publishArticle(id: Long): ArticleResponse {
        val article = findArticleById(id)
        article.publish()
        return ArticleResponse.from(article)
    }

    /**
     * 기사 삭제 (소프트 삭제)
     *
     * 실무 팁:
     * - 실제 데이터를 삭제하지 않고 상태만 변경하는 것을 소프트 삭제라고 합니다.
     * - 데이터 복구와 감사(Audit)를 위해 실무에서 자주 사용됩니다.
     */
    @Transactional
    fun deleteArticle(id: Long) {
        val article = findArticleById(id)
        article.status = ArticleStatus.DELETED
    }

    /**
     * 기사 조회 (조회수 증가)
     *
     * 학습 포인트:
     * - 조회 시 조회수를 증가시키는 로직
     * - 이런 경우 @Transactional(readOnly = false)가 필요합니다.
     */
    @Transactional
    fun getArticle(id: Long): ArticleResponse {
        val article = findArticleById(id)
        article.incrementViewCount()
        return ArticleResponse.from(article)
    }

    /**
     * 게시된 기사 목록 조회 (페이징)
     *
     * 학습 포인트:
     * - Page<Entity>를 Page<DTO>로 변환하는 패턴
     * - map()을 사용하면 간단하게 변환할 수 있습니다.
     */
    fun getPublishedArticles(pageable: Pageable): Page<ArticleSummaryResponse> {
        return articleRepository.findPublishedArticlesWithAuthor(ArticleStatus.PUBLISHED, pageable)
            .map { ArticleSummaryResponse.from(it) }
    }

    /**
     * 기사 검색
     */
    fun searchArticles(keyword: String, pageable: Pageable): Page<ArticleSummaryResponse> {
        return articleRepository.findByTitleContainingIgnoreCase(keyword, pageable)
            .map { ArticleSummaryResponse.from(it) }
    }

    /**
     * 내부 헬퍼 메서드: ID로 Article 엔티티 조회
     */
    private fun findArticleById(id: Long): Article {
        return articleRepository.findByIdOrNull(id)
            ?: throw EntityNotFoundException("Article", id)
    }
}
