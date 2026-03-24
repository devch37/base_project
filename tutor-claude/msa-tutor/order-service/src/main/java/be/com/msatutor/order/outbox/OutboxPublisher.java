package be.com.msatutor.order.outbox;

import be.com.msatutor.common.event.EventEnvelope;
import be.com.msatutor.order.infra.OrderTopicsProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OutboxPublisher {

    private final OutboxRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final OrderTopicsProperties topics;
    private final ObjectMapper objectMapper;

    public OutboxPublisher(
        OutboxRepository repository,
        KafkaTemplate<String, Object> kafkaTemplate,
        OrderTopicsProperties topics,
        ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
        this.topics = topics;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelayString = "${outbox.poll-interval-ms:2000}")
    @Transactional
    public void publish() {
        List<OutboxEvent> pending = repository.findTop200ByStatusOrderByCreatedAt(OutboxStatus.PENDING);
        if (pending.isEmpty()) {
            return;
        }

        for (OutboxEvent event : pending) {
            try {
                EventEnvelope envelope = new EventEnvelope(
                    event.getId(),
                    event.getEventType(),
                    event.getAggregateType(),
                    event.getAggregateId(),
                    Instant.now(),
                    deserializeMap(event.getPayload()),
                    deserializeStringMap(event.getMetadata())
                );

                // Routing by event type keeps topics explicit and evolvable.
                String topic = resolveTopic(event.getEventType());
                kafkaTemplate.send(topic, event.getAggregateId(), envelope);
                event.setStatus(OutboxStatus.PUBLISHED);
                event.setPublishedAt(Instant.now());
            } catch (Exception ex) {
                // In production, persist error details and alert on repeated failures.
                event.setStatus(OutboxStatus.FAILED);
                event.setRetryCount(event.getRetryCount() + 1);
            }
        }
    }

    private Map<String, Object> deserializeMap(String payload) throws Exception {
        return objectMapper.readValue(payload, new TypeReference<>() {});
    }

    private Map<String, String> deserializeStringMap(String payload) throws Exception {
        return objectMapper.readValue(payload, new TypeReference<>() {});
    }

    private String resolveTopic(String eventType) {
        return switch (eventType) {
            case "ORDER_CREATED" -> topics.orderCreated();
            case "ORDER_CANCELLED" -> topics.orderCancelled();
            case "ORDER_COMPLETED" -> topics.orderCompleted();
            case "INVENTORY_RESERVE_COMMAND" -> topics.inventoryReserveCommand();
            case "INVENTORY_RELEASE_COMMAND" -> topics.inventoryReleaseCommand();
            case "PAYMENT_AUTHORIZE_COMMAND" -> topics.paymentAuthorizeCommand();
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }
}
