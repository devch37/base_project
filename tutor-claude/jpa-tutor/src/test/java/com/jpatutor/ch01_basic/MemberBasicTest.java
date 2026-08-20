package com.jpatutor.ch01_basic;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * [1장] EntityManager로 JPA의 가장 기본적인 동작(저장, 조회)을 직접 체험해본다.
 *
 * @DataJpaTest는 JPA 관련 빈들(EntityManager, Repository 등)만 로드하는 슬라이스 테스트이고,
 * 기본적으로 각 테스트 메서드를 하나의 트랜잭션으로 감싸고 끝나면 롤백한다.
 * 즉, 테스트끼리 데이터가 섞이지 않고 항상 깨끗한 상태에서 시작한다.
 */
@DataJpaTest
class MemberBasicTest {

    @Autowired
    EntityManager em;

    @Test
    @DisplayName("persist로 저장하면 IDENTITY 전략이라 즉시 INSERT SQL이 나간다")
    @Transactional
    void persistAndFind() {
        Member member = new Member("홍길동", 20);

        // IDENTITY 전략은 DB가 키를 채번하므로, persist() 시점에 바로 INSERT가 실행되고
        // 그 결과로 받은 auto_increment 값이 member.id에 채워진다.
        // 콘솔에서 p6spy 로그로 "insert into member ..." 를 직접 확인해보자.
        em.persist(member);

        assertThat(member.getId()).isNotNull();

        // find()는 먼저 영속성 컨텍스트의 1차 캐시를 확인하고, 방금 persist한 엔티티가
        // 캐시에 있으므로 SQL을 다시 실행하지 않고 바로 반환한다. (SELECT 쿼리가 안 나가는 걸 확인)
        Member found = em.find(Member.class, member.getId());

        assertThat(found).isSameAs(member); // 1차 캐시 덕분에 완전히 동일한 참조(identity)가 보장된다.
    }

    @Test
    @DisplayName("같은 트랜잭션 안에서 두 번 find해도 SELECT는 한 번만 나간다 (1차 캐시)")
    @Transactional
    void firstLevelCache() {
        Member member = new Member("김철수", 25);
        em.persist(member);
        em.flush(); // 강제로 SQL을 DB에 반영 (하지만 트랜잭션은 아직 커밋 전)
        em.clear(); // 영속성 컨텍스트를 완전히 비운다 -> 이제 1차 캐시에 아무것도 없다.

        Member first = em.find(Member.class, member.getId());  // SELECT 발생 (캐시에 없으므로)
        Member second = em.find(Member.class, member.getId()); // 캐시에 있으므로 SELECT 발생 안 함

        assertThat(first).isSameAs(second);
    }
}
