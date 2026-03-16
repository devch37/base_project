package be.com.kafkatutor.domain;

import java.time.Instant;
import java.util.Map;

public record OrderEvent(
    String eventId,
    Long orderId,
    String type,
    Instant occurredAt,
    Map<String, Object> payload
) {
}
