package com.jpatutor.ch15_performance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // toOne(member) + toMany(orderItems) 컬렉션 하나를 함께 fetch join.
    // 컬렉션이 하나뿐이라 MultipleBagFetchException 없이 안전하게 동작한다.
    @Query("select o from Order o join fetch o.member join fetch o.orderItems where o.id = :id")
    Optional<Order> findByIdFetchAll(Long id);
}
