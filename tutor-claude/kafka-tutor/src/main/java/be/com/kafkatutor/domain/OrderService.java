package be.com.kafkatutor.domain;

import be.com.kafkatutor.outbox.OutboxService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OutboxService outboxService;

    public OrderService(OrderRepository orderRepository, OutboxService outboxService) {
        this.orderRepository = orderRepository;
        this.outboxService = outboxService;
    }

    @Transactional
    public Order createOrder(OrderRequest request) {
        Order order = new Order();
        order.setCustomerId(request.customerId());
        order.setAmount(request.amount());
        order.setStatus(OrderStatus.CREATED);
        return orderRepository.save(order);
    }

    @Transactional
    public Order createOrderWithOutbox(OrderRequest request) {
        Order order = createOrder(request);

        // Outbox pattern: store the event in DB within the same transaction.
        Map<String, Object> payload = new HashMap<>();
        payload.put("customerId", order.getCustomerId());
        payload.put("amount", order.getAmount());
        payload.put("status", order.getStatus().name());

        outboxService.enqueue(
            "Order",
            String.valueOf(order.getId()),
            "ORDER_CREATED",
            payload
        );

        return order;
    }
}
