package be.com.springbootclaude.ddd.order.presentation

import be.com.springbootclaude.ddd.order.application.*
import be.com.springbootclaude.ddd.order.domain.model.Address
import be.com.springbootclaude.ddd.order.domain.model.Money
import be.com.springbootclaude.ddd.order.domain.model.OrderStatus
import be.com.springbootclaude.ddd.order.domain.model.ProductInfo
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

/**
 * Presentation Layer: OrderController
 *
 * REST API 엔드포인트
 * - HTTP 요청을 Application Service 호출로 변환
 * - DTO 변환 (Request → Command, Response → DTO)
 * - HTTP 상태 코드 반환
 *
 * DDD 관점:
 * - 얇은 계층 (비즈니스 로직 없음)
 * - Application Service에 위임
 */
@RestController
@RequestMapping("/api/ddd/orders")
class OrderController(
    private val orderCommandService: OrderCommandService,
    private val orderQueryService: OrderQueryService
) {

    /**
     * API: 주문 생성
     * POST /api/ddd/orders
     */
    @PostMapping
    fun createOrder(@RequestBody request: CreateOrderRequest): ResponseEntity<CreateOrderResponse> {
        val command = CreateOrderCommand(
            customerId = request.customerId,
            deliveryAddress = Address(
                zipCode = request.deliveryAddress.zipCode,
                city = request.deliveryAddress.city,
                street = request.deliveryAddress.street,
                detailAddress = request.deliveryAddress.detailAddress
            ),
            items = request.items.map { item ->
                OrderItemCommand(
                    productInfo = ProductInfo(
                        productId = item.productId,
                        productName = item.productName,
                        price = Money.of(item.price)
                    ),
                    quantity = item.quantity
                )
            }
        )

        val orderId = orderCommandService.createOrder(command)

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(CreateOrderResponse(orderId))
    }

    /**
     * API: 주문 조회
     * GET /api/ddd/orders/{orderId}
     */
    @GetMapping("/{orderId}")
    fun getOrder(@PathVariable orderId: Long): ResponseEntity<OrderDetailDto> {
        val orderDetail = orderQueryService.getOrderDetail(orderId)
        return ResponseEntity.ok(orderDetail)
    }

    /**
     * API: 고객의 주문 목록 조회
     * GET /api/ddd/orders?customerId=1
     */
    @GetMapping
    fun getCustomerOrders(@RequestParam customerId: Long): ResponseEntity<List<OrderSummaryDto>> {
        val orders = orderQueryService.getCustomerOrders(customerId)
        return ResponseEntity.ok(orders)
    }

    /**
     * API: 주문 확정
     * POST /api/ddd/orders/{orderId}/confirm
     */
    @PostMapping("/{orderId}/confirm")
    fun confirmOrder(@PathVariable orderId: Long): ResponseEntity<Void> {
        orderCommandService.confirmOrder(orderId)
        return ResponseEntity.ok().build()
    }

    /**
     * API: 주문 취소
     * POST /api/ddd/orders/{orderId}/cancel
     */
    @PostMapping("/{orderId}/cancel")
    fun cancelOrder(
        @PathVariable orderId: Long,
        @RequestBody request: CancelOrderRequest
    ): ResponseEntity<Void> {
        orderCommandService.cancelOrder(orderId, request.reason)
        return ResponseEntity.ok().build()
    }

    /**
     * API: 주문 항목 추가
     * POST /api/ddd/orders/{orderId}/items
     */
    @PostMapping("/{orderId}/items")
    fun addOrderItem(
        @PathVariable orderId: Long,
        @RequestBody request: AddOrderItemRequest
    ): ResponseEntity<Void> {
        val command = AddOrderItemCommand(
            productInfo = ProductInfo(
                productId = request.productId,
                productName = request.productName,
                price = Money.of(request.price)
            ),
            quantity = request.quantity
        )

        orderCommandService.addOrderItem(orderId, command)
        return ResponseEntity.ok().build()
    }

    /**
     * API: 주문 항목 제거
     * DELETE /api/ddd/orders/{orderId}/items/{productId}
     */
    @DeleteMapping("/{orderId}/items/{productId}")
    fun removeOrderItem(
        @PathVariable orderId: Long,
        @PathVariable productId: Long
    ): ResponseEntity<Void> {
        orderCommandService.removeOrderItem(orderId, productId)
        return ResponseEntity.ok().build()
    }
}

/**
 * Request DTOs
 */
data class CreateOrderRequest(
    val customerId: Long,
    val deliveryAddress: AddressRequest,
    val items: List<OrderItemRequest>
)

data class AddressRequest(
    val zipCode: String,
    val city: String,
    val street: String,
    val detailAddress: String
)

data class OrderItemRequest(
    val productId: Long,
    val productName: String,
    val price: Long,
    val quantity: Int
)

data class CancelOrderRequest(
    val reason: String
)

data class AddOrderItemRequest(
    val productId: Long,
    val productName: String,
    val price: Long,
    val quantity: Int
)

/**
 * Response DTOs
 */
data class CreateOrderResponse(
    val orderId: Long
)
