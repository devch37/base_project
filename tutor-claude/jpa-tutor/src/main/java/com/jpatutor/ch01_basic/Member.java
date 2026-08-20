package com.jpatutor.ch01_basic;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [1장] JPA의 가장 기본이 되는 엔티티.
 *
 * - @Entity: 이 클래스가 JPA가 관리하는 "영속 객체"임을 표시한다. JPA는 이 어노테이션이 붙은
@Table(name = \"ch01_member\")
 *   클래스를 스캔해서 테이블과 매핑한다.
 * - @Id: 테이블의 기본 키(PK)와 매핑되는 필드. 모든 엔티티는 반드시 식별자를 가져야 한다.
 * - @GeneratedValue(strategy = IDENTITY): DB에게 기본 키 생성을 위임한다(MySQL의 AUTO_INCREMENT,
 *   H2/PostgreSQL의 IDENTITY 컬럼 등). 주의할 점은 IDENTITY 전략은 실제로 INSERT 쿼리를 실행해야만
 *   ID 값을 알 수 있기 때문에, JPA의 "쓰기 지연(transactional write-behind)" 최적화가 적용되지 않고
 *   persist() 호출 시점에 즉시 INSERT가 나간다. (8장에서 쓰기 지연을 다룰 때 다시 설명한다)
 *
 * JPA 엔티티는 반드시 파라미터가 없는 기본 생성자를 가져야 한다(public 또는 protected).
 * 이는 JPA 구현체(Hibernate)가 프록시를 만들거나 리플렉션으로 객체를 생성할 때 필요하기 때문이다.
 * private으로 막으면 프록시 생성이 불가능해지므로 최소 protected로 열어둬야 한다.
 */
@Entity
@Getter
@NoArgsConstructor // JPA 스펙이 요구하는 기본 생성자. Lombok으로 생성하되 protected 대신 public으로 둬도 무방하다.
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private int age;

    public Member(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void changeName(String name) {
        this.name = name;
    }
}
