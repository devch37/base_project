package be.com.springbootclaude.ddd.order.domain.event

import be.com.springbootclaude.ddd.order.domain.model.OrderStatus
import java.time.LocalDateTime

/**
 * Domain Event: OrderCancelled (주문 취소 이벤트)
 *
 * 이벤트 설계 팁:
 * - 이벤트를 받는 쪽에서 필요한 정보만 포함
 * - 너무 많은 정보는 결합도 증가
 * - 이벤트 버전 관리 고려 (스키마 변경 시)
 */
data class OrderCancelled(
    val orderId: Long,
    val customerId: Long,
    val reason: String,
    val previousStatus: OrderStatus,
    val occurredAt: LocalDateTime = LocalDateTime.now()
) {
    fun getEventType(): String = "ORDER_CANCELLED"

    fun getAggregateId(): Long = orderId
}
