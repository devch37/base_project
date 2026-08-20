package com.jpatutor.ch08_persistence_context;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * [8장] 영속성 컨텍스트의 핵심 기능 4가지를 Hibernate Statistics로 "정확한 SQL 실행 횟수"를
 * 확인하며 검증한다. 콘솔 로그를 눈으로 보는 것보다 훨씬 확실한 방법이다.
 */
@DataJpaTest
class PersistenceContextTest {

    @Autowired
    EntityManager em;

    @Autowired
    EntityManagerFactory emf;

    Statistics statistics;

    @BeforeEach
    void setUp() {
        statistics = emf.unwrap(SessionFactory.class).getStatistics();
        statistics.clear(); // 테스트마다 카운터를 0으로 초기화
    }

    @Test
    @DisplayName("쓰기 지연: persist() 직후에는 INSERT가 안 나가고, flush 시점에 한꺼번에 나간다")
    @Transactional
    void writeBehind() {
        Member m1 = new Member("A");
        Member m2 = new Member("B");

        em.persist(m1);
        em.persist(m2);

        // SEQUENCE 전략이므로 persist() 두 번을 호출한 시점까지는 아직 실제 INSERT SQL이 실행되지
        // 않고 쓰기 지연 저장소에 쌓여 있기만 하다.
        assertThat(statistics.getEntityInsertCount()).isZero();

        em.flush(); // 여기서 비로소 쌓여있던 INSERT 두 건이 한꺼번에 DB로 전달된다.

        assertThat(statistics.getEntityInsertCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("변경 감지(Dirty Checking): setter만 호출해도 flush 시점에 자동으로 UPDATE가 나간다")
    @Transactional
    void dirtyChecking() {
        Member member = new Member("변경전");
        em.persist(member);
        em.flush();
        statistics.clear(); // 위 INSERT는 카운트에서 제외하고, 이제부터 UPDATE만 측정한다.

        // em.update() 같은 메서드는 JPA에 존재하지 않는다! 그냥 setter로 필드 값만 바꾸면 된다.
        // 영속 상태인 엔티티는 flush 시점에 "최초 로딩 시점의 스냅샷"과 현재 필드 값을 비교해서
        // 변경된 필드가 있으면 자동으로 UPDATE SQL을 만들어낸다. 이것이 변경 감지다.
        member.changeName("변경후");

        assertThat(statistics.getEntityUpdateCount()).isZero(); // 아직 flush 전이므로 0

        em.flush();

        assertThat(statistics.getEntityUpdateCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("flush는 DB에 SQL을 반영할 뿐 트랜잭션을 커밋하지 않고, clear는 영속성 컨텍스트를 완전히 비운다")
    @Transactional
    void flushVsClear() {
        Member member = new Member("영속상태");
        em.persist(member);
        em.flush();

        // flush 이후에도 member는 여전히 영속 상태(persistent)이므로 컨텍스트 안에 남아있다.
        assertThat(em.contains(member)).isTrue();

        em.clear();

        // clear()는 영속성 컨텍스트 자체를 리셋한다. 이제 member는 준영속(detached) 상태가 되어
        // 더 이상 변경 감지의 대상이 아니다 (setter를 호출해도 flush해도 DB에 반영되지 않는다).
        assertThat(em.contains(member)).isFalse();
    }
}
