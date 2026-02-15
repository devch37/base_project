package be.com.springbootclaude.ddd.order.application

import be.com.springbootclaude.ddd.order.domain.model.Money
import be.com.springbootclaude.ddd.order.domain.model.Order
import be.com.springbootclaude.ddd.order.domain.model.OrderStatus
import be.com.springbootclaude.ddd.order.domain.repository.OrderRepository
import be.com.springbootclaude.ddd.order.domain.service.OrderPriceCalculator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Application Service: OrderQueryService
 *
 * CQRS의 Query Side:
 * - 읽기 전용 (조회만)
 * - 도메인 모델을 DTO로 변환
 * - 성능 최적화에 유리 (필요한 데이터만 조회)
 *
 * @Transactional(readOnly = true):
 * - 읽기 전용 트랜잭션
 * - 성능 최적화 (Dirty Checking 안 함)
 */
@Service
@Transactional(readOnly = true)
class OrderQueryService(
    private val orderRepository: OrderRepository,
    private val orderPriceCalculator: OrderPriceCalculator
) {

    /**
     * 조회: 주문 상세
     */
    fun getOrderDetail(orderId: Long): OrderDetailDto {
        val order = orderRepository.findById(orderId)
            ?: throw IllegalArgumentException("주문을 찾을 수 없습니다: $orderId")

        return OrderDetailDto.from(order, orderPriceCalculator)
    }

    /**
     * 조회: 고객의 주문 목록
     */
    fun getCustomerOrders(customerId: Long): List<OrderSummaryDto> {
        val orders = orderRepository.findByCustomerId(customerId)
        return orders.map { OrderSummaryDto.from(it) }
    }

    /**
     * 조회: 특정 상태의 주문 목록
     */
    fun getOrdersByStatus(status: OrderStatus): List<OrderSummaryDto> {
        val orders = orderRepository.findByStatus(status)
        return orders.map { OrderSummaryDto.from(it) }
    }

    /**
     * 조회: 기간별 주문 목록
     */
    fun getOrdersByPeriod(
        startDate: LocalDateTime,
        endDate: LocalDateTime
    ): List<OrderSummaryDto> {
        val orders = orderRepository.findByOrderedAtBetween(startDate, endDate)
        return orders.map { OrderSummaryDto.from(it) }
    }
}

/**
 * DTO: 주문 상세 정보
 * - Presentation Layer에 반환할 데이터
 * - 도메인 모델과 API 응답 분리
 */
data class OrderDetailDto(
    val orderId: Long,
    val customerId: Long,
    val status: OrderStatus,
    val deliveryAddress: String,
    val items: List<OrderItemDto>,
    val itemsTotal: Money,
    val deliveryFee: Money,
    val discount: Money,
    val finalAmount: Money,
    val earnedPoints: Int,
    val orderedAt: LocalDateTime
) {
    companion object {
        fun from(order: Order, priceCalculator: OrderPriceCalculator): OrderDetailDto {
            return OrderDetailDto(
                orderId = order.id!!,
                customerId = order.customerId,
                status = order.status,
                deliveryAddress = order.deliveryAddress.getFullAddress(),
                items = order.orderItems.map { OrderItemDto.from(it) },
                itemsTotal = order.calculateTotalAmount(),
                deliveryFee = priceCalculator.calculateDeliveryFee(order),
                discount = Money.ZERO, // 간단히 하기 위해 0으로
                finalAmount = priceCalculator.calculateFinalAmount(order),
                earnedPoints = priceCalculator.calculateEarnedPoints(order),
                orderedAt = order.orderedAt
            )
        }
    }
}

data class OrderItemDto(
    val productId: Long,
    val productName: String,
    val price: Money,
    val quantity: Int,
    val totalPrice: Money
) {
    companion object {
        fun from(orderItem: be.com.springbootclaude.ddd.order.domain.model.OrderItem): OrderItemDto {
            return OrderItemDto(
                productId = orderItem.productInfo.productId,
                productName = orderItem.productInfo.productName,
                price = orderItem.productInfo.price,
                quantity = orderItem.quantity,
                totalPrice = orderItem.calculateTotalPrice()
            )
        }
    }
}

/**
 * DTO: 주문 요약 정보
 * - 목록 조회용 (상세 정보보다 가벼움)
 */
data class OrderSummaryDto(
    val orderId: Long,
    val customerId: Long,
    val status: OrderStatus,
    val itemCount: Int,
    val totalAmount: Money,
    val orderedAt: LocalDateTime
) {
    companion object {
        fun from(order: Order): OrderSummaryDto {
            return OrderSummaryDto(
                orderId = order.id!!,
                customerId = order.customerId,
                status = order.status,
                itemCount = order.orderItems.size,
                totalAmount = order.calculateTotalAmount(),
                orderedAt = order.orderedAt
            )
        }
    }
}
