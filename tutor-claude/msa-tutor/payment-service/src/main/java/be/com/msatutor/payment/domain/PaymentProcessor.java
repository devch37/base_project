package be.com.msatutor.payment.domain;

import be.com.msatutor.common.event.EventEnvelope;
import be.com.msatutor.payment.infra.PaymentTopicsProperties;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class PaymentProcessor {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final PaymentTopicsProperties topics;

    public PaymentProcessor(KafkaTemplate<String, Object> kafkaTemplate, PaymentTopicsProperties topics) {
        this.kafkaTemplate = kafkaTemplate;
        this.topics = topics;
    }

    public void approve(String orderId, String correlationId) {
        EventEnvelope event = new EventEnvelope(
            UUID.randomUUID().toString(),
            "PAYMENT_APPROVED",
            "Payment",
            orderId,
            Instant.now(),
            Map.of("orderId", orderId, "status", "APPROVED"),
            Map.of("correlationId", correlationId)
        );
        kafkaTemplate.send(topics.paymentApproved(), orderId, event);
    }

    public void reject(String orderId, String correlationId) {
        EventEnvelope event = new EventEnvelope(
            UUID.randomUUID().toString(),
            "PAYMENT_FAILED",
            "Payment",
            orderId,
            Instant.now(),
            Map.of("orderId", orderId, "status", "FAILED"),
            Map.of("correlationId", correlationId)
        );
        kafkaTemplate.send(topics.paymentFailed(), orderId, event);
    }
}
