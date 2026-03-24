package be.com.msatutor.notification.infra;

import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationConsumer {

    @KafkaListener(topics = "#{notificationTopicsProperties.paymentApproved()}", groupId = "notification-service")
    public void onPaymentApproved(Map<String, Object> event) {
        System.out.printf("[Notification] Payment approved: %s%n", event);
    }

    @KafkaListener(topics = "#{notificationTopicsProperties.paymentFailed()}", groupId = "notification-service")
    public void onPaymentFailed(Map<String, Object> event) {
        System.out.printf("[Notification] Payment failed: %s%n", event);
    }

    @KafkaListener(topics = "#{notificationTopicsProperties.inventoryReserved()}", groupId = "notification-service")
    public void onInventoryReserved(Map<String, Object> event) {
        System.out.printf("[Notification] Inventory reserved: %s%n", event);
    }

    @KafkaListener(topics = "#{notificationTopicsProperties.inventoryReservationFailed()}", groupId = "notification-service")
    public void onInventoryReservationFailed(Map<String, Object> event) {
        System.out.printf("[Notification] Inventory reservation failed: %s%n", event);
    }

    @KafkaListener(topics = "#{notificationTopicsProperties.inventoryReleased()}", groupId = "notification-service")
    public void onInventoryReleased(Map<String, Object> event) {
        System.out.printf("[Notification] Inventory released: %s%n", event);
    }

    @KafkaListener(topics = "#{notificationTopicsProperties.orderCancelled()}", groupId = "notification-service")
    public void onOrderCancelled(Map<String, Object> event) {
        System.out.printf("[Notification] Order cancelled: %s%n", event);
    }

    @KafkaListener(topics = "#{notificationTopicsProperties.orderCompleted()}", groupId = "notification-service")
    public void onOrderCompleted(Map<String, Object> event) {
        System.out.printf("[Notification] Order completed: %s%n", event);
    }
}
