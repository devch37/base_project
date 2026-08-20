package com.jpatutor.ch03_association;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class AssociationOwnerTest {

    @Autowired
    EntityManager em;

    @Test
    @DisplayName("주인이 아닌 쪽(Team.members)에만 값을 넣으면 FK가 DB에 반영되지 않는다")
    @Transactional
    void settingNonOwnerSideDoesNothing() {
        Team team = new Team("백엔드팀");
        Member member = new Member("홍길동");
        em.persist(team);
        em.persist(member);

        // 주인이 아닌 Team.members 컬렉션에만 추가 -> DB의 member.team_id는 여전히 null이다.
        team.getMembers().add(member);

        em.flush();
        em.clear();

        Member reloaded = em.find(Member.class, member.getId());
        // team_id 컬럼이 세팅되지 않았으므로 team이 null이어야 한다.
        assertThat(reloaded.getTeam()).isNull();
    }

    @Test
    @DisplayName("주인 쪽(Member.team)에 값을 세팅해야 FK 업데이트가 실제로 반영된다")
    @Transactional
    void settingOwnerSideUpdatesForeignKey() {
        Team team = new Team("백엔드팀");
        Member member = new Member("홍길동");
        em.persist(team);
        em.persist(member);

        // 연관관계 편의 메서드를 통해 주인(Member.team)에 값을 세팅한다.
        member.changeTeam(team);

        em.flush();
        em.clear();

        Member reloaded = em.find(Member.class, member.getId());
        assertThat(reloaded.getTeam().getId()).isEqualTo(team.getId());
    }
}
