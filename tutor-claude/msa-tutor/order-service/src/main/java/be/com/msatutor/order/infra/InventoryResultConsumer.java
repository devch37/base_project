package be.com.msatutor.order.infra;

import be.com.msatutor.order.saga.SagaOrchestrator;
import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class InventoryResultConsumer {

    private final SagaOrchestrator sagaOrchestrator;

    public InventoryResultConsumer(SagaOrchestrator sagaOrchestrator) {
        this.sagaOrchestrator = sagaOrchestrator;
    }

    @KafkaListener(topics = "#{orderTopicsProperties.inventoryReserved()}", groupId = "order-service")
    public void onInventoryReserved(Map<String, Object> event) {
        sagaOrchestrator.onInventoryReserved(
            EventExtractor.eventId(event),
            EventExtractor.orderId(event),
            EventExtractor.correlationId(event)
        );
    }

    @KafkaListener(topics = "#{orderTopicsProperties.inventoryReservationFailed()}", groupId = "order-service")
    public void onInventoryReservationFailed(Map<String, Object> event) {
        sagaOrchestrator.onInventoryReservationFailed(
            EventExtractor.eventId(event),
            EventExtractor.orderId(event),
            EventExtractor.correlationId(event),
            EventExtractor.errorReason(event, "INVENTORY_RESERVATION_FAILED")
        );
    }

    @KafkaListener(topics = "#{orderTopicsProperties.inventoryReleased()}", groupId = "order-service")
    public void onInventoryReleased(Map<String, Object> event) {
        sagaOrchestrator.onInventoryReleased(
            EventExtractor.eventId(event),
            EventExtractor.orderId(event),
            EventExtractor.correlationId(event)
        );
    }
}
