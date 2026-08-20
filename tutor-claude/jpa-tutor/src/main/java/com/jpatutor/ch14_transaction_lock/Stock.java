package com.jpatutor.ch14_transaction_lock;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [14장] 비관적 락(Pessimistic Lock) 데모용 엔티티.
 * 일부러 @Version을 두지 않았다 - 비관적 락은 낙관적 락과 완전히 다른 메커니즘(DB 자체의
 * row lock)으로 동시성을 제어하므로 버전 컬럼이 필요 없다.
 */
@Entity
@Table(name = \"ch14_stock\")
@Getter
@NoArgsConstructor
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantity;

    public Stock(int quantity) {
        this.quantity = quantity;
    }

    public void decrease(int by) {
        this.quantity -= by;
    }
}
