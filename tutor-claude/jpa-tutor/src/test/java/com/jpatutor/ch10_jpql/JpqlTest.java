package com.jpatutor.ch10_jpql;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.Hibernate;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class JpqlTest {

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    EntityManager em;

    @Autowired
    EntityManagerFactory emf;

    Statistics statistics;

    @BeforeEach
    void setUp() {
        Team teamA = new Team("A팀");
        Team teamB = new Team("B팀");
        em.persist(teamA);
        em.persist(teamB);
        em.persist(new Member("홍길동", 20, teamA));
        em.persist(new Member("김철수", 25, teamB));
        em.flush();
        em.clear();

        statistics = emf.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
    }

    @Test
    @DisplayName("페치 조인 없이 team에 접근하면 프록시 상태로 조회되고, 실제 값 접근 시 추가 SELECT가 나간다")
    void withoutFetchJoinTeamIsProxy() {
        List<Member> members = memberRepository.findByAgeGreaterThanEqual(0);

        // team 필드는 아직 초기화되지 않은 프록시 상태다. (아래에서 값을 만지는 순간 SELECT 발생)
        assertThat(Hibernate.isInitialized(members.get(0).getTeam())).isFalse();
    }

    @Test
    @DisplayName("페치 조인을 쓰면 team까지 한 번의 쿼리로 함께 조회되어 이미 초기화되어 있다")
    void fetchJoinInitializesAssociationEagerly() {
        List<Member> members = memberRepository.findAllWithTeamFetchJoin();

        // join fetch 덕분에 team이 프록시가 아니라 이미 로딩된 실제 객체다.
        assertThat(Hibernate.isInitialized(members.get(0).getTeam())).isTrue();
        assertThat(members).extracting(m -> m.getTeam().getName())
                .containsExactlyInAnyOrder("A팀", "B팀");

        // 쿼리 실행 횟수를 세어 확인: fetch join은 회원 수와 무관하게 딱 1번의 SELECT만 실행한다.
        assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("DTO 프로젝션: 엔티티가 아니라 필요한 컬럼만 바로 DTO로 조립해서 받는다")
    void dtoProjection() {
        List<MemberTeamDto> dtos = memberRepository.findAllAsDto();

        assertThat(dtos).hasSize(2);
        assertThat(dtos).extracting(MemberTeamDto::getMemberName)
                .containsExactlyInAnyOrder("홍길동", "김철수");
        assertThat(dtos).extracting(MemberTeamDto::getTeamName)
                .containsExactlyInAnyOrder("A팀", "B팀");
    }
}
