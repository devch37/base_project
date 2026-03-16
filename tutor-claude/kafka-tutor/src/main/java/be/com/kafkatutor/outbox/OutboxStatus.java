package be.com.kafkatutor.outbox;

public enum OutboxStatus {
    PENDING,
    PUBLISHED,
    FAILED
}
