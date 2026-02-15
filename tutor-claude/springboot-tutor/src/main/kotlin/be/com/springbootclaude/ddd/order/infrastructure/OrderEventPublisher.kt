package be.com.springbootclaude.ddd.order.infrastructure

import be.com.springbootclaude.ddd.order.domain.event.OrderCancelled
import be.com.springbootclaude.ddd.order.domain.event.OrderPlaced
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Component

/**
 * Infrastructure: Event Publisher
 *
 * Domain Event를 실제로 발행하는 인프라 컴포넌트
 * - Spring의 ApplicationEventPublisher 활용
 * - 실제로는 Kafka, RabbitMQ 등 메시지 브로커 사용 가능
 *
 * 왜 별도 클래스로?
 * - Domain Layer는 이벤트 발행 방법을 모름
 * - Infrastructure Layer가 기술 세부사항 담당
 */
@Component
class OrderEventPublisher(
    private val applicationEventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 도메인 이벤트 발행
     */
    fun publish(events: List<Any>) {
        events.forEach { event ->
            when (event) {
                is OrderPlaced -> {
                    logger.info("🎉 주문 완료 이벤트 발행: orderId=${event.orderId}, amount=${event.totalAmount}")
                    applicationEventPublisher.publishEvent(event)
                }
                is OrderCancelled -> {
                    logger.info("❌ 주문 취소 이벤트 발행: orderId=${event.orderId}, reason=${event.reason}")
                    applicationEventPublisher.publishEvent(event)
                }
                else -> {
                    logger.warn("알 수 없는 이벤트 타입: ${event::class.simpleName}")
                }
            }
        }
    }
}
