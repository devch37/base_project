package be.com.msatutor.inventory.infra;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "msa.topics")
public record InventoryTopicsProperties(
    String orderCreated,
    String orderCancelled,
    String inventoryReserved,
    String inventoryReservationFailed,
    String inventoryReleased,
    String inventoryReserveCommand,
    String inventoryReleaseCommand
) {
}
