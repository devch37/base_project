package com.jpatutor.ch05_inheritance;

import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

/**
 * [5장] @MappedSuperclass - 상속 매핑과 자주 헷갈리지만 완전히 다른 개념이다.
 *
 * @Inheritance는 "객체 상속 구조 자체를 테이블로 어떻게 표현할지"에 대한 전략이고,
 * @MappedSuperclass는 그냥 "여러 엔티티가 공통으로 쓰는 필드(매핑 정보)를 재사용하기 위한
 * 부모 클래스"다. @MappedSuperclass 자체는 테이블과 매핑되지 않고, 엔티티도 아니다
 * (JPA가 관리하는 타입 계층에 포함되지 않는다 - 즉 이 타입으로는 조회를 할 수 없다).
 * 오직 자식 엔티티들이 필드를 상속받아 각자의 테이블 컬럼으로 만들 때만 쓰인다.
 *
 * 실무에서는 등록자/수정자, 생성일/수정일처럼 "거의 모든 엔티티가 공통으로 갖는 필드"를
 * 여기에 모아두고 상속받는 방식으로 중복 코드를 줄인다 (16장 Auditing에서 실제 활용 예시를 다룬다).
 */
@MappedSuperclass
@Getter
public abstract class RegisteredEntity {

    private String registeredBy;

    protected void register(String registeredBy) {
        this.registeredBy = registeredBy;
    }
}
