package be.com.springbootclaude.repository

import be.com.springbootclaude.domain.Article
import be.com.springbootclaude.domain.ArticleStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * ArticleRepository: 기사 데이터 접근 계층
 *
 * 학습 포인트:
 * 1. Pageable: 페이징과 정렬을 자동으로 처리합니다.
 * 2. @Query: JPQL(Java Persistence Query Language)로 복잡한 쿼리를 작성합니다.
 * 3. JOIN FETCH: N+1 문제를 해결하는 가장 일반적인 방법입니다.
 *
 * 실무 팁:
 * - Pageable을 사용하면 클라이언트가 page, size, sort 파라미터를 자유롭게 조정할 수 있습니다.
 * - JOIN FETCH는 즉시 로딩을 강제하여 N+1 문제를 방지합니다.
 * - countQuery를 분리하면 카운트 쿼리에서 불필요한 JOIN을 제거할 수 있습니다.
 */
@Repository
interface ArticleRepository : JpaRepository<Article, Long> {

    /**
     * 상태별 기사 조회 (페이징)
     * Query Method 패턴: findBy + 필드명 + 조건
     */
    fun findByStatus(status: ArticleStatus, pageable: Pageable): Page<Article>

    /**
     * 게시된 기사 조회 with 작성자 정보 (N+1 문제 해결)
     *
     * 학습 포인트:
     * - JOIN FETCH: author를 즉시 로딩하여 추가 쿼리를 방지합니다.
     * - countQuery 분리: 카운트 쿼리에서는 JOIN FETCH가 불필요하므로 분리합니다.
     *
     * 실무 팁:
     * - N+1 문제는 실무에서 가장 흔한 성능 문제입니다.
     * - 항상 쿼리 로그를 확인하여 몇 개의 쿼리가 실행되는지 체크하세요.
     */
    @Query(
        """
        SELECT a FROM Article a
        JOIN FETCH a.author
        WHERE a.status = :status
        ORDER BY a.createdAt DESC
        """,
        countQuery = "SELECT COUNT(a) FROM Article a WHERE a.status = :status"
    )
    fun findPublishedArticlesWithAuthor(
        @Param("status") status: ArticleStatus,
        pageable: Pageable
    ): Page<Article>

    /**
     * 제목으로 기사 검색 (LIKE 검색)
     */
    fun findByTitleContainingIgnoreCase(keyword: String, pageable: Pageable): Page<Article>
}
