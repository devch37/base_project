package be.com.springbootclaude.ddd.order.application

import be.com.springbootclaude.ddd.order.domain.model.Address
import be.com.springbootclaude.ddd.order.domain.model.Order
import be.com.springbootclaude.ddd.order.domain.model.ProductInfo
import be.com.springbootclaude.ddd.order.domain.repository.OrderRepository
import be.com.springbootclaude.ddd.order.domain.service.OrderPriceCalculator
import be.com.springbootclaude.ddd.order.infrastructure.OrderEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Application Service: OrderCommandService
 *
 * Application Service란?
 * - 유스케이스(Use Case)를 구현하는 계층
 * - 도메인 객체들을 조율 (Orchestration)
 * - 트랜잭션 경계
 * - 도메인 로직은 여기 없음! (도메인 모델에)
 *
 * Application Service vs Domain Service:
 * - Application Service: 유스케이스 흐름 제어
 * - Domain Service: 도메인 로직 구현
 *
 * CQRS 패턴:
 * - Command (쓰기): OrderCommandService
 * - Query (읽기): OrderQueryService
 * - 읽기와 쓰기 모델 분리
 */
@Service
@Transactional
class OrderCommandService(
    private val orderRepository: OrderRepository,
    private val orderPriceCalculator: OrderPriceCalculator,
    private val orderEventPublisher: OrderEventPublisher
) {

    /**
     * 유스케이스: 주문 생성
     *
     * Application Service의 전형적인 흐름:
     * 1. 입력 검증 (간단한 것만, 복잡한 건 도메인 모델에서)
     * 2. 도메인 객체 생성 및 조작
     * 3. Repository로 저장
     * 4. 이벤트 발행
     * 5. DTO 반환
     *
     * 주의: 비즈니스 로직은 도메인 모델에!
     * - "총액 계산", "상태 검증" 등은 Order가 담당
     * - Application Service는 "이 순서로 호출"만
     */
    fun createOrder(command: CreateOrderCommand): Long {
        // 1. 도메인 객체 생성
        val order = Order(
            customerId = command.customerId,
            deliveryAddress = command.deliveryAddress
        )

        // 2. 주문 항목 추가 (도메인 모델의 메서드 사용)
        command.items.forEach { item ->
            order.addItem(
                productInfo = item.productInfo,
                quantity = item.quantity
            )
        }

        // 3. 저장 (Aggregate 전체)
        val savedOrder = orderRepository.save(order)

        return savedOrder.id!!
    }

    /**
     * 유스케이스: 주문 확정
     */
    fun confirmOrder(orderId: Long) {
        // 1. Aggregate 조회
        val order = orderRepository.findById(orderId)
            ?: throw IllegalArgumentException("주문을 찾을 수 없습니다: $orderId")

        // 2. 도메인 로직 실행 (비즈니스 규칙 검증 포함)
        order.confirm()

        // 3. 저장 (상태 변경 반영)
        orderRepository.save(order)

        // 4. 도메인 이벤트 발행
        orderEventPublisher.publish(order.domainEvents)
        order.clearDomainEvents()
    }

    /**
     * 유스케이스: 주문 취소
     */
    fun cancelOrder(orderId: Long, reason: String) {
        val order = orderRepository.findById(orderId)
            ?: throw IllegalArgumentException("주문을 찾을 수 없습니다: $orderId")

        // 도메인 로직 위임 (취소 가능 여부 검증 포함)
        order.cancel(reason)

        orderRepository.save(order)

        // 이벤트 발행
        orderEventPublisher.publish(order.domainEvents)
        order.clearDomainEvents()
    }

    /**
     * 유스케이스: 주문 항목 추가
     */
    fun addOrderItem(orderId: Long, command: AddOrderItemCommand) {
        val order = orderRepository.findById(orderId)
            ?: throw IllegalArgumentException("주문을 찾을 수 없습니다: $orderId")

        // 도메인 메서드 호출 (비즈니스 규칙 검증 포함)
        order.addItem(
            productInfo = command.productInfo,
            quantity = command.quantity
        )

        orderRepository.save(order)
    }

    /**
     * 유스케이스: 주문 항목 제거
     */
    fun removeOrderItem(orderId: Long, productId: Long) {
        val order = orderRepository.findById(orderId)
            ?: throw IllegalArgumentException("주문을 찾을 수 없습니다: $orderId")

        order.removeItem(productId)




        orderRepository.save(order)
    }
}

/**
 * Command 객체: 유스케이스의 입력
 * - DTO의 일종
 * - 의도를 명확히 표현 (CreateOrderCommand, UpdateOrderCommand 등)
 */
data class CreateOrderCommand(
    val customerId: Long,
    val deliveryAddress: Address,
    val items: List<OrderItemCommand>
)

data class OrderItemCommand(
    val productInfo: ProductInfo,
    val quantity: Int
)

data class AddOrderItemCommand(
    val productInfo: ProductInfo,
    val quantity: Int
)
