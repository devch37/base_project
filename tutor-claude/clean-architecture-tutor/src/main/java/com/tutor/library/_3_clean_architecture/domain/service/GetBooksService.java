package com.tutor.library._3_clean_architecture.domain.service;

import com.tutor.library._3_clean_architecture.domain.model.Book;
import com.tutor.library._3_clean_architecture.domain.port.in.GetBooksUseCase;
import com.tutor.library._3_clean_architecture.domain.port.out.BookRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 도메인 서비스 - 책 조회
 */
@Service
@Transactional(readOnly = true)
public class GetBooksService implements GetBooksUseCase {

    private final BookRepositoryPort bookRepositoryPort;

    public GetBooksService(BookRepositoryPort bookRepositoryPort) {
        this.bookRepositoryPort = bookRepositoryPort;
    }

    @Override
    public List<Book> getAllBooks() {
        return bookRepositoryPort.findAll();
    }

    @Override
    public Optional<Book> getBookById(Long bookId) {
        return bookRepositoryPort.findById(bookId);
    }
}
