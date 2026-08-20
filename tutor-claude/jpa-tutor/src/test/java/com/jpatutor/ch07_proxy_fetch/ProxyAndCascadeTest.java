package com.jpatutor.ch07_proxy_fetch;

import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ProxyAndCascadeTest {

    @Autowired
    EntityManager em;

    @Test
    @DisplayName("em.getReference()는 실제 SELECT 없이 프록시(가짜 객체)를 반환한다")
    @Transactional
    void proxyIsNotInitializedUntilAccessed() {
        Order order = new Order("홍길동");
        em.persist(order);
        em.flush();
        em.clear();

        // getReference()는 DB를 조회하지 않고 프록시 객체만 즉시 반환한다.
        // (id는 이미 알고 있으므로 프록시 생성에 굳이 SELECT가 필요 없다)
        Order proxy = em.getReference(Order.class, order.getId());
        assertThat(Hibernate.isInitialized(proxy)).isFalse();

        // 프록시의 실제 필드(orderer)에 접근하는 순간, 그제서야 SELECT가 나가면서 초기화된다.
        // p6spy 로그에서 이 지점에 select 쿼리가 찍히는 걸 확인해보자.
        String orderer = proxy.getOrderer();

        assertThat(Hibernate.isInitialized(proxy)).isTrue();
        assertThat(orderer).isEqualTo("홍길동");
    }

    @Test
    @DisplayName("cascade=ALL: 부모(Order)만 persist해도 자식(OrderItem)들이 함께 저장된다")
    @Transactional
    void cascadePersistsChildren() {
        Order order = new Order("김철수");
        order.addItem(new OrderItem("키보드", 1));
        order.addItem(new OrderItem("마우스", 2));

        // OrderItem에 대해 em.persist()를 따로 호출하지 않았다는 점에 주목.
        // cascade=ALL 덕분에 order를 persist하는 것만으로 두 OrderItem도 함께 INSERT된다.
        em.persist(order);
        em.flush();
        em.clear();

        Order reloaded = em.find(Order.class, order.getId());
        assertThat(reloaded.getOrderItems()).hasSize(2);
    }

    @Test
    @DisplayName("orphanRemoval=true: 컬렉션에서 제거하면 DB에서도 실제로 삭제된다")
    @Transactional
    void orphanRemovalDeletesChild() {
        Order order = new Order("이영희");
        OrderItem keyboard = new OrderItem("키보드", 1);
        OrderItem mouse = new OrderItem("마우스", 2);
        order.addItem(keyboard);
        order.addItem(mouse);
        em.persist(order);
        em.flush();
        em.clear();

        Order reloaded = em.find(Order.class, order.getId());
        OrderItem toRemove = reloaded.getOrderItems().get(0);

        // 컬렉션에서 제거하는 것만으로 별도의 em.remove() 호출 없이 DELETE가 나간다.
        reloaded.removeItem(toRemove);
        em.flush();
        em.clear();

        Order afterRemoval = em.find(Order.class, order.getId());
        assertThat(afterRemoval.getOrderItems()).hasSize(1);
    }
}
