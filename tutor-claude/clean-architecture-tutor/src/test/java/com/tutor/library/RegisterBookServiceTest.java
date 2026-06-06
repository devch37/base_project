package com.tutor.library;

import com.tutor.library._3_clean_architecture.domain.model.Book;
import com.tutor.library._3_clean_architecture.domain.port.in.RegisterBookUseCase;
import com.tutor.library._3_clean_architecture.domain.port.out.BookRepositoryPort;
import com.tutor.library._3_clean_architecture.domain.service.RegisterBookService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * ============================================================
 * [테스트] 클린 아키텍처의 핵심 장점 - 빠른 단위 테스트
 * ============================================================
 *
 * 클린 아키텍처의 가장 큰 실용적 장점 중 하나:
 * 도메인 서비스를 DB 없이 테스트할 수 있다!
 *
 * 이 테스트를 실행하면:
 * - Spring 컨텍스트 로딩 없음 -> 빠름 (0.1초 이내)
 * - DB 없음 -> 항상 동일한 결과
 * - 외부 서비스 없음 -> 격리된 테스트
 *
 * 나쁜 코드(BadBookController)는 이런 테스트를 작성하기 불가능했다.
 * 왜? 모든 것이 섞여 있어서 DB 없이는 아무것도 테스트 못함.
 */
@DisplayName("책 등록 서비스 테스트")
class RegisterBookServiceTest {

    // 실제 DB 없이 인메모리 구현체 사용
    private BookRepositoryPort bookRepository;
    private RegisterBookService registerBookService;

    @BeforeEach
    void setUp() {
        // 실제 JPA 대신 가짜(In-Memory) 구현체 주입
        bookRepository = new InMemoryBookRepository();
        registerBookService = new RegisterBookService(bookRepository);
    }

    @Test
    @DisplayName("정상적인 책 등록 성공")
    void registerBook_success() {
        // given: 테스트 데이터 준비
        RegisterBookUseCase.RegisterBookCommand command = new RegisterBookUseCase.RegisterBookCommand(
                "클린 코드",
                "Robert C. Martin",
                "9788966260959"
        );

        // when: 실제 메서드 실행
        Book savedBook = registerBookService.registerBook(command);

        // then: 결과 검증
        assertThat(savedBook.getTitle()).isEqualTo("클린 코드");
        assertThat(savedBook.getAuthor()).isEqualTo("Robert C. Martin");
        assertThat(savedBook.isAvailable()).isTrue();
    }

    @Test
    @DisplayName("중복 ISBN으로 등록 시 예외 발생")
    void registerBook_duplicateIsbn_throwsException() {
        // given: 같은 ISBN의 책을 먼저 등록
        RegisterBookUseCase.RegisterBookCommand firstCommand = new RegisterBookUseCase.RegisterBookCommand(
                "클린 코드",
                "Robert C. Martin",
                "9788966260959"
        );
        registerBookService.registerBook(firstCommand);

        // when & then: 같은 ISBN으로 두 번째 등록 시 예외 발생
        RegisterBookUseCase.RegisterBookCommand duplicateCommand = new RegisterBookUseCase.RegisterBookCommand(
                "다른 책",
                "다른 저자",
                "9788966260959"  // 같은 ISBN!
        );

        assertThatThrownBy(() -> registerBookService.registerBook(duplicateCommand))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 등록된 ISBN입니다");
    }

    @Test
    @DisplayName("책 제목 없이 등록 시 예외 발생")
    void registerBook_emptyTitle_throwsException() {
        assertThatThrownBy(() ->
                new RegisterBookUseCase.RegisterBookCommand("", "저자", "9788966260959")
        )
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("책 제목은 필수입니다");
    }

    // ============================================================
    // 테스트용 인메모리 구현체 (가짜 DB)
    // Spring, JPA 없이도 테스트 가능!
    // ============================================================
    private static class InMemoryBookRepository implements BookRepositoryPort {
        private final java.util.Map<Long, Book> store = new java.util.HashMap<>();
        private Long nextId = 1L;

        @Override
        public Book save(Book book) {
            if (book.getId() == null) {
                book.assignId(nextId++);
            }
            store.put(book.getId(), book);
            return book;
        }

        @Override
        public Optional<Book> findById(Long id) {
            return Optional.ofNullable(store.get(id));
        }

        @Override
        public Optional<Book> findByIsbn(String isbn) {
            return store.values().stream()
                    .filter(b -> b.getIsbn().equals(isbn))
                    .findFirst();
        }

        @Override
        public java.util.List<Book> findAll() {
            return new java.util.ArrayList<>(store.values());
        }

        @Override
        public boolean existsByIsbn(String isbn) {
            return store.values().stream().anyMatch(b -> b.getIsbn().equals(isbn));
        }
    }
}
