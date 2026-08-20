package com.jpatutor.ch06_valuetype;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * [6장] 값 타입을 실제로 사용하는 엔티티.
 *
 * - @Embedded: Address를 그대로 member 테이블의 컬럼들(city, street, zipcode)로 풀어 넣는다.
 *   Address는 별도 테이블을 만들지 않는다.
 * - homeAddress와 workAddress처럼 같은 임베디드 타입을 "두 번" 쓰면 컬럼명이 겹치므로
 *   @AttributeOverrides로 각각 다른 컬럼명을 지정해줘야 한다.
 * - @ElementCollection: 값 타입을 컬렉션으로 담을 때 사용한다. 내부적으로 별도의 테이블
 *   (여기서는 member_favorite_food)을 만들어서, member_id + 값들을 저장한다. 이 테이블에는
 *   식별자가 없고(값 목록일 뿐), member_id를 FK로 가진다.
 *
 * 값 타입 컬렉션의 실무 함정: 컬렉션의 값 하나를 바꾸고 싶어도 "부분 수정 UPDATE"가 불가능하다.
 * 하이버네이트는 값 타입 컬렉션이 변경되면 연관된 모든 값을 DELETE 하고 현재 컬렉션 상태를 통째로
 * 다시 INSERT 한다. 그래서 값 타입 컬렉션의 아이템 개수가 많거나 자주 변경된다면 성능 문제가
 * 생길 수 있고, 이럴 땐 차라리 별도의 엔티티(예: FavoriteFood 엔티티 + @OneToMany)로 승격시켜서
 * 개별 식별자를 갖게 만드는 것이 실무 해법이다.
 */
@Entity
@Table(name = \"ch06_member\")
@Getter
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Embedded
    private Address homeAddress;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "city", column = @Column(name = "work_city")),
            @AttributeOverride(name = "street", column = @Column(name = "work_street")),
            @AttributeOverride(name = "zipcode", column = @Column(name = "work_zipcode")),
    })
    private Address workAddress;

    @ElementCollection
    @CollectionTable(name = "ch06_member_favorite_food", joinColumns = @JoinColumn(name = "member_id"))
    @Column(name = "food_name")
    private Set<String> favoriteFoods = new HashSet<>();

    // 값 타입도 임베디드 타입의 "컬렉션"으로 가질 수 있다 (예: 과거 이사했던 주소 이력).
    @ElementCollection
    @CollectionTable(name = "ch06_member_address_history", joinColumns = @JoinColumn(name = "member_id"))
    private List<Address> addressHistory = new ArrayList<>();

    public Member(String name, Address homeAddress) {
        this.name = name;
        this.homeAddress = homeAddress;
    }

    public void moveHome(Address newAddress) {
        // 값 타입은 불변이므로 "필드 안의 값을 수정"하지 않고, 이전 주소를 이력에 남긴 뒤
        // 완전히 새로운 Address 인스턴스로 "교체"한다.
        this.addressHistory.add(this.homeAddress);
        this.homeAddress = newAddress;
    }

    public void assignWorkAddress(Address workAddress) {
        this.workAddress = workAddress;
    }

    public void addFavoriteFood(String food) {
        this.favoriteFoods.add(food);
    }
}
