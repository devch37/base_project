package be.com.msatutor.inventory.infra;

import be.com.msatutor.inventory.domain.InventoryProcessor;
import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderCreatedConsumer {

    private final InventoryProcessor inventoryProcessor;

    public OrderCreatedConsumer(InventoryProcessor inventoryProcessor) {
        this.inventoryProcessor = inventoryProcessor;
    }

    @KafkaListener(topics = "#{inventoryTopicsProperties.orderCreated()}", groupId = "inventory-service")
    public void onOrderCreated(Map<String, Object> event) {
        Object payload = event.get("payload");
        if (payload instanceof Map<?, ?> payloadMap) {
            String orderId = String.valueOf(payloadMap.get("orderId"));
            String correlationId = "";
            Object metadata = event.get("metadata");
            if (metadata instanceof Map<?, ?> metadataMap) {
                correlationId = String.valueOf(metadataMap.getOrDefault("correlationId", ""));
            }
            inventoryProcessor.reserve(orderId, correlationId);
            return;
        }
        throw new IllegalArgumentException("Invalid event payload");
    }
}
