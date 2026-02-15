package be.com.springbootclaude.ddd.order.domain.repository

import be.com.springbootclaude.ddd.order.domain.model.Order
import be.com.springbootclaude.ddd.order.domain.model.OrderStatus
import java.time.LocalDateTime

/**
 * Repository Interface (Domain Layer)
 *
 * Repository란?
 * - Aggregate를 저장하고 조회하는 추상화
 * - 마치 컬렉션처럼 다루는 인터페이스
 * - 구현은 Infrastructure Layer에
 *
 * DDD에서 Repository의 핵심:
 * 1. Domain Layer에는 인터페이스만 (의존성 역전)
 * 2. 영속화 기술 숨김 (JPA든 MongoDB든 상관없이)
 * 3. Aggregate Root 단위로만 Repository 제공
 *    - OrderRepository는 있지만
 *    - OrderItemRepository는 없음!
 *    - OrderItem은 Order를 통해서만 접근
 *
 * Spring Data JPA와의 차이:
 * - Spring Data JPA는 기술 중심
 * - DDD Repository는 도메인 중심
 * - 필요한 쿼리 메서드만 정의 (도메인 언어로)
 */
interface OrderRepository {

    /**
     * Aggregate Root 저장
     * - Order와 OrderItem 모두 저장 (Cascade)
     */
    fun save(order: Order): Order

    /**
     * ID로 Aggregate 조회
     * - Order와 OrderItem 모두 조회
     */
    fun findById(id: Long): Order?

    /**
     * 도메인 의미 있는 쿼리 메서드
     * - "고객의 주문 목록 조회"는 도메인 유스케이스
     */
    fun findByCustomerId(customerId: Long): List<Order>

    /**
     * 도메인 쿼리: 특정 상태의 주문 조회
     */
    fun findByStatus(status: OrderStatus): List<Order>

    /**
     * 도메인 쿼리: 특정 기간의 주문 조회
     * - 비즈니스 리포트, 통계에 사용
     */
    fun findByOrderedAtBetween(startDate: LocalDateTime, endDate: LocalDateTime): List<Order>

    /**
     * Aggregate 삭제
     * - 실무에서는 보통 Soft Delete (상태만 변경)
     */
    fun deleteById(id: Long)

    /**
     * 도메인 쿼리: 고객의 특정 상태 주문 존재 여부
     * - "이 고객이 진행중인 주문이 있는가?" 같은 비즈니스 규칙 검증
     */
    fun existsByCustomerIdAndStatus(customerId: Long, status: OrderStatus): Boolean
}
