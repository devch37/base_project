package be.com.kafkatutor.outbox;

import be.com.kafkatutor.config.TopicProperties;
import be.com.kafkatutor.domain.OrderEvent;
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

    private final OutboxEventRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final TopicProperties topicProperties;
    private final ObjectMapper objectMapper;

    public OutboxPublisher(
        OutboxEventRepository repository,
        KafkaTemplate<String, Object> kafkaTemplate,
        TopicProperties topicProperties,
        ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
        this.topicProperties = topicProperties;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelayString = "${outbox.poll-interval-ms:5000}")
    @Transactional
    public void publishPending() {
        List<OutboxEvent> pending = repository.findTop100ByStatusOrderByCreatedAt(OutboxStatus.PENDING);
        if (pending.isEmpty()) {
            return;
        }

        for (OutboxEvent event : pending) {
            try {
                OrderEvent orderEvent = new OrderEvent(
                    event.getId(),
                    Long.valueOf(event.getAggregateId()),
                    event.getEventType(),
                    Instant.now(),
                    deserializePayload(event.getPayload())
                );

                // Publish inside Kafka transaction to keep producer guarantees.
                kafkaTemplate.executeInTransaction(ops -> {
                    ops.send(topicProperties.orderEvents(), event.getAggregateId(), orderEvent);
                    return true;
                });

                event.setStatus(OutboxStatus.PUBLISHED);
                event.setPublishedAt(Instant.now());
            } catch (Exception ex) {
                event.setStatus(OutboxStatus.FAILED);
                event.setRetryCount(event.getRetryCount() + 1);
            }
        }
    }

    private Map<String, Object> deserializePayload(String payload) {
        try {
            return objectMapper.readValue(payload, new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to deserialize payload", ex);
        }
    }
}
