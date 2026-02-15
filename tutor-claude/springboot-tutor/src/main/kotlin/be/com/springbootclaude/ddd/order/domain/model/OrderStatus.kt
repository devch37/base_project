package be.com.springbootclaude.ddd.order.domain.model

/**
 * Domain Enum: OrderStatus
 *
 * DDD에서 Enum은:
 * - 도메인의 상태를 명시적으로 표현
 * - 비즈니스 로직을 포함할 수 있음 (메서드)
 * - 타입 안전성 제공
 */
enum class OrderStatus(val description: String) {
    PENDING("주문 대기"),
    CONFIRMED("주문 확인"),
    PREPARING("상품 준비 중"),
    SHIPPED("배송 중"),
    DELIVERED("배송 완료"),
    CANCELLED("주문 취소");

    /**
     * 도메인 로직: 취소 가능한 상태인지 확인
     * 비즈니스 규칙을 코드로 명확히 표현
     */
    fun canBeCancelled(): Boolean {
        return this in listOf(PENDING, CONFIRMED)
    }

    /**
     * 도메인 로직: 특정 상태로 변경 가능한지 확인
     */
    fun canTransitionTo(newStatus: OrderStatus): Boolean {
        return when (this) {
            PENDING -> newStatus in listOf(CONFIRMED, CANCELLED)
            CONFIRMED -> newStatus in listOf(PREPARING, CANCELLED)
            PREPARING -> newStatus in listOf(SHIPPED, CANCELLED)
            SHIPPED -> newStatus == DELIVERED
            DELIVERED -> false
            CANCELLED -> false
        }
    }
}
