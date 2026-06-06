package com.tutor.library._3_clean_architecture.domain.port.in;

import com.tutor.library._3_clean_architecture.domain.model.Book;

/**
 * 인커밍 포트 - 책 대출 유스케이스
 */
public interface BorrowBookUseCase {

    Book borrowBook(BorrowBookCommand command);

    record BorrowBookCommand(
            Long bookId,
            Long memberId
    ) {
        public BorrowBookCommand {
            if (bookId == null) {
                throw new IllegalArgumentException("책 ID는 필수입니다.");
            }
            if (memberId == null) {
                throw new IllegalArgumentException("회원 ID는 필수입니다.");
            }
        }
    }
}
