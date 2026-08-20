package com.jpatutor.ch12_n_plus_one;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * [12장] 해결책 3 - 배치 사이즈(default_batch_fetch_size).
 *
 * fetch join이나 @EntityGraph는 "이 쿼리에서만" 연관관계를 함께 로딩하는 방식이라 매번
 * 쿼리 메서드를 새로 정의해야 한다. 반면 배치 사이즈는 하이버네이트 전역(혹은 특정 연관관계)
 * 설정으로, "지연 로딩된 프록시를 초기화해야 할 때, 하나씩 SELECT하지 말고 최대 N개씩
 * IN절로 묶어서 한 번에 가져와라"라고 지시하는 것이다.
 *
 * fetch join처럼 완전히 1번으로 줄이진 못하지만(배치 크기만큼 나눠서 실행되므로),
 * 코드 변경 없이 설정 하나로 "모든" N+1 상황에 광범위하게 적용된다는 게 가장 큰 장점이라
 * 실무에서는 fetch join/EntityGraph와 배치 사이즈를 함께 기본 전략으로 깔아두는 경우가 많다.
 */
@DataJpaTest
@TestPropertySource(properties = "spring.jpa.properties.hibernate.default_batch_fetch_size=2")
class BatchSizeFixTest {

    @Autowired
    EntityManager em;

    @Autowired
    TeamRepository teamRepository;

    @Autowired
    EntityManagerFactory emf;

    Statistics statistics;

    @BeforeEach
    void setUp() {
        for (int i = 1; i <= 3; i++) {
            Team team = new Team("팀" + i);
            em.persist(team);
            em.persist(new Member("멤버" + i + "-1", team));
        }
        em.flush();
        em.clear();

        statistics = emf.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
    }

    @Test
    @DisplayName("배치 사이즈=2: team 3개의 members를 순회해도 2개씩 묶여서 1(팀)+2(배치)=3번만 SELECT가 나간다")
    void fixWithBatchSize() {
        List<Team> teams = teamRepository.findAll(); // 1번: team 목록 조회

        for (Team team : teams) {
            team.getMembers().size(); // 첫 team에서 프록시 2개를 배치로 미리 채워두므로,
            // 3번째 team 차례에는 이미 초기화되어 있어 추가 SELECT가 없다.
        }

        // 1 (팀 목록) + 2 (배치 사이즈 2로 3개를 묶으면 ceil(3/2)=2번의 IN절 조회) = 3
        assertThat(statistics.getPrepareStatementCount()).isEqualTo(3);
    }
}
