package be.com.msatutor.order.api;

import be.com.msatutor.common.trace.TraceHeaders;
import be.com.msatutor.order.domain.Order;
import be.com.msatutor.order.domain.OrderApplicationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderApplicationService orderApplicationService;

    public OrderController(OrderApplicationService orderApplicationService) {
        this.orderApplicationService = orderApplicationService;
    }

    @PostMapping
    public OrderResponse create(
        @Valid @RequestBody OrderRequest request,
        @RequestHeader(value = TraceHeaders.IDEMPOTENCY_KEY, required = false) String idempotencyKey,
        @RequestHeader(value = TraceHeaders.CORRELATION_ID, required = false) String correlationId
    ) {
        Order order = orderApplicationService.createOrder(request, idempotencyKey, correlationId);
        return OrderResponse.from(order);
    }
}
