package com.jpatutor.ch14_transaction_lock;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [14장] 낙관적 락(Optimistic Lock) - @Version.
 *
 * @Version이 붙은 필드는 엔티티가 UPDATE될 때마다 하이버네이트가 자동으로 1씩 증가시킨다.
 * 그리고 UPDATE SQL의 WHERE절에 "and version = 조회했던_버전값"을 자동으로 추가한다.
 *
 * 예: UPDATE product SET stock=?, version=1 WHERE id=? AND version=0
 *
 * 만약 내가 버전 0을 읽은 사이에 다른 트랜잭션이 먼저 커밋해서 버전이 1로 바뀌었다면,
 * 내 UPDATE문의 WHERE절(version=0)에 해당하는 로우가 이미 없으므로 영향받은 row 수가 0이 되고,
 * 하이버네이트는 이를 감지해서 OptimisticLockException(스프링에서는
 * ObjectOptimisticLockingFailureException)을 던진다.
 *
 * 핵심: 낙관적 락은 "충돌이 자주 안 일어날 것"이라 낙관(optimistic)하고, 미리 락을 걸어서
 * 막지 않고, 커밋 시점에 충돌 여부만 확인한다. 그래서 평소엔 성능 저하가 거의 없고,
 * 충돌이 드물게 발생하는 상황(대부분의 웹 서비스)에 적합하다.
 */
@Entity
@Table(name = \"ch14_product\")
@Getter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private int stock;

    @Version
    private Long version;

    public Product(String name, int stock) {
        this.name = name;
        this.stock = stock;
    }

    public void decreaseStock(int quantity) {
        if (this.stock < quantity) {
            throw new IllegalStateException("재고가 부족합니다");
        }
        this.stock -= quantity;
    }
}
