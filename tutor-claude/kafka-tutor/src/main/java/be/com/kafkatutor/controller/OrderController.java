package be.com.kafkatutor.controller;

import be.com.kafkatutor.domain.Order;
import be.com.kafkatutor.domain.OrderRequest;
import be.com.kafkatutor.domain.OrderService;
import be.com.kafkatutor.producer.OrderProducer;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderProducer orderProducer;

    public OrderController(OrderService orderService, OrderProducer orderProducer) {
        this.orderService = orderService;
        this.orderProducer = orderProducer;
    }

    @PostMapping("/basic")
    public Order createBasic(@Valid @RequestBody OrderRequest request) {
        Order order = orderService.createOrder(request);
        orderProducer.sendOrderCreated(order);
        orderProducer.sendPaymentRequested(order);
        return order;
    }

    @PostMapping("/outbox")
    public Order createWithOutbox(@Valid @RequestBody OrderRequest request) {
        return orderService.createOrderWithOutbox(request);
    }

    @PostMapping("/transactional")
    public Order createTransactional(@Valid @RequestBody OrderRequest request) {
        Order order = orderService.createOrder(request);
        orderProducer.sendOrderEventTransactional(order, "ORDER_CREATED");
        return order;
    }

    @PostMapping("/force-fail")
    public Order createFailingEvent(@Valid @RequestBody OrderRequest request) {
        Order order = orderService.createOrder(request);
        orderProducer.sendFailingEvent(order);
        return order;
    }
}
