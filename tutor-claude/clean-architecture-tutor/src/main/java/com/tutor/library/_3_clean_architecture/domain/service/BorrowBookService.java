package com.tutor.library._3_clean_architecture.domain.service;

import com.tutor.library._3_clean_architecture.domain.model.Book;
import com.tutor.library._3_clean_architecture.domain.model.Member;
import com.tutor.library._3_clean_architecture.domain.port.in.BorrowBookUseCase;
import com.tutor.library._3_clean_architecture.domain.port.out.BookRepositoryPort;
import com.tutor.library._3_clean_architecture.domain.port.out.MemberRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 도메인 서비스 - 책 대출 처리
 *
 * 1단계 BadBookController의 processAllStuff()와 비교해보세요!
 * - BadBookController: 100줄짜리 메서드, 모든 것이 섞임
 * - BorrowBookService: 각 단계가 명확히 분리됨
 */
@Service
@Transactional
public class BorrowBookService implements BorrowBookUseCase {

    private final BookRepositoryPort bookRepositoryPort;
    private final MemberRepositoryPort memberRepositoryPort;

    public BorrowBookService(BookRepositoryPort bookRepositoryPort,
                              MemberRepositoryPort memberRepositoryPort) {
        this.bookRepositoryPort = bookRepositoryPort;
        this.memberRepositoryPort = memberRepositoryPort;
    }

    @Override
    public Book borrowBook(BorrowBookCommand command) {
        // 각 단계가 명확한 의도를 가진 메서드로 분리됨
        Book book = findAvailableBook(command.bookId());
        Member member = findActiveMember(command.memberId());

        validateMemberCanBorrow(member);

        // 비즈니스 로직은 도메인 모델이 처리 (Book.borrow())
        book.borrow(member.getId().toString());

        return bookRepositoryPort.save(book);
    }

    private Book findAvailableBook(Long bookId) {
        return bookRepositoryPort.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException(bookId));
    }

    private Member findActiveMember(Long memberId) {
        return memberRepositoryPort.findById(memberId)
                .orElseThrow(() -> new MemberNotFoundException(memberId));
    }

    private void validateMemberCanBorrow(Member member) {
        int currentBorrowCount = memberRepositoryPort.countActiveLoansByMember(member.getId());

        // 비즈니스 규칙은 Member 도메인 모델이 알고 있음
        if (member.hasExceededBorrowLimit(currentBorrowCount)) {
            throw new BorrowLimitExceededException(member.getId(), currentBorrowCount);
        }
    }

    // 도메인 예외 - 비즈니스 상황을 명확히 표현
    public static class BookNotFoundException extends RuntimeException {
        public BookNotFoundException(Long bookId) {
            super("책을 찾을 수 없습니다. ID: " + bookId);
        }
    }

    public static class MemberNotFoundException extends RuntimeException {
        public MemberNotFoundException(Long memberId) {
            super("회원을 찾을 수 없습니다. ID: " + memberId);
        }
    }

    public static class BorrowLimitExceededException extends RuntimeException {
        public BorrowLimitExceededException(Long memberId, int currentCount) {
            super(String.format("대출 한도를 초과했습니다. 회원 ID: %d, 현재 대출 수: %d", memberId, currentCount));
        }
    }
}
