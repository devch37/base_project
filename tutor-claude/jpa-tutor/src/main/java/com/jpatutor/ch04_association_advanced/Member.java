package com.jpatutor.ch04_association_advanced;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [4장] @OneToOne 매핑.
 *
 * 1:1 관계에서는 "누가 주인이 될지"를 직접 골라야 한다 (1:N과 달리 정해진 규칙이 없다).
 * 실무 기준: "FK를 어느 테이블에 두는 게 더 자주 조회되는 방향인가"로 정한다.
 * 여기서는 "회원 한 명이 사물함 하나를 배정받는다"는 요구사항에서, 회원을 조회할 때
 * 사물함 정보가 자주 필요하므로 Member 쪽에 FK(locker_id)를 두고 주인으로 삼았다.
 *
 * 참고: FK를 가진 쪽(주인)은 EAGER든 LAZY든 상대방이 있는지 없는지(null 가능성)를
 * DB 조회 없이는 알 수 없으므로, LAZY로 설정해도 프록시가 아니라 실제로 select가 나갈 수도 있다는
 * 점에 유의해야 한다. FK가 nullable=false로 반드시 존재를 보장할 때만 LAZY 프록시 최적화가
 * 온전히 동작한다.
 */
@Entity
@Table(name = \"ch04_member\")
@Getter
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locker_id")
    private Locker locker;

    public Member(String name) {
        this.name = name;
    }

    public void assignLocker(Locker locker) {
        this.locker = locker;
    }
}
