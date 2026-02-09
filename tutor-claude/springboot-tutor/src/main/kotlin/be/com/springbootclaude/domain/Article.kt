package be.com.springbootclaude.domain

import jakarta.persistence.*

/**
 * Article: 기사 엔티티
 *
 * 학습 포인트:
 * 1. @ManyToOne: 다대일 관계 설정
 * 2. @JoinColumn: 외래 키 컬럼 설정
 * 3. @Lob: 큰 텍스트 데이터 저장 (TEXT 타입)
 * 4. FetchType.LAZY: 지연 로딩 (N+1 문제 방지)
 *
 * 실무 팁:
 * - FetchType.LAZY는 필수! EAGER는 N+1 문제를 일으킵니다.
 * - 연관 관계는 단방향으로 시작하고, 필요할 때만 양방향으로 변경하세요.
 * - nullable = false로 설정하면 NOT NULL 제약조건이 추가됩니다.
 */
@Entity
@Table(
    name = "articles",
    indexes = [
        Index(name = "idx_article_status", columnList = "status"),
        Index(name = "idx_article_author", columnList = "author_id")
    ]
)
class Article(
    @Column(nullable = false, length = 200)
    var title: String,

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    var author: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ArticleStatus = ArticleStatus.DRAFT,

    @Column(nullable = false)
    var viewCount: Long = 0L
) : BaseEntity() {

    /**
     * 비즈니스 로직: 기사 게시
     *
     * 학습 포인트:
     * - 엔티티에 상태 변경 로직을 넣으면 도메인 주도 설계(DDD)에 가까워집니다.
     * - 상태 변경 시 검증 로직을 추가할 수 있습니다.
     */
    fun publish() {
        require(status == ArticleStatus.DRAFT) {
            "Only DRAFT articles can be published"
        }
        status = ArticleStatus.PUBLISHED
    }

    /**
     * 비즈니스 로직: 조회수 증가
     */
    fun incrementViewCount() {
        viewCount++
    }

    /**
     * 비즈니스 로직: 게시 여부 확인
     */
    fun isPublished(): Boolean = status == ArticleStatus.PUBLISHED
}

/**
 * ArticleStatus: 기사 상태
 *
 * 학습 포인트:
 * - 상태를 Enum으로 관리하면 유효하지 않은 상태가 들어오는 것을 방지합니다.
 * - 상태 전이(State Transition) 로직을 명확하게 관리할 수 있습니다.
 */
enum class ArticleStatus(val description: String) {
    DRAFT("임시저장"),
    PUBLISHED("게시됨"),
    DELETED("삭제됨")
}
