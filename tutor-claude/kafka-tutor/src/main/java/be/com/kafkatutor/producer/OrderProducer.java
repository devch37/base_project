package be.com.kafkatutor.producer;

import be.com.kafkatutor.config.TopicProperties;
import be.com.kafkatutor.domain.Order;
import be.com.kafkatutor.domain.OrderEvent;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final TopicProperties topicProperties;

    public OrderProducer(KafkaTemplate<String, Object> kafkaTemplate, TopicProperties topicProperties) {
        this.kafkaTemplate = kafkaTemplate;
        this.topicProperties = topicProperties;
    }

    public void sendOrderCreated(Order order) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", order.getId());
        payload.put("customerId", order.getCustomerId());
        payload.put("amount", order.getAmount());
        payload.put("status", order.getStatus().name());

        kafkaTemplate.send(topicProperties.orderCreated(), order.getId().toString(), payload);
    }

    public void sendPaymentRequested(Order order) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", order.getId());
        payload.put("amount", order.getAmount());
        payload.put("requestedAt", Instant.now());

        kafkaTemplate.send(topicProperties.paymentRequested(), order.getId().toString(), payload);
    }

    public void sendOrderEventTransactional(Order order, String type) {
        OrderEvent event = new OrderEvent(
            UUID.randomUUID().toString(),
            order.getId(),
            type,
            Instant.now(),
            Map.of(
                "customerId", order.getCustomerId(),
                "amount", order.getAmount(),
                "status", order.getStatus().name()
            )
        );

        // Transactional send keeps ordering and avoids partial writes on retries.
        kafkaTemplate.executeInTransaction(ops -> {
            ops.send(topicProperties.orderEvents(), order.getId().toString(), event);
            return true;
        });
    }

    public void sendFailingEvent(Order order) {
        OrderEvent event = new OrderEvent(
            UUID.randomUUID().toString(),
            order.getId(),
            "FORCE_FAIL",
            Instant.now(),
            Map.of(
                "orderId", order.getId(),
                "fail", true
            )
        );

        kafkaTemplate.send(topicProperties.orderEvents(), order.getId().toString(), event);
    }
}
