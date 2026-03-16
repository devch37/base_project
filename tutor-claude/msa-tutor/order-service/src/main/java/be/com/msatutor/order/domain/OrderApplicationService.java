package be.com.msatutor.order.domain;

import be.com.msatutor.order.api.OrderRequest;
import be.com.msatutor.order.infra.OrderTopicsProperties;
import be.com.msatutor.order.outbox.OutboxService;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderApplicationService {

    private final OrderRepository orderRepository;
    private final IdempotencyRepository idempotencyRepository;
    private final OrderTopicsProperties topics;
    private final OutboxService outboxService;

    public OrderApplicationService(
        OrderRepository orderRepository,
        IdempotencyRepository idempotencyRepository,
        OrderTopicsProperties topics,
        OutboxService outboxService
    ) {
        this.orderRepository = orderRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.topics = topics;
        this.outboxService = outboxService;
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
        order.setStatus(OrderStatus.PAYMENT_PENDING);
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

        // Compensation trigger: emit cancellation event for downstream services.
        // This is a simple choreography-style Saga.
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
