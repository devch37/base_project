package be.com.springbootclaude.basic.controller

import be.com.springbootclaude.basic.dto.*
import be.com.springbootclaude.basic.service.ArticleService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

/**
 * ArticleController: 기사 API 엔드포인트
 *
 * 학습 포인트:
 * 1. @PageableDefault: 페이징 기본값 설정
 * 2. Pageable: Spring이 자동으로 page, size, sort 파라미터를 매핑합니다.
 * 3. @PutMapping vs @PatchMapping: PUT은 전체 수정, PATCH는 부분 수정
 *
 * 실무 팁:
 * - Pageable을 사용하면 클라이언트가 ?page=0&size=10&sort=createdAt,desc 형식으로 요청할 수 있습니다.
 * - 기본 정렬을 설정하면 클라이언트가 sort를 지정하지 않아도 됩니다.
 */
@RestController
@RequestMapping("/api/articles")
class ArticleController(
    private val articleService: ArticleService
) {

    /**
     * 기사 생성
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createArticle(@Valid @RequestBody request: CreateArticleRequest): ArticleResponse {
        return articleService.createArticle(request)
    }

    /**
     * 기사 수정
     */
    @PutMapping("/{id}")
    fun updateArticle(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateArticleRequest
    ): ArticleResponse {
        return articleService.updateArticle(id, request)
    }

    /**
     * 기사 게시
     */
    @PostMapping("/{id}/publish")
    fun publishArticle(@PathVariable id: Long): ArticleResponse {
        return articleService.publishArticle(id)
    }

    /**
     * 기사 삭제
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteArticle(@PathVariable id: Long) {
        articleService.deleteArticle(id)
    }

    /**
     * 기사 조회
     */
    @GetMapping("/{id}")
    fun getArticle(@PathVariable id: Long): ArticleResponse {
        return articleService.getArticle(id)
    }

    /**
     * 게시된 기사 목록 조회 (페이징)
     *
     * 학습 포인트:
     * - @PageableDefault로 기본 페이징 설정
     * - Sort.Direction.DESC로 최신순 정렬
     * - 클라이언트는 /api/articles?page=0&size=20 형식으로 요청
     */
    @GetMapping
    fun getPublishedArticles(
        @PageableDefault(size = 10, sort = ["createdAt"], direction = Sort.Direction.DESC)
        pageable: Pageable
    ): Page<ArticleSummaryResponse> {
        return articleService.getPublishedArticles(pageable)
    }

    /**
     * 기사 검색
     */
    @GetMapping("/search")
    fun searchArticles(
        @RequestParam keyword: String,
        @PageableDefault(size = 10, sort = ["createdAt"], direction = Sort.Direction.DESC)
        pageable: Pageable
    ): Page<ArticleSummaryResponse> {
        return articleService.searchArticles(keyword, pageable)
    }
}
