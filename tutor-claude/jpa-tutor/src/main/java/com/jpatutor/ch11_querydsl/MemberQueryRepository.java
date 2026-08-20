package com.jpatutor.ch11_querydsl;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.jpatutor.ch11_querydsl.QMember.member;
import static com.jpatutor.ch11_querydsl.QTeam.team;

/**
 * [11장] QueryDSL 동적 쿼리의 실무 표준 패턴.
 *
 * BooleanBuilder로 조건을 if문을 써가며 누적하는 방식도 있지만, 실무에서는 아래처럼
 * "조건 하나당 메서드 하나(BooleanExpression 반환)"로 쪼개는 방식을 훨씬 선호한다. 이유:
 * - 각 조건 메서드를 다른 쿼리에서도 재사용할 수 있다.
 * - where()에 넘긴 BooleanExpression 중 null인 것은 QueryDSL이 자동으로 무시해준다.
 *   즉 "이 조건이 없으면 WHERE절에서 빼라"는 로직을 null 리턴만으로 표현할 수 있어 매우 깔끔하다.
 * - 조건에 이름이 붙어서(nameEq, ageGoe 등) 가독성이 좋고 테스트하기도 쉽다.
 */
@Repository
@RequiredArgsConstructor
public class MemberQueryRepository {

    private final JPAQueryFactory queryFactory;

    public List<Member> search(MemberSearchCondition condition) {
        return queryFactory
                .selectFrom(member)
                .leftJoin(member.team, team)
                .where(
                        nameEq(condition.getName()),
                        ageGoe(condition.getAgeGoe()),
                        ageLoe(condition.getAgeLoe()),
                        teamNameEq(condition.getTeamName())
                )
                .fetch();
    }

    private BooleanExpression nameEq(String name) {
        return name == null ? null : member.name.eq(name);
    }

    private BooleanExpression ageGoe(Integer ageGoe) {
        return ageGoe == null ? null : member.age.goe(ageGoe);
    }

    private BooleanExpression ageLoe(Integer ageLoe) {
        return ageLoe == null ? null : member.age.loe(ageLoe);
    }

    private BooleanExpression teamNameEq(String teamName) {
        return teamName == null ? null : team.name.eq(teamName);
    }
}
