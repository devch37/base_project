package be.com.springbootclaude.advanced.events

import org.springframework.context.ApplicationEvent
import java.time.LocalDateTime

/**
 * Custom Application Events
 *
 * ★ Spring의 이벤트 기반 아키텍처 ★
 *
 * 이벤트 기반 설계의 장점:
 * 1. 느슨한 결합 (Loose Coupling)
 *    - 발행자와 구독자가 서로 몰라도 됨
 *    - 새로운 리스너 추가가 쉬움
 *
 * 2. 단일 책임 원칙 (SRP)
 *    - 각 리스너가 하나의 책임만
 *    - 코드 유지보수 쉬움
 *
 * 3. 확장성
 *    - 새 기능 추가 시 기존 코드 수정 불필요
 *    - 리스너만 추가하면 됨
 *
 * 실무 활용:
 * - 주문 완료 → 이메일 발송, 포인트 적립, 재고 차감
 * - 회원가입 → 웰컴 이메일, 쿠폰 발급, 통계 업데이트
 * - 결제 완료 → 영수증 발송, 정산, 알림
 */

/**
 * 주문 생성 이벤트
 *
 * ApplicationEvent 상속 (레거시 방식)
 * - Spring 4.2 이전 방식
 * - ApplicationEvent를 상속해야 함
 */
class OrderCreatedEvent(
    source: Any,
    val orderId: Long,
    val customerId: Long,
    val totalAmount: Long
) : ApplicationEvent(source) {
    val createdAt: LocalDateTime = LocalDateTime.now()
}

/**
 * 주문 완료 이벤트
 *
 * POJO 방식 (권장)
 * - Spring 4.2+ 부터 지원
 * - 일반 클래스도 이벤트로 사용 가능
 * - ApplicationEvent 상속 불필요
 */
data class OrderCompletedEvent(
    val orderId: Long,
    val customerId: Long,
    val totalAmount: Long,
    val completedAt: LocalDateTime = LocalDateTime.now()
)

/**
 * 결제 완료 이벤트
 */
data class PaymentCompletedEvent(
    val paymentId: Long,
    val orderId: Long,
    val amount: Long,
    val paymentMethod: String,
    val paidAt: LocalDateTime = LocalDateTime.now()
)

/**
 * 배송 시작 이벤트
 */
data class ShipmentStartedEvent(
    val shipmentId: Long,
    val orderId: Long,
    val trackingNumber: String,
    val estimatedDelivery: LocalDateTime,
    val shippedAt: LocalDateTime = LocalDateTime.now()
)

/**
 * 이벤트 설계 팁:
 *
 * 1. 이벤트 네이밍
 *    - 과거형으로 명명 (OrderCreated, PaymentCompleted)
 *    - "~Event" suffix 사용
 *
 * 2. 이벤트 데이터
 *    - 필요한 최소한의 정보만 포함
 *    - 너무 많은 정보는 결합도 증가
 *    - ID만 전달하고 리스너에서 조회하는 것도 방법
 *
 * 3. 불변 객체
 *    - data class (val만 사용)
 *    - 이벤트는 변경되면 안 됨
 *
 * 4. 타임스탬프
 *    - 이벤트 발생 시간 포함
 *    - 디버깅, 추적에 유용
 */
