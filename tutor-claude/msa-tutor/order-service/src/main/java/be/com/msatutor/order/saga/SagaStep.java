package be.com.msatutor.order.saga;

public enum SagaStep {
    INVENTORY_RESERVE,
    PAYMENT_AUTHORIZE,
    INVENTORY_RELEASE
}
