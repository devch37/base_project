package com.tutor.library._3_clean_architecture.domain.port.in;

import com.tutor.library._3_clean_architecture.domain.model.Book;

import java.util.List;
import java.util.Optional;

/**
 * 인커밍 포트 - 책 조회 유스케이스
 */
public interface GetBooksUseCase {

    List<Book> getAllBooks();

    Optional<Book> getBookById(Long bookId);
}
