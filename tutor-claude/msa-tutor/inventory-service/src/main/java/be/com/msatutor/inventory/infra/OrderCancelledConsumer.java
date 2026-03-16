package be.com.msatutor.inventory.infra;

import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderCancelledConsumer {

    @KafkaListener(topics = "#{inventoryTopicsProperties.orderCancelled()}", groupId = "inventory-service")
    public void onOrderCancelled(Map<String, Object> event) {
        // Compensation example: release reserved stock.
        System.out.printf("[Inventory] Release reservation due to cancellation: %s%n", event);
    }
}
