package be.com.msatutor.order.infra;

import java.util.Map;

public final class EventExtractor {

    private EventExtractor() {
    }

    public static String eventId(Map<String, Object> event) {
        Object eventId = event.get("eventId");
        return eventId == null ? "" : String.valueOf(eventId);
    }

    public static Long orderId(Map<String, Object> event) {
        Object payload = event.get("payload");
        if (payload instanceof Map<?, ?> payloadMap) {
            Object orderId = payloadMap.get("orderId");
            if (orderId != null) {
                return Long.valueOf(String.valueOf(orderId));
            }
        }
        throw new IllegalArgumentException("Missing orderId in event payload");
    }

    public static String correlationId(Map<String, Object> event) {
        Object metadata = event.get("metadata");
        if (metadata instanceof Map<?, ?> metadataMap) {
            Object correlationId = metadataMap.get("correlationId");
            return correlationId == null ? "" : String.valueOf(correlationId);
        }
        return "";
    }

    public static String errorReason(Map<String, Object> event, String defaultReason) {
        Object payload = event.get("payload");
        if (payload instanceof Map<?, ?> payloadMap) {
            Object reason = payloadMap.get("reason");
            if (reason != null) {
                return String.valueOf(reason);
            }
        }
        return defaultReason;
    }
}
