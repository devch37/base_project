package com.jpatutor.ch05_inheritance;

import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * [5장] 상속관계 매핑 - SINGLE_TABLE 전략.
 *
 * JPA는 객체의 상속 구조를 3가지 방식 중 하나로 테이블에 매핑할 수 있다:
 *
 * 1) SINGLE_TABLE (여기서 사용) - 부모/자식 모든 필드를 "테이블 하나"에 몰아넣고,
 *    DTYPE 같은 구분 컬럼으로 어떤 자식 타입인지 구분한다.
 *    장점: 조인이 필요 없어서 조회 성능이 가장 좋다.
 *    단점: 자식 타입마다 다른 컬럼들이 전부 한 테이블에 모이므로, 자식 전용 컬럼은
 *    다른 자식 로우에서는 항상 NULL이 된다 (컬럼이 늘어날수록 테이블이 지저분해짐).
 *    실무에서 가장 무난하게 많이 쓰는 전략이다 (성능 우선).
 *
 * 2) JOINED - 부모 테이블에는 공통 필드만, 자식 테이블에는 자신만의 필드 + 부모 PK를
 *    공유하는 FK를 둔다. 조회할 때 부모/자식 테이블을 JOIN해서 가져온다.
 *    장점: 정규화가 잘 되어 있어 저장 공간 낭비가 없고 제약조건을 걸기 좋다.
 *    단점: 조회할 때마다 JOIN이 필요해서 SINGLE_TABLE보다 느리고 쿼리가 복잡해진다.
 *
 * 3) TABLE_PER_CLASS - 자식 타입마다 완전히 독립된 테이블을 만들고, 부모의 공통 필드도
 *    자식 테이블마다 중복해서 컬럼으로 가진다 (부모 테이블 자체는 안 만들어짐).
 *    단점: 여러 자식 타입을 한꺼번에 조회(부모 타입 기준 조회)하려면 UNION ALL이 필요해서
 *    성능이 나쁘고, 실무에서는 거의 추천되지 않는 전략이다.
 *
 * @Inheritance(strategy = ...) 는 부모 클래스에만 선언한다.
 * @DiscriminatorColumn 은 SINGLE_TABLE/JOINED에서 "이 로우가 어떤 자식 타입인지" 구분하는
 * 컬럼(기본 이름 DTYPE)을 만든다. 각 자식은 @DiscriminatorValue로 자신의 구분 값을 지정한다.
 */
@Entity
@Table(name = \"ch05_item\")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "dtype")
@Getter
@NoArgsConstructor
public abstract class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private BigDecimal price;

    protected Item(String name, BigDecimal price) {
        this.name = name;
        this.price = price;
    }
}
