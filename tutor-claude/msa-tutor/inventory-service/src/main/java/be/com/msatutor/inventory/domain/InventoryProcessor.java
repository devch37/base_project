package be.com.msatutor.inventory.domain;

import be.com.msatutor.common.event.EventEnvelope;
import be.com.msatutor.inventory.infra.InventoryTopicsProperties;
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

    public void reserve(String orderId, String correlationId) {
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
}
