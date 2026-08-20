package com.jpatutor.ch03_association;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * [3장] 연관관계의 "주인이 아닌 쪽" (거울 역할).
 *
 * mappedBy = "team" 은 "나(Team)는 이 관계의 주인이 아니고, 실제 FK는 Member.team 필드가
 * 관리한다"는 뜻이다. mappedBy에 적는 값은 상대방 엔티티(Member)에서 나(Team)를 가리키는
 * 필드 이름이다.
 *
 * 핵심 규칙: "외래키(FK)가 있는 곳이 연관관계의 주인이다."
 * 이 예제에서 FK(team_id)는 member 테이블에 있으므로, Member.team이 주인이고 Team.members는
 * 주인이 아니다. 주인이 아닌 쪽에 값을 세팅해도(teamAOfMembers.add(member)) DB에는 절대 반영되지
 * 않는다. 오직 주인 쪽(Member.setTeam(team))에 값을 세팅해야 FK 업데이트 쿼리가 나간다.
 */
@Entity
@Table(name = \"ch03_team\")
@Getter
@NoArgsConstructor
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // 주인이 아닌 쪽은 조회 전용이라고 생각하면 편하다. 편의 메서드(addMember)를 두는 것은 좋지만
    // 그 메서드가 실제 DB 반영을 책임지지는 않는다는 걸 항상 기억해야 한다.
    @OneToMany(mappedBy = "team")
    private List<Member> members = new ArrayList<>();

    public Team(String name) {
        this.name = name;
    }
}
