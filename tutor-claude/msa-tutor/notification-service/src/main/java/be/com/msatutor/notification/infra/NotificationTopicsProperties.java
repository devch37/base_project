package be.com.msatutor.notification.infra;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "msa.topics")
public record NotificationTopicsProperties(
    String paymentApproved,
    String paymentFailed,
    String inventoryReserved,
    String orderCancelled
) {
}
