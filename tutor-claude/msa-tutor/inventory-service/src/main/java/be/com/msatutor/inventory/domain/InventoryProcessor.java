package be.com.msatutor.inventory.domain;

import be.com.msatutor.common.event.EventEnvelope;
import be.com.msatutor.inventory.infra.InventoryTopicsProperties;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class InventoryProcessor {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final InventoryTopicsProperties topics;

    public InventoryProcessor(KafkaTemplate<String, Object> kafkaTemplate, InventoryTopicsProperties topics) {
        this.kafkaTemplate = kafkaTemplate;
        this.topics = topics;
    }

    public void reserve(String orderId, BigDecimal amount, String correlationId) {
        // Simulate a real inventory decision rule:
        // if total amount is above 5000, fail reservation (e.g., insufficient stock).
        if (amount.compareTo(new BigDecimal("5000")) > 0) {
            EventEnvelope event = new EventEnvelope(
                UUID.randomUUID().toString(),
                "INVENTORY_RESERVATION_FAILED",
                "Inventory",
                orderId,
                Instant.now(),
                Map.of("orderId", orderId, "status", "FAILED", "reason", "INSUFFICIENT_STOCK"),
                Map.of("correlationId", correlationId)
            );
            kafkaTemplate.send(topics.inventoryReservationFailed(), orderId, event);
            return;
        }

        // Success event is emitted to the orchestrator.
        EventEnvelope event = new EventEnvelope(
            UUID.randomUUID().toString(),
            "INVENTORY_RESERVED",
            "Inventory",
            orderId,
            Instant.now(),
            Map.of("orderId", orderId, "status", "RESERVED"),
            Map.of("correlationId", correlationId)
        );
        kafkaTemplate.send(topics.inventoryReserved(), orderId, event);
    }

    public void release(String orderId, String correlationId) {
        // Compensation success event.
        EventEnvelope event = new EventEnvelope(
            UUID.randomUUID().toString(),
            "INVENTORY_RELEASED",
            "Inventory",
            orderId,
            Instant.now(),
            Map.of("orderId", orderId, "status", "RELEASED"),
            Map.of("correlationId", correlationId)
        );
        kafkaTemplate.send(topics.inventoryReleased(), orderId, event);
    }
}
