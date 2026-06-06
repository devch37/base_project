package com.tutor.library._3_clean_architecture.infrastructure.persistence;

import com.tutor.library._3_clean_architecture.domain.model.Book;
import com.tutor.library._3_clean_architecture.domain.model.BookStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ============================================================
 * [3단계 - 클린 아키텍처] 인프라 계층 - JPA 엔티티
 * ============================================================
 *
 * 왜 도메인 모델(Book)과 JPA 엔티티(BookJpaEntity)를 분리하는가?
 *
 * 만약 Book 도메인 모델에 @Entity, @Column 등 JPA 애너테이션을 직접 붙이면:
 * 1. 도메인 모델이 JPA에 의존하게 됨
 * 2. JPA가 없는 환경(테스트 등)에서 도메인 모델을 쓰기 어려워짐
 * 3. DB 스키마 변경이 도메인 모델에 영향을 줌
 * 4. JPA의 제약(기본 생성자 필수 등)이 도메인 설계를 제약함
 *
 * 분리하면:
 * - 도메인 모델은 순수하게 비즈니스 규칙에만 집중
 * - JPA 엔티티는 DB 매핑에만 집중
 * - 두 세계가 서로를 오염시키지 않음
 */
@Entity
@Table(name = "books")
public class BookJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 100)
    private String author;

    @Column(nullable = false, unique = true, length = 20)
    private String isbn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookStatus status;

    private String borrowedByMemberId;
    private LocalDateTime borrowedAt;

    protected BookJpaEntity() {}

    // ============================================================
    // 도메인 모델 <-> JPA 엔티티 변환 메서드
    // ============================================================

    /**
     * 도메인 모델 -> JPA 엔티티 변환
     * 인프라가 도메인을 이해하는 방향 (의존성 방향: 인프라 -> 도메인)
     */
    public static BookJpaEntity fromDomain(Book book) {
        BookJpaEntity entity = new BookJpaEntity();
        entity.id = book.getId();
        entity.title = book.getTitle();
        entity.author = book.getAuthor();
        entity.isbn = book.getIsbn();
        entity.status = book.getStatus();
        entity.borrowedByMemberId = book.getBorrowedByMemberId();
        entity.borrowedAt = book.getBorrowedAt();
        return entity;
    }

    /**
     * JPA 엔티티 -> 도메인 모델 변환
     * DB에서 읽어온 데이터를 도메인 모델로 재구성
     */
    public Book toDomain() {
        return Book.reconstitute(
                id, title, author, isbn, status, borrowedByMemberId, borrowedAt
        );
    }

    public Long getId() { return id; }
}
