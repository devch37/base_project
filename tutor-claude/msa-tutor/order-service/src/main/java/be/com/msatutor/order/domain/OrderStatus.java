package be.com.msatutor.order.domain;

public enum OrderStatus {
    CREATED,
    PAYMENT_PENDING,
    PAID,
    PAYMENT_FAILED,
    INVENTORY_RESERVED,
    CANCELLED
}
