package be.com.msatutor.common.event;

import java.time.Instant;
import java.util.Map;

public record EventEnvelope(
    String eventId,
    String eventType,
    String aggregateType,
    String aggregateId,
    Instant occurredAt,
    Map<String, Object> payload,
    Map<String, String> metadata
) {
}
