package com.jpatutor.ch02_mapping;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Lob;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * [2장] 실무에서 자주 쓰는 컬럼 매핑 어노테이션들을 모아 놓은 예제.
 */
@Entity
@Table(name = \"ch02_product\")
@Getter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // name 속성으로 DB 컬럼명을 명시적으로 지정할 수 있다 (자바 필드명과 다르게 가고 싶을 때).
    // nullable=false, length=100 처럼 DDL 생성 시 제약조건에 반영된다 (ddl-auto: create일 때만 의미 있음,
    // 운영에서는 어차피 Flyway/Liquibase가 실제 DDL을 관리하므로 이 속성들은 "문서화" 역할에 가깝다).
    @Column(name = "product_name", nullable = false, length = 100)
    private String name;

    // 실무 최대 함정: enum을 ORDINAL(기본값, 숫자로 저장)로 매핑하면 절대 안 된다!
    // 이유: 나중에 enum 상수 순서가 바뀌거나 중간에 새 값이 추가되면 기존 DB에 저장된 숫자의 의미가
    // 완전히 달라져 버린다 (예: 0=ELECTRONICS였는데 중간에 새 값을 추가해서 0=BOOK이 되는 식).
    // 반드시 STRING으로 저장해서 사람이 읽을 수 있고, 순서 변경에도 안전하게 만들어야 한다.
    @Enumerated(EnumType.STRING)
    private ProductCategory category;

    // BigDecimal은 금액처럼 정밀한 소수 계산이 필요한 곳에서 double/float 대신 반드시 사용해야 한다.
    // double은 부동소수점 오차 때문에 금액 계산에 쓰면 안 된다 (0.1 + 0.2 != 0.3 인 문제).
    private BigDecimal price;

    // 매우 긴 텍스트(설명, 본문 등)는 @Lob으로 매핑한다. DB의 CLOB/TEXT 타입에 대응된다.
    @Lob
    private String description;

    // Java 8 시간 API(LocalDateTime 등)는 하이버네이트가 별도 어노테이션 없이 자동으로 인식한다.
    // 옛날 JPA 코드에서 보이는 @Temporal(TemporalType.TIMESTAMP)는 java.util.Date/Calendar를 쓸 때만
    // 필요했던 legacy 어노테이션이고, 지금은 LocalDate/LocalDateTime을 쓰면 필요 없다.
    private LocalDateTime createdAt;

    // @Transient: 이 필드는 DB 컬럼과 매핑하지 않는다. 즉, 테이블에 컬럼이 생성되지 않고
    // 저장/조회 대상에서도 제외된다. 계산해서 보여주기만 하면 되는 필드에 사용한다.
    @Transient
    private String discountBadge;

    public Product(String name, ProductCategory category, BigDecimal price, String description) {
        this.name = name;
        this.category = category;
        this.price = price;
        this.description = description;
        this.createdAt = LocalDateTime.now();
    }

    public void markDiscount(String badge) {
        // discountBadge는 DB에 저장되지 않으므로, 조회 시점마다 애플리케이션 로직으로 다시 계산해줘야 한다.
        this.discountBadge = badge;
    }
}
