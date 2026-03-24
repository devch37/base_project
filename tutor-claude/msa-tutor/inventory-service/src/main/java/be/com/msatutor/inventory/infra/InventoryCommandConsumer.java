package be.com.msatutor.inventory.infra;

import be.com.msatutor.inventory.domain.InventoryProcessor;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class InventoryCommandConsumer {

    private final InventoryProcessor inventoryProcessor;

    public InventoryCommandConsumer(InventoryProcessor inventoryProcessor) {
        this.inventoryProcessor = inventoryProcessor;
    }

    @KafkaListener(topics = "#{inventoryTopicsProperties.inventoryReserveCommand()}", groupId = "inventory-service")
    public void onInventoryReserveCommand(Map<String, Object> event) {
        Object payload = event.get("payload");
        if (payload instanceof Map<?, ?> payloadMap) {
            String orderId = String.valueOf(payloadMap.get("orderId"));
            BigDecimal amount = new BigDecimal(String.valueOf(payloadMap.get("amount")));

            String correlationId = "";
            Object metadata = event.get("metadata");
            if (metadata instanceof Map<?, ?> metadataMap) {
                correlationId = String.valueOf(metadataMap.getOrDefault("correlationId", null));
            }

            // Reserve is a local transaction from the inventory service perspective.
            // The result is communicated asynchronously to the orchestrator.
            inventoryProcessor.reserve(orderId, amount, correlationId);
            return;
        }
        throw new IllegalArgumentException("Invalid inventory reserve command payload");
    }

    @KafkaListener(topics = "#{inventoryTopicsProperties.inventoryReleaseCommand()}", groupId = "inventory-service")
    public void onInventoryReleaseCommand(Map<String, Object> event) {
        Object payload = event.get("payload");
        if (payload instanceof Map<?, ?> payloadMap) {
            String orderId = String.valueOf(payloadMap.get("orderId"));

            String correlationId = "";
            Object metadata = event.get("metadata");
            if (metadata instanceof Map<?, ?> metadataMap) {
                correlationId = String.valueOf(metadataMap.getOrDefault("correlationId", null));
            }

            // Compensation command: release the reservation.
            inventoryProcessor.release(orderId, correlationId);
            return;
        }
        throw new IllegalArgumentException("Invalid inventory release command payload");
    }
}
