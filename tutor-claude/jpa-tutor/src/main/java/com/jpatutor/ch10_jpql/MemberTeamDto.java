package com.jpatutor.ch10_jpql;

import lombok.Getter;

/**
 * [10장] DTO 프로젝션용 클래스.
 * JPQL의 "new com.jpatutor.ch10_jpql.MemberTeamDto(...)" 생성자 표현식과 매핑되므로,
 * 여기 선언된 생성자의 파라미터 타입/순서가 JPQL의 select 절과 정확히 일치해야 한다.
 */
@Getter
public class MemberTeamDto {

    private final Long memberId;
    private final String memberName;
    private final String teamName;

    public MemberTeamDto(Long memberId, String memberName, String teamName) {
        this.memberId = memberId;
        this.memberName = memberName;
        this.teamName = teamName;
    }
}
