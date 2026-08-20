package com.jpatutor.ch05_inheritance;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [5장] RegisteredEntity(@MappedSuperclass)를 상속받는 평범한 엔티티.
 * note 테이블에는 content 컬럼뿐 아니라 부모의 registered_by 컬럼도 함께 생성된다.
 * RegisteredEntity 자체는 별도 테이블을 만들지 않는다는 점이 @Inheritance와의 결정적 차이다.
 */
@Entity
@Table(name = \"ch05_note\")
@Getter
@NoArgsConstructor
public class Note extends RegisteredEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;

    public Note(String content, String registeredBy) {
        this.content = content;
        register(registeredBy);
    }
}
