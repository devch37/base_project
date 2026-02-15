package be.com.springbootclaude.advanced.events

import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service

/**
 * Event Publisher Service
 *
 * 이벤트 발행 방법:
 * 1. ApplicationEventPublisher 주입
 * 2. publishEvent() 호출
 *
 * 이벤트 발행은:
 * - 동기적 (기본)
 * - 같은 트랜잭션 내에서 실행
 * - 리스너 예외 시 발행자에게 전파
 */
@Service
class OrderEventPublisher(
    private val eventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 주문 생성 이벤트 발행
     *
     * 실무 시나리오:
     * 1. 주문 생성 성공
     * 2. 이벤트 발행
     * 3. 리스너들이 처리
     *    - 이메일 서비스: 주문 확인 메일 발송
     *    - 재고 서비스: 재고 차감
     *    - 포인트 서비스: 포인트 적립
     *    - 알림 서비스: 푸시 알림
     */
    fun publishOrderCreated(orderId: Long, customerId: Long, totalAmount: Long) {
        logger.info("📢 주문 생성 이벤트 발행: orderId=$orderId")

        val event = OrderCompletedEvent(
            orderId = orderId,
            customerId = customerId,
            totalAmount = totalAmount
        )

        eventPublisher.publishEvent(event)

        logger.info("✅ 이벤트 발행 완료")
    }

    /**
     * 결제 완료 이벤트 발행
     */
    fun publishPaymentCompleted(
        paymentId: Long,
        orderId: Long,
        amount: Long,
        paymentMethod: String
    ) {
        logger.info("📢 결제 완료 이벤트 발행: paymentId=$paymentId")

        val event = PaymentCompletedEvent(
            paymentId = paymentId,
            orderId = orderId,
            amount = amount,
            paymentMethod = paymentMethod
        )

        eventPublisher.publishEvent(event)
    }

    /**
     * 배송 시작 이벤트 발행
     */
    fun publishShipmentStarted(
        shipmentId: Long,
        orderId: Long,
        trackingNumber: String,
        estimatedDelivery: java.time.LocalDateTime
    ) {
        logger.info("📢 배송 시작 이벤트 발행: shipmentId=$shipmentId")

        val event = ShipmentStartedEvent(
            shipmentId = shipmentId,
            orderId = orderId,
            trackingNumber = trackingNumber,
            estimatedDelivery = estimatedDelivery
        )

        eventPublisher.publishEvent(event)
    }
}

/**
 * 실무 팁:
 *
 * 1. 트랜잭션과 이벤트
 *    - 기본: 이벤트는 동기적으로 실행
 *    - 리스너 예외 시 트랜잭션 롤백
 *    - @TransactionalEventListener 사용 권장
 *
 * 2. 이벤트 발행 시점
 *    - 트랜잭션 커밋 전: @EventListener
 *    - 트랜잭션 커밋 후: @TransactionalEventListener(phase = AFTER_COMMIT)
 *
 * 3. 비동기 이벤트
 *    - @Async + @EventListener
 *    - 별도 스레드에서 실행
 *    - 트랜잭션 독립적
 */
