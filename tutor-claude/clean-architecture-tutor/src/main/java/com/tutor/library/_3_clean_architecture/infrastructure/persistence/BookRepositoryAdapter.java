package com.tutor.library._3_clean_architecture.infrastructure.persistence;

import com.tutor.library._3_clean_architecture.domain.model.Book;
import com.tutor.library._3_clean_architecture.domain.port.out.BookRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * ============================================================
 * [3단계 - 클린 아키텍처] 인프라 계층 - 어댑터 (Adapter)
 * ============================================================
 *
 * 어댑터(Adapter)란?
 * - 포트(Port)와 실제 구현(JPA, MongoDB, REST API 등)을 연결하는 "변환기"
 * - 도메인이 요구하는 인터페이스(BookRepositoryPort)를
 *   실제 JPA 구현으로 변환해줌
 *
 * 의존성 흐름:
 *   도메인 서비스 -> [BookRepositoryPort] <- BookRepositoryAdapter -> [BookJpaRepository]
 *
 *   도메인 서비스는 BookRepositoryAdapter의 존재를 전혀 모른다!
 *   BookRepositoryPort 인터페이스를 통해서만 소통
 *
 * DB를 JPA에서 MongoDB로 바꾸려면?
 * -> MongoBookRepositoryAdapter를 새로 만들고 스프링 빈만 교체
 * -> 도메인 서비스 코드는 단 한 줄도 수정하지 않아도 됨!
 */
@Component
public class BookRepositoryAdapter implements BookRepositoryPort {

    private final BookJpaRepository bookJpaRepository;

    public BookRepositoryAdapter(BookJpaRepository bookJpaRepository) {
        this.bookJpaRepository = bookJpaRepository;
    }

    @Override
    public Book save(Book book) {
        BookJpaEntity entity = BookJpaEntity.fromDomain(book);
        BookJpaEntity savedEntity = bookJpaRepository.save(entity);
        return savedEntity.toDomain();
    }

    @Override
    public Optional<Book> findById(Long id) {
        return bookJpaRepository.findById(id)
                .map(BookJpaEntity::toDomain);
    }

    @Override
    public Optional<Book> findByIsbn(String isbn) {
        return bookJpaRepository.findByIsbn(isbn)
                .map(BookJpaEntity::toDomain);
    }

    @Override
    public List<Book> findAll() {
        return bookJpaRepository.findAll()
                .stream()
                .map(BookJpaEntity::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByIsbn(String isbn) {
        return bookJpaRepository.existsByIsbn(isbn);
    }
}
