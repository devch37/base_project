package com.jpatutor.ch05_inheritance;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class InheritanceMappingTest {

    @Autowired
    EntityManager em;

    @Test
    @DisplayName("SINGLE_TABLE 전략: Album/Movie/Book이 모두 item이라는 테이블 하나에 저장된다")
    @Transactional
    void singleTableStrategy() {
        Album album = new Album("포에버 영", new BigDecimal("15000"), "산울림");
        Movie movie = new Movie("올드보이", new BigDecimal("12000"), "박찬욱");
        Book book = new Book("자바 ORM 표준 프로그래밍", new BigDecimal("35000"), "김영한", "9788960777330");

        em.persist(album);
        em.persist(movie);
        em.persist(book);
        em.flush();
        em.clear();

        // 세 타입 모두 부모 타입(Item)으로 조회 가능하다는 것이 상속 매핑의 핵심 이점이다.
        // 실제로는 하나의 item 테이블에 대한 SELECT 하나로 세 로우가 모두 조회된다 (JOIN 없음).
        Long count = em.createQuery("select count(i) from Item i", Long.class).getSingleResult();
        assertThat(count).isEqualTo(3);

        Album reloadedAlbum = em.find(Album.class, album.getId());
        assertThat(reloadedAlbum.getArtist()).isEqualTo("산울림");

        Book reloadedBook = em.find(Book.class, book.getId());
        assertThat(reloadedBook.getIsbn()).isEqualTo("9788960777330");
    }

    @Test
    @DisplayName("@MappedSuperclass의 필드는 자식 테이블의 컬럼으로 합쳐질 뿐, 별도 테이블은 만들어지지 않는다")
    @Transactional
    void mappedSuperclassMergesIntoChildTable() {
        Note note = new Note("이 프로젝트는 학습용입니다", "chulhanlee");
        em.persist(note);
        em.flush();
        em.clear();

        Note reloaded = em.find(Note.class, note.getId());
        assertThat(reloaded.getContent()).isEqualTo("이 프로젝트는 학습용입니다");
        assertThat(reloaded.getRegisteredBy()).isEqualTo("chulhanlee"); // 부모(RegisteredEntity)의 필드
    }
}
