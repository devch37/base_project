package com.jpatutor.ch04_association_advanced;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [4장] 1:1 관계의 "주인이 아닌 쪽" 예제.
 * Locker는 FK를 갖지 않는다 (member 테이블에 locker_id가 있다).
 */
@Entity
@Table(name = \"ch04_locker\")
@Getter
@NoArgsConstructor
public class Locker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String number;

    public Locker(String number) {
        this.number = number;
    }
}
