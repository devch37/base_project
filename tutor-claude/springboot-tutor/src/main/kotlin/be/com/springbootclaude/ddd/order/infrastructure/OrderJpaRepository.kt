package be.com.springbootclaude.ddd.order.infrastructure

import be.com.springbootclaude.ddd.order.domain.model.Order
import be.com.springbootclaude.ddd.order.domain.model.OrderStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime

/**
 * Spring Data JPA Repository
 *
 * Infrastructure Layer의 세부 구현
 * - Domain Layer의 OrderRepository 인터페이스와는 별개
 * - 순수 기술적인 JPA 인터페이스
 */
interface OrderJpaRepository : JpaRepository<Order, Long> {

    /**
     * Spring Data JPA의 Query Method
     * - 메서드 이름으로 쿼리 자동 생성
     */
    fun findByCustomerId(customerId: Long): List<Order>

    fun findByStatus(status: OrderStatus): List<Order>

    fun findByOrderedAtBetween(startDate: LocalDateTime, endDate: LocalDateTime): List<Order>

    fun existsByCustomerIdAndStatus(customerId: Long, status: OrderStatus): Boolean

    /**
     * 복잡한 쿼리는 @Query로
     * - N+1 문제 방지를 위해 fetch join 사용
     */
    @Query("""
        SELECT DISTINCT o FROM Order o
        LEFT JOIN FETCH o._orderItems
        WHERE o.customerId = :customerId
        AND o.status = :status
    """)
    fun findByCustomerIdAndStatusWithItems(customerId: Long, status: OrderStatus): List<Order>
}
