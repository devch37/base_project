package be.com.msatutor.order.saga;

import be.com.msatutor.order.domain.Order;
import be.com.msatutor.order.domain.OrderRepository;
import be.com.msatutor.order.domain.OrderStatus;
import be.com.msatutor.order.outbox.OutboxService;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SagaOrchestrator {

    // Orchestrator-style Saga:
    // - One service (order-service) owns the workflow state machine.
    // - Other services are invoked via commands and respond with events.
    // - Compensations are explicit steps in the same workflow.
    private final OrderRepository orderRepository;
    private final OrderSagaRepository sagaRepository;
    private final SagaInboxRepository inboxRepository;
    private final OutboxService outboxService;

    private final long stepTimeoutMs;
    private final int maxRetries;
    private final long baseBackoffMs;

    public SagaOrchestrator(
        OrderRepository orderRepository,
        OrderSagaRepository sagaRepository,
        SagaInboxRepository inboxRepository,
        OutboxService outboxService,
        @Value("${saga.step-timeout-ms:15000}") long stepTimeoutMs,
        @Value("${saga.max-retries:3}") int maxRetries,
        @Value("${saga.base-backoff-ms:2000}") long baseBackoffMs
    ) {
        this.orderRepository = orderRepository;
        this.sagaRepository = sagaRepository;
        this.inboxRepository = inboxRepository;
        this.outboxService = outboxService;
        this.stepTimeoutMs = stepTimeoutMs;
        this.maxRetries = maxRetries;
        this.baseBackoffMs = baseBackoffMs;
    }

    @Transactional
    public void startSaga(Order order, String correlationId) {
        // Saga record is stored in the same DB transaction as the order.
        // If the transaction commits, both the order and the saga are durable.
        OrderSaga saga = new OrderSaga();
        saga.setId(UUID.randomUUID().toString());
        saga.setOrderId(order.getId());
        saga.setStatus(SagaStatus.IN_PROGRESS);
        saga.setStep(SagaStep.INVENTORY_RESERVE);
        saga.setRetryCount(0);
        saga.setNextRetryAt(Instant.now().plusMillis(stepTimeoutMs));
        saga.setCorrelationId(correlationId == null ? "" : correlationId);
        saga.setCreatedAt(Instant.now());
        saga.setUpdatedAt(Instant.now());
        sagaRepository.save(saga);

        // Command is written to the outbox in the same transaction.
        // Outbox publisher delivers it asynchronously and safely.
        enqueueInventoryReserve(order, saga, "start");
    }

    @Transactional
    public void onInventoryReserved(String eventId, Long orderId, String correlationId) {
        if (isDuplicateEvent(eventId)) {
            return;
        }

        Optional<OrderSaga> sagaOpt = sagaRepository.findByOrderId(orderId);
        if (sagaOpt.isEmpty()) {
            return;
        }
        OrderSaga saga = sagaOpt.get();

        // Idempotent guard: only accept the event when we are in the expected step.
        if (saga.getStatus() != SagaStatus.IN_PROGRESS || saga.getStep() != SagaStep.INVENTORY_RESERVE) {
            return;
        }

        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.INVENTORY_RESERVED);

        saga.setStep(SagaStep.PAYMENT_AUTHORIZE);
        saga.setUpdatedAt(Instant.now());
        saga.setNextRetryAt(Instant.now().plusMillis(stepTimeoutMs));

        enqueuePaymentAuthorize(order, saga, correlationId, "inventory_reserved");
    }

    @Transactional
    public void onInventoryReservationFailed(String eventId, Long orderId, String correlationId, String reason) {
        if (isDuplicateEvent(eventId)) {
            return;
        }

        Optional<OrderSaga> sagaOpt = sagaRepository.findByOrderId(orderId);
        if (sagaOpt.isEmpty()) {
            return;
        }
        OrderSaga saga = sagaOpt.get();

        if (saga.getStatus() != SagaStatus.IN_PROGRESS || saga.getStep() != SagaStep.INVENTORY_RESERVE) {
            return;
        }

        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.CANCELLED);

        saga.setStatus(SagaStatus.FAILED);
        saga.setLastError(reason);
        saga.setUpdatedAt(Instant.now());
        saga.setNextRetryAt(null);

        // Emit cancellation for downstream systems (notifications, analytics, etc.).
        enqueueOrderCancelled(orderId, correlationId, "INVENTORY_RESERVATION_FAILED");
    }

    @Transactional
    public void onPaymentApproved(String eventId, Long orderId, String correlationId) {
        if (isDuplicateEvent(eventId)) {
            return;
        }

        Optional<OrderSaga> sagaOpt = sagaRepository.findByOrderId(orderId);
        if (sagaOpt.isEmpty()) {
            return;
        }
        OrderSaga saga = sagaOpt.get();

        if (saga.getStatus() != SagaStatus.IN_PROGRESS || saga.getStep() != SagaStep.PAYMENT_AUTHORIZE) {
            return;
        }

        Order order = orderRepository.findById(orderId).orElseThrow();
        // In a real system you might have additional steps (shipment, fulfillment).
        // Here we consider payment approval as "order completed".
        order.setStatus(OrderStatus.COMPLETED);

        saga.setStatus(SagaStatus.COMPLETED);
        saga.setUpdatedAt(Instant.now());
        saga.setNextRetryAt(null);

        enqueueOrderCompleted(orderId, correlationId);
    }

    @Transactional
    public void onPaymentFailed(String eventId, Long orderId, String correlationId, String reason) {
        if (isDuplicateEvent(eventId)) {
            return;
        }

        Optional<OrderSaga> sagaOpt = sagaRepository.findByOrderId(orderId);
        if (sagaOpt.isEmpty()) {
            return;
        }
        OrderSaga saga = sagaOpt.get();

        if (saga.getStatus() != SagaStatus.IN_PROGRESS || saga.getStep() != SagaStep.PAYMENT_AUTHORIZE) {
            return;
        }

        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.PAYMENT_FAILED);

        // Compensation path: release inventory.
        saga.setStatus(SagaStatus.COMPENSATING);
        saga.setStep(SagaStep.INVENTORY_RELEASE);
        saga.setLastError(reason);
        saga.setUpdatedAt(Instant.now());
        saga.setNextRetryAt(Instant.now().plusMillis(stepTimeoutMs));

        enqueueInventoryRelease(order, saga, "payment_failed");
    }

    @Transactional
    public void onInventoryReleased(String eventId, Long orderId, String correlationId) {
        if (isDuplicateEvent(eventId)) {
            return;
        }

        Optional<OrderSaga> sagaOpt = sagaRepository.findByOrderId(orderId);
        if (sagaOpt.isEmpty()) {
            return;
        }
        OrderSaga saga = sagaOpt.get();

        if (saga.getStatus() != SagaStatus.COMPENSATING || saga.getStep() != SagaStep.INVENTORY_RELEASE) {
            return;
        }

        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.CANCELLED);

        saga.setStatus(SagaStatus.COMPENSATED);
        saga.setUpdatedAt(Instant.now());
        saga.setNextRetryAt(null);

        enqueueOrderCancelled(orderId, correlationId, "PAYMENT_FAILED");
    }

    @Transactional
    public void retrySaga(OrderSaga saga) {
        if (saga.getRetryCount() >= maxRetries) {
            saga.setStatus(SagaStatus.TIMED_OUT);
            saga.setUpdatedAt(Instant.now());
            saga.setNextRetryAt(null);
            return;
        }

        saga.setRetryCount(saga.getRetryCount() + 1);
        saga.setUpdatedAt(Instant.now());
        saga.setNextRetryAt(Instant.now().plusMillis(backoffDelayMs(saga.getRetryCount())));

        // Resend command for the current step. This is safe because
        // the downstream services are expected to be idempotent.
        Order order = orderRepository.findById(saga.getOrderId()).orElseThrow();
        if (saga.getStatus() == SagaStatus.IN_PROGRESS && saga.getStep() == SagaStep.INVENTORY_RESERVE) {
            enqueueInventoryReserve(order, saga, "retry");
        } else if (saga.getStatus() == SagaStatus.IN_PROGRESS && saga.getStep() == SagaStep.PAYMENT_AUTHORIZE) {
            enqueuePaymentAuthorize(order, saga, saga.getCorrelationId(), "retry");
        } else if (saga.getStatus() == SagaStatus.COMPENSATING && saga.getStep() == SagaStep.INVENTORY_RELEASE) {
            enqueueInventoryRelease(order, saga, "retry");
        }
    }

    private boolean isDuplicateEvent(String eventId) {
        if (eventId == null || eventId.isBlank()) {
            // If the event has no ID we cannot safely de-duplicate.
            return false;
        }
        // Inbox table is a common production pattern to prevent
        // double-processing when Kafka redelivers messages.
        if (inboxRepository.existsById(eventId)) {
            return true;
        }
        SagaInbox inbox = new SagaInbox();
        inbox.setEventId(eventId);
        inbox.setProcessedAt(Instant.now());
        inboxRepository.save(inbox);
        return false;
    }

    private void enqueueInventoryReserve(Order order, OrderSaga saga, String cause) {
        outboxService.enqueue(
            "OrderSaga",
            saga.getId(),
            "INVENTORY_RESERVE_COMMAND",
            Map.of(
                "orderId", order.getId(),
                "customerId", order.getCustomerId(),
                "amount", order.getAmount().toPlainString()
            ),
            metadata(saga, cause)
        );
    }

    private void enqueuePaymentAuthorize(Order order, OrderSaga saga, String correlationId, String cause) {
        outboxService.enqueue(
            "OrderSaga",
            saga.getId(),
            "PAYMENT_AUTHORIZE_COMMAND",
            Map.of(
                "orderId", order.getId(),
                "customerId", order.getCustomerId(),
                "amount", order.getAmount().toPlainString()
            ),
            metadata(saga, cause, correlationId)
        );
    }

    private void enqueueInventoryRelease(Order order, OrderSaga saga, String cause) {
        outboxService.enqueue(
            "OrderSaga",
            saga.getId(),
            "INVENTORY_RELEASE_COMMAND",
            Map.of(
                "orderId", order.getId(),
                "customerId", order.getCustomerId(),
                "amount", order.getAmount().toPlainString()
            ),
            metadata(saga, cause)
        );
    }

    private void enqueueOrderCancelled(Long orderId, String correlationId, String reason) {
        outboxService.enqueue(
            "Order",
            String.valueOf(orderId),
            "ORDER_CANCELLED",
            Map.of(
                "orderId", orderId,
                "reason", reason
            ),
            Map.of("correlationId", correlationId == null ? "" : correlationId)
        );
    }

    private void enqueueOrderCompleted(Long orderId, String correlationId) {
        outboxService.enqueue(
            "Order",
            String.valueOf(orderId),
            "ORDER_COMPLETED",
            Map.of(
                "orderId", orderId,
                "status", "COMPLETED"
            ),
            Map.of("correlationId", correlationId == null ? "" : correlationId)
        );
    }

    private Map<String, String> metadata(OrderSaga saga, String cause) {
        return metadata(saga, cause, saga.getCorrelationId());
    }

    private Map<String, String> metadata(OrderSaga saga, String cause, String correlationId) {
        return Map.of(
            "sagaId", saga.getId(),
            "correlationId", correlationId == null ? "" : correlationId,
            "cause", cause
        );
    }

    private long backoffDelayMs(int retryCount) {
        long multiplier = (long) Math.pow(2, Math.max(0, retryCount - 1));
        return baseBackoffMs * multiplier;
    }
}
