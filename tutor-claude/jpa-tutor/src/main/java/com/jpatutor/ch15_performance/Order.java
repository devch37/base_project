package com.jpatutor.ch15_performance;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * [15장] 컬렉션 조회 최적화를 설명하기 위한 예제.
 *
 * 실무 팁: toOne 관계(@ManyToOne, @OneToOne)는 fetch join을 여러 개 걸어도 아무 문제가 없다
 * (row 개수가 늘어나지 않으므로). 하지만 toMany 관계(컬렉션)는 fetch join을 "동시에 두 개 이상"
 * 걸면 하이버네이트가 MultipleBagFetchException을 던진다 (컬렉션 2개를 한꺼번에 조인하면
 * 카티션 곱으로 로우 수를 예측할 수 없게 되기 때문). 그래서 원칙은:
 * - toOne 관계는 fetch join으로 자유롭게 묶는다.
 * - toMany 컬렉션은 "한 번에 하나만" fetch join 하고, 나머지 컬렉션은 배치 사이즈
 *   (default_batch_fetch_size, 12장 참고)로 지연 로딩 + IN절 배치 조회에 맡긴다.
 */
@Entity
@Table(name = \"ch15_order\")
@Getter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<OrderItem> orderItems = new ArrayList<>();

    public Order(Member member) {
        this.member = member;
    }

    public void addItem(OrderItem item) {
        orderItems.add(item);
    }
}
