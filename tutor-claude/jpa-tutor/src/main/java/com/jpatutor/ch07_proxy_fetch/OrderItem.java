package com.jpatutor.ch07_proxy_fetch;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = \"ch07_order_item\")
@Getter
@NoArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemName;

    private int quantity;

    // 자식(N) 쪽에서 부모(1)를 참조하는 연관관계는 항상 LAZY로 둔다.
    // 이렇게 해야 OrderItem만 단독으로 조회할 때 불필요하게 Order까지 딸려오는 걸 막을 수 있다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    public OrderItem(String itemName, int quantity) {
        this.itemName = itemName;
        this.quantity = quantity;
    }

    void assignOrder(Order order) {
        this.order = order;
    }
}
