package com.tutor.library._3_clean_architecture.domain.port.out;

import com.tutor.library._3_clean_architecture.domain.model.Book;

import java.util.List;
import java.util.Optional;

/**
 * ============================================================
 * [3단계 - 클린 아키텍처] 아웃고잉 포트 (Output Port)
 * ============================================================
 *
 * 아웃고잉 포트란?
 * - 도메인이 외부(DB, API 등)에 뭔가를 요청할 때 사용하는 창구
 * - 도메인은 "뭔가를 저장해줘", "뭔가를 조회해줘"라고 요청
 * - 실제로 어떻게 저장/조회하는지는 도메인이 알 필요 없음
 *
 * 핵심 포인트:
 * - 이 인터페이스는 도메인 패키지에 있다
 * - 구현체(JPA, MongoDB 등)는 인프라 패키지에 있다
 * - 의존성 방향: 인프라 -> 도메인 (도메인은 인프라를 모름!)
 *
 * 왜 이렇게 하는가?
 * - DB를 JPA에서 MongoDB로 바꿔도 도메인 코드는 한 줄도 안 바뀜
 * - 도메인 로직 테스트 시 실제 DB 없이 InMemory 구현체 사용 가능
 */
public interface BookRepositoryPort {

    Book save(Book book);

    Optional<Book> findById(Long id);

    Optional<Book> findByIsbn(String isbn);

    List<Book> findAll();

    boolean existsByIsbn(String isbn);
}
