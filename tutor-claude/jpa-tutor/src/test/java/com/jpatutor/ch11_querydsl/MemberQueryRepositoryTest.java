package com.jpatutor.ch11_querydsl;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * [11장] @DataJpaTest는 Spring Data JPA 리포지토리 인터페이스만 자동으로 스캔하고,
 * QuerydslConfig(@Configuration)나 MemberQueryRepository(@Repository) 같은 수동 빈은
 * 기본적으로 로드하지 않는다. 그래서 @Import로 직접 필요한 빈을 명시해줘야 한다.
 */
@DataJpaTest
@Import({QuerydslConfig.class, MemberQueryRepository.class})
class MemberQueryRepositoryTest {

    @Autowired
    EntityManager em;

    @Autowired
    MemberQueryRepository memberQueryRepository;

    @BeforeEach
    void setUp() {
        Team teamA = new Team("A팀");
        Team teamB = new Team("B팀");
        em.persist(teamA);
        em.persist(teamB);
        em.persist(new Member("홍길동", 20, teamA));
        em.persist(new Member("김철수", 25, teamA));
        em.persist(new Member("이영희", 30, teamB));
        em.flush();
        em.clear();
    }

    @Test
    @DisplayName("검색 조건이 일부만 채워져도(null인 조건은 무시되고) 나머지 조건으로만 동적으로 필터링된다")
    void searchWithPartialCondition() {
        // 이름/나이 조건 없이 teamName만 채워서 검색 -> A팀 소속만 조회되어야 한다.
        MemberSearchCondition condition = new MemberSearchCondition(null, null, null, "A팀");

        List<Member> result = memberQueryRepository.search(condition);

        assertThat(result).extracting(Member::getName)
                .containsExactlyInAnyOrder("홍길동", "김철수");
    }

    @Test
    @DisplayName("나이 범위(ageGoe, ageLoe) 조건으로 검색할 수 있다")
    void searchByAgeRange() {
        MemberSearchCondition condition = new MemberSearchCondition(null, 22, 28, null);

        List<Member> result = memberQueryRepository.search(condition);

        assertThat(result).extracting(Member::getName).containsExactly("김철수");
    }
}
