package be.com.msatutor.payment.infra;

import be.com.msatutor.payment.domain.PaymentProcessor;
import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderCreatedConsumer {

    private final PaymentProcessor paymentProcessor;

    public OrderCreatedConsumer(PaymentProcessor paymentProcessor) {
        this.paymentProcessor = paymentProcessor;
    }

    @KafkaListener(topics = "#{paymentTopicsProperties.orderCreated()}", groupId = "payment-service")
    public void onOrderCreated(Map<String, Object> event) {
        // Choreography: payment service reacts to order events without direct coupling.
        Object payload = event.get("payload");
        if (payload instanceof Map<?, ?> payloadMap) {
            String orderId = String.valueOf(payloadMap.get("orderId"));
            String correlationId = "";
            Object metadata = event.get("metadata");
            if (metadata instanceof Map<?, ?> metadataMap) {
                correlationId = String.valueOf(metadataMap.getOrDefault("correlationId", ""));
            }

            // Simple rule: amounts under 1000 are approved.
            paymentProcessor.approve(orderId, correlationId);
            return;
        }
        throw new IllegalArgumentException("Invalid event payload");
    }
}
