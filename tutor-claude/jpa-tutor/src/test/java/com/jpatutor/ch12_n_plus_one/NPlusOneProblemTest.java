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
 * [12장] N+1 문제를 "정말로" 재현하려면 배치 페치(batch fetch)를 꺼야 한다.
 * 이 프로젝트의 application.yml에는 default_batch_fetch_size: 100이 전역 설정되어 있는데,
 * 이 값이 켜져 있으면 하이버네이트가 알아서 여러 프록시를 모아 IN절로 한 번에 조회해버려서
 * 순수한 N+1 현상을 관찰하기 어렵다. 그래서 이 테스트 클래스에서만 배치 크기를 1로 낮춰
 * (사실상 배치 기능을 끔) 진짜 N+1이 발생하는 모습을 확인한다.
 */
@DataJpaTest
@TestPropertySource(properties = "spring.jpa.properties.hibernate.default_batch_fetch_size=1")
class NPlusOneProblemTest {

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
            em.persist(new Member("멤버" + i + "-2", team));
        }
        em.flush();
        em.clear();

        statistics = emf.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
    }

    @Test
    @DisplayName("N+1 재현: team 3개를 조회한 뒤 각 team.getMembers()를 순회하면 총 1+3=4번 SELECT가 나간다")
    void nPlusOneProblem() {
        List<Team> teams = teamRepository.findAll(); // 1번: team 목록 조회

        for (Team team : teams) {
            team.getMembers().size(); // team마다 members 컬렉션을 초기화 -> 매번 추가 SELECT
        }

        // 1 (팀 목록) + 3 (팀 개수만큼 각각의 멤버 컬렉션 조회) = 4
        assertThat(statistics.getPrepareStatementCount()).isEqualTo(4);
    }

    @Test
    @DisplayName("해결책 1 - 페치 조인: team과 members를 조인해서 단 1번의 쿼리로 끝난다")
    void fixWithFetchJoin() {
        List<Team> teams = teamRepository.findAllFetchJoin();

        for (Team team : teams) {
            team.getMembers().size(); // 이미 fetch join으로 로딩되어 있어서 추가 SELECT가 없다.
        }

        assertThat(teams).hasSize(3);
        assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("해결책 2 - @EntityGraph: 선언적으로 연관관계를 함께 로딩해서 역시 1번의 쿼리로 끝난다")
    void fixWithEntityGraph() {
        List<Team> teams = teamRepository.findAllEntityGraph();

        for (Team team : teams) {
            team.getMembers().size();
        }

        assertThat(teams).hasSize(3);
        assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
    }
}
