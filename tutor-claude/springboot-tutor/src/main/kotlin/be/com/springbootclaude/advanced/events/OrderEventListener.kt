package be.com.springbootclaude.advanced.events

import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.core.annotation.Order
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

/**
 * Event Listeners
 *
 * ★ 이벤트를 구독하고 처리하는 리스너들 ★
 *
 * 리스너 선언 방법:
 * 1. @EventListener - 기본
 * 2. @TransactionalEventListener - 트랜잭션 연동
 * 3. @Async + @EventListener - 비동기 처리
 *
 * 실무에서는 각 리스너를 별도 서비스로 분리:
 * - EmailEventListener
 * - PointEventListener
 * - InventoryEventListener
 * - NotificationEventListener
 */
@Component
class OrderEventListener {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 주문 완료 이벤트 리스너 - 이메일 발송
     *
     * @EventListener
     * - 기본 리스너
     * - 동기적 실행
     * - 발행자와 같은 스레드에서 실행
     * - 발행자와 같은 트랜잭션
     *
     * @Order
     * - 여러 리스너의 실행 순서 지정
     * - 숫자가 작을수록 먼저 실행
     */
    @EventListener
    @Order(1)
    fun handleOrderCompletedForEmail(event: OrderCompletedEvent) {
        logger.info("📧 [이메일 서비스] 주문 확인 메일 발송")
        logger.info("   orderId: ${event.orderId}")
        logger.info("   customerId: ${event.customerId}")
        logger.info("   totalAmount: ${event.totalAmount}")

        // 실제 구현:
        // emailService.sendOrderConfirmation(event.customerId, event.orderId)

        logger.info("✅ 주문 확인 메일 발송 완료")
    }

    /**
     * 주문 완료 이벤트 리스너 - 포인트 적립
     *
     * @TransactionalEventListener
     * - 트랜잭션과 연동된 리스너
     * - phase 옵션으로 실행 시점 제어
     *
     * TransactionPhase 옵션:
     * - BEFORE_COMMIT: 커밋 전 (기본값)
     * - AFTER_COMMIT: 커밋 후 (권장!) ✅
     * - AFTER_ROLLBACK: 롤백 후
     * - AFTER_COMPLETION: 완료 후 (커밋/롤백 무관)
     *
     * 실무에서는 AFTER_COMMIT 주로 사용:
     * - 트랜잭션 성공 확정 후 처리
     * - 외부 API 호출, 이메일 발송 등
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Order(2)
    fun handleOrderCompletedForPoints(event: OrderCompletedEvent) {
        logger.info("💰 [포인트 서비스] 포인트 적립")
        logger.info("   customerId: ${event.customerId}")

        // 실제 구현:
        val points = (event.totalAmount * 0.01).toLong() // 1% 적립
        // pointService.earnPoints(event.customerId, points)

        logger.info("✅ 포인트 적립 완료: $points 포인트")
    }

    /**
     * 주문 완료 이벤트 리스너 - 재고 차감
     *
     * 동기적 처리:
     * - 재고 차감은 주문과 같은 트랜잭션에서 처리
     * - 재고 부족 시 주문 실패 (롤백)
     */
    @EventListener
    @Order(3)
    fun handleOrderCompletedForInventory(event: OrderCompletedEvent) {
        logger.info("📦 [재고 서비스] 재고 차감")
        logger.info("   orderId: ${event.orderId}")

        // 실제 구현:
        // inventoryService.decreaseStock(event.orderId)

        // 재고 부족 시 예외 발생 → 트랜잭션 롤백
        // if (!hasEnoughStock) {
        //     throw InsufficientStockException("재고 부족")
        // }

        logger.info("✅ 재고 차감 완료")
    }

    /**
     * 주문 완료 이벤트 리스너 - 알림 발송
     *
     * @Async + @EventListener
     * - 비동기 리스너
     * - 별도 스레드에서 실행
     * - 발행자와 독립적
     * - 트랜잭션 독립적
     *
     * 비동기 사용 시나리오:
     * - 느린 작업 (외부 API 호출)
     * - 실패해도 괜찮은 작업 (푸시 알림)
     * - 트랜잭션과 무관한 작업
     *
     * 주의:
     * - @EnableAsync 설정 필요
     * - 예외 처리 필수 (발행자에게 전파 안 됨)
     */
    @Async
    @EventListener
    fun handleOrderCompletedForNotification(event: OrderCompletedEvent) {
        logger.info("🔔 [알림 서비스] 푸시 알림 발송 (비동기)")
        logger.info("   Thread: ${Thread.currentThread().name}")

        try {
            // 실제 구현:
            // notificationService.sendPushNotification(
            //     event.customerId,
            //     "주문이 완료되었습니다!",
            //     "주문번호: ${event.orderId}"
            // )

            // 시뮬레이션: 외부 API 호출 (느림)
            Thread.sleep(2000)

            logger.info("✅ 푸시 알림 발송 완료")
        } catch (e: Exception) {
            // 비동기이므로 예외가 발행자에게 전파 안 됨
            logger.error("❌ 푸시 알림 발송 실패", e)
            // 재시도 로직, Dead Letter Queue 등
        }
    }

    /**
     * 결제 완료 이벤트 리스너
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handlePaymentCompleted(event: PaymentCompletedEvent) {
        logger.info("💳 [결제 서비스] 결제 완료 처리")
        logger.info("   paymentId: ${event.paymentId}")
        logger.info("   orderId: ${event.orderId}")
        logger.info("   amount: ${event.amount}")
        logger.info("   method: ${event.paymentMethod}")

        // 실제 구현:
        // receiptService.sendReceipt(event.paymentId)
        // accountingService.processSettlement(event.paymentId)

        logger.info("✅ 영수증 발송 완료")
    }

    /**
     * 배송 시작 이벤트 리스너
     */
    @Async
    @EventListener
    fun handleShipmentStarted(event: ShipmentStartedEvent) {
        logger.info("🚚 [배송 서비스] 배송 시작 알림")
        logger.info("   shipmentId: ${event.shipmentId}")
        logger.info("   trackingNumber: ${event.trackingNumber}")
        logger.info("   estimatedDelivery: ${event.estimatedDelivery}")

        // 실제 구현:
        // smsService.sendShipmentNotification(event.orderId, event.trackingNumber)
        // emailService.sendTrackingInfo(event.orderId, event.trackingNumber)

        logger.info("✅ 배송 알림 발송 완료")
    }
}

/**
 * 실무 패턴:
 *
 * 1. 이벤트 리스너 분리
 *    ❌ 나쁜 예: 모든 리스너를 한 클래스에
 *    ✅ 좋은 예: 도메인별로 리스너 분리
 *      - OrderEmailListener
 *      - OrderPointListener
 *      - OrderInventoryListener
 *
 * 2. 트랜잭션 처리
 *    - 필수 작업: @EventListener (동기, 같은 트랜잭션)
 *    - 선택 작업: @TransactionalEventListener(AFTER_COMMIT) + @Async
 *
 * 3. 예외 처리
 *    - 동기: 예외 발생 시 트랜잭션 롤백
 *    - 비동기: try-catch 필수, 재시도/DLQ 고려
 *
 * 4. 성능
 *    - 느린 작업은 @Async 사용
 *    - 많은 리스너는 비동기 권장
 *    - ThreadPoolTaskExecutor 설정
 *
 * 5. 이벤트 재발행
 *    - 리스너에서 또 다른 이벤트 발행 가능
 *    - 순환 참조 주의
 *    - 이벤트 체인 설계 시 문서화 필수
 */
