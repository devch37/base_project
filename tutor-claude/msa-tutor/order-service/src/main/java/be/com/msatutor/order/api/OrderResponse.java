package be.com.msatutor.order.api;

import be.com.msatutor.order.domain.Order;
import be.com.msatutor.order.domain.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record OrderResponse(
    Long id,
    String customerId,
    BigDecimal amount,
    OrderStatus status,
    Instant createdAt
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
            order.getId(),
            order.getCustomerId(),
            order.getAmount(),
            order.getStatus(),
            order.getCreatedAt()
        );
    }
}
