package com.jpatutor.ch11_querydsl;

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
 * [11장] 이 클래스에 @Entity가 붙어있으면, 빌드 시 QueryDSL의 annotation processor(APT)가
 * build/generated/sources/annotationProcessor/java/main/com/jpatutor/ch11_querydsl/QMember.java
 * 라는 "Q타입" 클래스를 자동으로 만들어준다. QMember.member.name, QMember.member.age 처럼
 * 필드 하나하나가 타입-세이프한 객체로 노출되어서, 문자열 기반 JPQL과 달리 컴파일 타임에
 * 오타나 타입 실수를 잡아낼 수 있다.
 */
@Entity
@Table(name = \"ch11_member\")
@Getter
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private int age;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    public Member(String name, int age, Team team) {
        this.name = name;
        this.age = age;
        this.team = team;
    }
}
