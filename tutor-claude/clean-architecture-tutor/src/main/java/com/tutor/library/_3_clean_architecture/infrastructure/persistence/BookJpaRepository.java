package com.tutor.library._3_clean_architecture.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data JPA 인터페이스
 * Spring이 자동으로 구현체를 생성해줌
 */
public interface BookJpaRepository extends JpaRepository<BookJpaEntity, Long> {

    Optional<BookJpaEntity> findByIsbn(String isbn);

    boolean existsByIsbn(String isbn);
}
