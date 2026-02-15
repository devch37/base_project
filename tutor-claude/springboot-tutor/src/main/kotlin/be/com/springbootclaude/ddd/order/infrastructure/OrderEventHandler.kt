package be.com.springbootclaude.ddd.order.infrastructure

import be.com.springbootclaude.ddd.order.domain.event.OrderCancelled
import be.com.springbootclaude.ddd.order.domain.event.OrderPlaced
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component

/**
 * Infrastructure: Event Handler
 *
 * 도메인 이벤트를 구독하고 처리하는 핸들러
 * - 비동기 처리 (@Async)
 * - 이벤트에 반응하는 사이드 이펙트 처리
 *
 * 예시:
 * - 주문 완료 → 이메일 발송, 포인트 적립, 재고 차감
 * - 주문 취소 → 환불 처리, 알림 발송
 *
 * DDD의 장점:
 * - 새로운 기능(이벤트 핸들러) 추가 시 기존 코드 수정 불필요
 * - 관심사 분리 (Order는 이메일 발송을 몰라도 됨)
 */
@Component
class OrderEventHandler {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 주문 완료 이벤트 처리
     */
    @Async
    @EventListener
    fun handleOrderPlaced(event: OrderPlaced) {
        logger.info("📧 주문 완료 알림 발송: customerId=${event.customerId}, orderId=${event.orderId}")

        // 실제로는 이메일 서비스 호출
        sendOrderConfirmationEmail(event)

        // 포인트 적립
        earnPoints(event)

        // 재고 차감
        decreaseInventory(event)
    }

    /**
     * 주문 취소 이벤트 처리
     */
    @Async
    @EventListener
    fun handleOrderCancelled(event: OrderCancelled) {
        logger.info("💸 주문 취소 처리: customerId=${event.customerId}, orderId=${event.orderId}")

        // 환불 처리
        processRefund(event)

        // 재고 복원
        restoreInventory(event)

        // 취소 알림
        sendCancellationNotification(event)
    }

    private fun sendOrderConfirmationEmail(event: OrderPlaced) {
        // 이메일 발송 로직
        logger.info("  → 주문 확인 이메일 발송 완료")
    }

    private fun earnPoints(event: OrderPlaced) {
        // 포인트 적립 로직
        logger.info("  → 포인트 적립 완료")
    }

    private fun decreaseInventory(event: OrderPlaced) {
        // 재고 차감 로직
        logger.info("  → 재고 차감 완료")
    }

    private fun processRefund(event: OrderCancelled) {
        // 환불 로직
        logger.info("  → 환불 처리 완료")
    }

    private fun restoreInventory(event: OrderCancelled) {
        // 재고 복원 로직
        logger.info("  → 재고 복원 완료")
    }

    private fun sendCancellationNotification(event: OrderCancelled) {
        // 취소 알림 로직
        logger.info("  → 취소 알림 발송 완료")
    }
}
