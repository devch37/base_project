package be.com.msatutor.order.saga;

public enum SagaStatus {
    IN_PROGRESS,
    COMPENSATING,
    COMPLETED,
    COMPENSATED,
    FAILED,
    TIMED_OUT
}
