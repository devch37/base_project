package com.jpatutor.ch11_querydsl;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [11장] 검색 화면에서 넘어오는 "동적 조건"을 담는 DTO.
 * 필드 전부가 null일 수 있다는 게 핵심이다 (사용자가 이름만 입력할 수도, 나이 범위만 입력할 수도 있다).
 * 이런 "조건에 따라 WHERE절이 달라지는" 요구사항이 QueryDSL이 진짜 힘을 발휘하는 지점이다.
 */
@Getter
@NoArgsConstructor
public class MemberSearchCondition {

    private String name;
    private Integer ageGoe; // greater than or equal
    private Integer ageLoe; // less than or equal
    private String teamName;

    public MemberSearchCondition(String name, Integer ageGoe, Integer ageLoe, String teamName) {
        this.name = name;
        this.ageGoe = ageGoe;
        this.ageLoe = ageLoe;
        this.teamName = teamName;
    }
}
