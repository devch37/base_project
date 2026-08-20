package com.jpatutor.ch07_proxy_fetch;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * [7장] Order는 OrderItem들의 "생명주기를 통째로 책임지는" 애그리거트 루트다.
 *
 * - cascade = CascadeType.ALL: Order를 persist/remove 하면 그 상태 변화가 자식(OrderItem)에게
 *   전이(cascade)된다. 즉 order만 persist해도 컬렉션에 담긴 orderItem들이 자동으로 함께 저장된다.
 *   주의: cascade는 "연관관계의 주인 여부"와 무관한 별개의 기능이고, 오직 Order를 통해서만
 *   OrderItem을 저장/삭제하는 소유 관계(private ownership)일 때만 사용해야 한다. 여러 부모가
 *   자식을 공유하는 경우에 cascade ALL을 쓰면 다른 부모가 삭제될 때 자식까지 같이 삭제되는
 *   사고로 이어질 수 있다.
 * - orphanRemoval = true: 컬렉션(orderItems)에서 자식을 제거하면(items.remove(item)),
 *   그 자식은 "고아(orphan)"가 된 것으로 간주되어 DB에서도 실제로 DELETE된다.
 *   cascade와 orphanRemoval을 함께 쓰면, Order 하나만 갖고도 OrderItem 전체 생명주기를
 *   완전히 제어할 수 있다 (DDD의 애그리거트 루트 패턴과 정확히 맞아떨어진다).
 * - fetch = LAZY: 컬렉션 연관관계는 항상 LAZY로 설정한다 (@OneToMany의 기본값도 원래 LAZY지만
 *   명시적으로 적어서 의도를 분명히 한다).
 */
@Entity
@Table(name = \"ch07_order\")
@Getter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems = new ArrayList<>();

    public Order(String orderer) {
        this.orderer = orderer;
    }

    public void addItem(OrderItem item) {
        orderItems.add(item);
        item.assignOrder(this);
    }

    public void removeItem(OrderItem item) {
        // 이 한 줄만으로 DB에서 해당 order_item 로우가 DELETE된다 (orphanRemoval 덕분에).
        orderItems.remove(item);
    }
}
