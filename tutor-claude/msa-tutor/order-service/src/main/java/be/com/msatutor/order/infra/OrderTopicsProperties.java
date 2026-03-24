package be.com.msatutor.order.infra;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "msa.topics")
public record OrderTopicsProperties(
    String orderCreated,
    String orderCancelled,
    String orderCompleted,
    String paymentApproved,
    String paymentFailed,
    String inventoryReserved,
    String inventoryReservationFailed,
    String inventoryReleased,
    String inventoryReserveCommand,
    String inventoryReleaseCommand,
    String paymentAuthorizeCommand
) {
}
