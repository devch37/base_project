package com.tutor.library._3_clean_architecture.domain.model;

import java.time.LocalDateTime;

/**
 * ============================================================
 * [3단계 - 클린 아키텍처] 도메인 모델 - Book
 * ============================================================
 *
 * 도메인 계층의 핵심 규칙:
 * 1. 순수 Java 클래스 (어떤 프레임워크도 import 없음!)
 * 2. 비즈니스 규칙과 로직을 담는다
 * 3. DB, HTTP, Spring 등 외부 세계와 완전히 독립적
 *
 * 이 클래스는 Spring이 없어도, DB가 없어도 동작한다.
 * 그래서 테스트가 매우 빠르고 쉽다.
 *
 * 클린 아키텍처의 핵심 질문:
 * "이 코드는 비즈니스 로직인가? 기술적 구현인가?"
 * -> 비즈니스 로직이면 도메인 계층
 * -> 기술적 구현이면 인프라 계층
 */
public class Book {

    private Long id;
    private String title;
    private String author;
    private String isbn;
    private BookStatus status;
    private String borrowedByMemberId;
    private LocalDateTime borrowedAt;

    // ============================================================
    // 정적 팩토리 메서드 - 객체 생성 의도를 명확하게
    // ============================================================

    public static Book createNew(String title, String author, String isbn) {
        validateTitle(title);
        validateIsbn(isbn);

        Book book = new Book();
        book.title = title;
        book.author = author;
        book.isbn = isbn;
        book.status = BookStatus.AVAILABLE;
        return book;
    }

    // DB에서 복원할 때 사용 (기존 책 재구성)
    public static Book reconstitute(Long id, String title, String author, String isbn,
                                     BookStatus status, String borrowedByMemberId, LocalDateTime borrowedAt) {
        Book book = new Book();
        book.id = id;
        book.title = title;
        book.author = author;
        book.isbn = isbn;
        book.status = status;
        book.borrowedByMemberId = borrowedByMemberId;
        book.borrowedAt = borrowedAt;
        return book;
    }

    // ============================================================
    // 비즈니스 메서드 - 도메인 규칙을 클래스 안에 캡슐화
    // ============================================================

    /**
     * 책 대출 처리 - 비즈니스 규칙:
     * 1. 대출 가능 상태인 책만 대출 가능
     * 2. 대출하면 상태가 BORROWED로 변경
     * 3. 누가 빌렸는지, 언제 빌렸는지 기록
     */
    public void borrow(String memberId) {
        if (!isAvailable()) {
            throw new IllegalStateException(
                    String.format("책 '%s'는 현재 대출 중입니다. (대출자: %s)", title, borrowedByMemberId)
            );
        }
        this.status = BookStatus.BORROWED;
        this.borrowedByMemberId = memberId;
        this.borrowedAt = LocalDateTime.now();
    }

    /**
     * 책 반납 처리 - 비즈니스 규칙:
     * 1. 대출 중인 책만 반납 가능
     * 2. 반납하면 상태가 AVAILABLE로 변경
     * 3. 대출 정보 초기화
     */
    public void returnBook() {
        if (!isBorrowed()) {
            throw new IllegalStateException(
                    String.format("책 '%s'는 대출 중이 아닙니다.", title)
            );
        }
        this.status = BookStatus.AVAILABLE;
        this.borrowedByMemberId = null;
        this.borrowedAt = null;
    }

    /**
     * 도서 소실 처리 - 비즈니스 규칙:
     * 소실된 책은 대출 불가
     */
    public void markAsLost() {
        this.status = BookStatus.LOST;
    }

    // ============================================================
    // 상태 확인 메서드 - 비즈니스 규칙을 메서드로 표현
    // ============================================================

    public boolean isAvailable() {
        return BookStatus.AVAILABLE.equals(this.status);
    }

    public boolean isBorrowed() {
        return BookStatus.BORROWED.equals(this.status);
    }

    public boolean isLost() {
        return BookStatus.LOST.equals(this.status);
    }

    // ============================================================
    // 유효성 검사 - 비즈니스 규칙
    // ============================================================

    private static void validateTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("책 제목은 필수입니다.");
        }
        if (title.length() > 200) {
            throw new IllegalArgumentException("책 제목은 200자를 초과할 수 없습니다.");
        }
    }

    private static void validateIsbn(String isbn) {
        if (isbn == null || isbn.isBlank()) {
            throw new IllegalArgumentException("ISBN은 필수입니다.");
        }
        // ISBN-13 형식 검사 (간략화)
        String cleanIsbn = isbn.replaceAll("-", "");
        if (cleanIsbn.length() != 13 && cleanIsbn.length() != 10) {
            throw new IllegalArgumentException("올바른 ISBN 형식이 아닙니다: " + isbn);
        }
    }

    // ============================================================
    // Getter (불변성 유지 - setter 최소화)
    // ============================================================

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getIsbn() { return isbn; }
    public BookStatus getStatus() { return status; }
    public String getBorrowedByMemberId() { return borrowedByMemberId; }
    public LocalDateTime getBorrowedAt() { return borrowedAt; }

    public void assignId(Long id) {
        if (this.id != null) {
            throw new IllegalStateException("ID는 이미 할당되었습니다.");
        }
        this.id = id;
    }
}
