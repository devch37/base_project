package be.com.springbootclaude.ddd.order.domain.event

import be.com.springbootclaude.ddd.order.domain.model.Money
import java.time.LocalDateTime

/**
 * Domain Event: OrderPlaced (주문 완료 이벤트)
 *
 * Domain Event란?
 * - 도메인 내에서 발생한 중요한 사건
 * - 과거형으로 명명 (OrderPlaced, OrderCancelled)
 * - 불변 객체 (val만 사용)
 * - 다른 Bounded Context에 전파될 수 있음
 *
 * 왜 Domain Event가 필요한가?
 * 1. 시스템 간 결합도 감소
 *    - Order가 직접 결제/알림 서비스를 호출하지 않음
 *    - 이벤트를 발행하고, 관심있는 쪽에서 구독
 *
 * 2. 비즈니스 흐름 명확화
 *    - "주문이 완료되었다"라는 비즈니스 사실을 명시
 *    - 이벤트 스토밍(Event Storming)과 직접 연결
 *
 * 3. 확장성
 *    - 나중에 포인트 적립, 재고 차감 등 추가 기능을
 *    - 기존 코드 수정 없이 이벤트 리스너로 추가 가능
 */
data class OrderPlaced(
    val orderId: Long,
    val customerId: Long,
    val totalAmount: Money,
    val itemCount: Int,
    val occurredAt: LocalDateTime = LocalDateTime.now()
) {
    /**
     * 이벤트 메타데이터
     * 이벤트 추적, 디버깅에 유용
     */
    fun getEventType(): String = "ORDER_PLACED"

    fun getAggregateId(): Long = orderId
}
