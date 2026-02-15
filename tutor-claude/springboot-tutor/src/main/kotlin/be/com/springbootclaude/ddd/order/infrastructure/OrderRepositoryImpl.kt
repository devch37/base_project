package be.com.springbootclaude.ddd.order.infrastructure

import be.com.springbootclaude.ddd.order.domain.model.Order
import be.com.springbootclaude.ddd.order.domain.model.OrderStatus
import be.com.springbootclaude.ddd.order.domain.repository.OrderRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

/**
 * Repository 구현체 (Infrastructure Layer)
 *
 * DDD의 의존성 역전 원칙:
 * - Domain Layer: OrderRepository 인터페이스 정의
 * - Infrastructure Layer: OrderRepositoryImpl 구현
 * - Domain이 Infrastructure에 의존하지 않음!
 *
 * 이점:
 * 1. 영속화 기술 교체 가능 (JPA -> MongoDB)
 * 2. 테스트 시 Fake Repository로 교체 쉬움
 * 3. 도메인 로직과 기술 세부사항 분리
 */
@Repository
class OrderRepositoryImpl(
    private val orderJpaRepository: OrderJpaRepository
) : OrderRepository {

    override fun save(order: Order): Order {
        return orderJpaRepository.save(order)
    }

    override fun findById(id: Long): Order? {
        return orderJpaRepository.findByIdOrNull(id)
    }

    override fun findByCustomerId(customerId: Long): List<Order> {
        return orderJpaRepository.findByCustomerId(customerId)
    }

    override fun findByStatus(status: OrderStatus): List<Order> {
        return orderJpaRepository.findByStatus(status)
    }

    override fun findByOrderedAtBetween(
        startDate: LocalDateTime,
        endDate: LocalDateTime
    ): List<Order> {
        return orderJpaRepository.findByOrderedAtBetween(startDate, endDate)
    }

    override fun deleteById(id: Long) {
        orderJpaRepository.deleteById(id)
    }

    override fun existsByCustomerIdAndStatus(customerId: Long, status: OrderStatus): Boolean {
        return orderJpaRepository.existsByCustomerIdAndStatus(customerId, status)
    }
}
