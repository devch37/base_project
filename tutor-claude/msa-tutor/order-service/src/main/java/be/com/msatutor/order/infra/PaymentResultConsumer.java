package be.com.msatutor.order.infra;

import be.com.msatutor.order.domain.OrderApplicationService;
import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentResultConsumer {

    private final OrderApplicationService orderApplicationService;

    public PaymentResultConsumer(OrderApplicationService orderApplicationService) {
        this.orderApplicationService = orderApplicationService;
    }

    @KafkaListener(topics = "#{orderTopicsProperties.paymentApproved()}", groupId = "order-service")
    public void onPaymentApproved(Map<String, Object> event) {
        Long orderId = extractOrderId(event);
        orderApplicationService.markPaymentApproved(orderId);
    }

    @KafkaListener(topics = "#{orderTopicsProperties.paymentFailed()}", groupId = "order-service")
    public void onPaymentFailed(Map<String, Object> event) {
        Long orderId = extractOrderId(event);
        orderApplicationService.markPaymentFailed(orderId);
    }

    private Long extractOrderId(Map<String, Object> event) {
        Object payload = event.get("payload");
        if (payload instanceof Map<?, ?> payloadMap) {
            Object orderId = payloadMap.get("orderId");
            return Long.valueOf(String.valueOf(orderId));
        }
        throw new IllegalArgumentException("Missing orderId in event payload");
    }
}
