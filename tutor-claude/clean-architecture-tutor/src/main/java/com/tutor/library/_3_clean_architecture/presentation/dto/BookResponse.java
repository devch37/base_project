package com.tutor.library._3_clean_architecture.presentation.dto;

import com.tutor.library._3_clean_architecture.domain.model.Book;
import java.time.LocalDateTime;

/**
 * 응답 DTO - 도메인 모델을 외부에 노출하기 위한 형태로 변환
 *
 * 도메인 모델(Book)을 직접 반환하지 않는 이유:
 * - 도메인 모델의 내부 구조가 외부에 노출됨
 * - API 응답 형식과 도메인 모델이 강하게 결합됨
 * - 노출하면 안 되는 필드가 실수로 포함될 수 있음
 */
public record BookResponse(
        Long id,
        String title,
        String author,
        String isbn,
        String status,
        String statusDescription,
        String borrowedByMemberId,
        LocalDateTime borrowedAt
) {
    /**
     * 도메인 모델 -> 응답 DTO 변환
     * 클린 아키텍처에서 이 변환은 표현 계층의 책임
     */
    public static BookResponse from(Book book) {
        return new BookResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getIsbn(),
                book.getStatus().name(),
                book.getStatus().getDescription(),
                book.getBorrowedByMemberId(),
                book.getBorrowedAt()
        );
    }
}
