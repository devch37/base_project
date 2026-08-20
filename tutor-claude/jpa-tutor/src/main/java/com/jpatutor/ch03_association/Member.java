package com.jpatutor.ch03_association;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [3장] 연관관계의 "주인" (실제 FK를 관리하는 쪽).
 *
 * - @ManyToOne: 여러 Member가 하나의 Team에 속한다는 의미. "다(N)" 쪽인 Member가
 *   보통 연관관계의 주인이 된다. 왜냐하면 실제 관계형 DB 테이블 설계상 FK는 항상 "N" 쪽 테이블에
 *   두기 때문이다(member.team_id 컬럼). 반대로 Team 테이블에 FK를 두려면 Team 하나가 여러
 *   member_id를 가져야 하는데, 이는 RDB 정규화 원칙에 어긋난다.
 * - @JoinColumn(name = "team_id"): 실제 FK 컬럼명을 지정한다. 생략하면 하이버네이트가
 *   "필드명_참조테이블PK" 규칙으로 자동 생성한다 (team_id).
 * - FetchType.LAZY: 연관관계는 기본적으로 LAZY로 설정하는 것이 실무 원칙이다.
 *   @ManyToOne/@OneToOne의 기본값은 EAGER인데, 이를 그대로 두면 예상치 못한 즉시 로딩과
 *   N+1 문제의 원인이 된다. (7장, 12장에서 자세히 다룬다)
 */
@Entity
@Table(name = \"ch03_member\")
@Getter
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    public Member(String name) {
        this.name = name;
    }

    /**
     * 연관관계 편의 메서드. 주인(Member.team)에 값을 세팅하는 동시에
     * 반대편(Team.members) 컬렉션에도 추가해줘서 "양쪽 객체 상태"를 항상 일치시킨다.
     * DB에는 team 필드만 반영되지만, 자바 객체 그래프의 일관성을 위해 양쪽 다 세팅하는 것이
     * 실무 컨벤션이다 (안 그러면 같은 트랜잭션 내에서 Team.members를 순회할 때 방금 추가한
     * Member가 안 보이는 버그가 생길 수 있다).
     */
    public void changeTeam(Team team) {
        this.team = team;
        team.getMembers().add(this);
    }
}
