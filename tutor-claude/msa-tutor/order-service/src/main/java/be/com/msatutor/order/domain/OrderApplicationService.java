package be.com.msatutor.order.domain;

import be.com.msatutor.order.api.OrderRequest;
import be.com.msatutor.order.outbox.OutboxService;
import be.com.msatutor.order.saga.SagaOrchestrator;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderApplicationService {

    private final OrderRepository orderRepository;
    private final IdempotencyRepository idempotencyRepository;
    private final OutboxService outboxService;
    private final SagaOrchestrator sagaOrchestrator;

    public OrderApplicationService(
        OrderRepository orderRepository,
        IdempotencyRepository idempotencyRepository,
        OutboxService outboxService,
        SagaOrchestrator sagaOrchestrator
    ) {
        this.orderRepository = orderRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.outboxService = outboxService;
        this.sagaOrchestrator = sagaOrchestrator;
    }

    @Transactional
    public Order createOrder(OrderRequest request, String idempotencyKey, String correlationId) {
        if (idempotencyKey != null && idempotencyRepository.existsById(idempotencyKey)) {
            Long orderId = idempotencyRepository.findById(idempotencyKey).orElseThrow().getOrderId();
            return orderRepository.findById(orderId).orElseThrow();
        }

        Order order = new Order();
        order.setCustomerId(request.customerId());
        order.setAmount(request.amount());
        // Initial state before saga orchestration starts.
        order.setStatus(OrderStatus.CREATED);
        orderRepository.save(order);

        if (idempotencyKey != null) {
            IdempotencyRecord record = new IdempotencyRecord();
            record.setKey(idempotencyKey);
            record.setOrderId(order.getId());
            idempotencyRepository.save(record);
        }

        // Outbox: store the event inside the same transaction for reliable publishing.
        outboxService.enqueue(
            "Order",
            String.valueOf(order.getId()),
            "ORDER_CREATED",
            Map.of(
                "orderId", order.getId(),
                "customerId", order.getCustomerId(),
                "amount", order.getAmount().toString()
            ),
            Map.of("correlationId", correlationId == null ? "" : correlationId)
        );

        // Start orchestration Saga inside the same DB transaction.
        // This guarantees that the saga state and the outbox command are consistent.
        sagaOrchestrator.startSaga(order, correlationId);

        return order;
    }

    @Transactional
    public void markPaymentApproved(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.PAID);
    }

    @Transactional
    public void markPaymentFailed(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.PAYMENT_FAILED);

        // Legacy path kept for reference: in the current orchestration saga,
        // compensation is handled by SagaOrchestrator instead of directly here.
        outboxService.enqueue(
            "Order",
            String.valueOf(order.getId()),
            "ORDER_CANCELLED",
            Map.of(
                "orderId", order.getId(),
                "reason", "PAYMENT_FAILED"
            ),
            Map.of()
        );
    }
}
