package be.com.springbootclaude.ddd.order.domain.model

import be.com.springbootclaude.ddd.order.domain.event.OrderCancelled
import be.com.springbootclaude.ddd.order.domain.event.OrderPlaced
import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * Aggregate Root: Order (주문)
 *
 * ★ DDD에서 가장 중요한 개념: Aggregate Root ★
 *
 * Aggregate란?
 * - 관련된 Entity와 Value Object의 집합
 * - 데이터 변경의 단위 (트랜잭션 경계)
 * - 일관성을 보장하는 경계
 *
 * Aggregate Root란?
 * - Aggregate의 진입점이 되는 Entity
 * - 외부에서는 오직 Root를 통해서만 Aggregate 내부에 접근
 * - 불변식(Invariant)을 보장할 책임
 *
 * 왜 Order가 Aggregate Root인가?
 * 1. OrderItem은 Order 없이 의미 없음
 * 2. OrderItem의 변경은 Order의 총액에 영향
 * 3. Order가 OrderItem들의 일관성 보장
 *
 * 핵심 규칙:
 * - 외부에서 OrderItem을 직접 생성/변경하면 안 됨
 * - 모든 변경은 Order를 통해서만 (addItem, removeItem 등)
 * - Order가 비즈니스 규칙 검증
 */
@Entity
@Table(name = "orders")
class Order(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val customerId: Long,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "zipCode", column = Column(name = "delivery_zip_code")),
        AttributeOverride(name = "city", column = Column(name = "delivery_city")),
        AttributeOverride(name = "street", column = Column(name = "delivery_street")),
        AttributeOverride(name = "detailAddress", column = Column(name = "delivery_detail_address"))
    )
    val deliveryAddress: Address,

    /**
     * Aggregate 경계: OrderItem은 Order에 완전히 종속
     * CascadeType.ALL: Order 저장/삭제 시 OrderItem도 함께
     * orphanRemoval: Order에서 제거된 OrderItem은 자동 삭제
     */
    @OneToMany(
        mappedBy = "order",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private val _orderItems: MutableList<OrderItem> = mutableListOf(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: OrderStatus = OrderStatus.PENDING,

    @Column(nullable = false)
    val orderedAt: LocalDateTime = LocalDateTime.now(),

    /**
     * Domain Events: Aggregate에서 발생한 중요한 사건
     * 다른 Bounded Context나 외부 시스템에 알릴 필요가 있는 이벤트
     */
    @Transient
    private val _domainEvents: MutableList<Any> = mutableListOf()
) {
    /**
     * Aggregate 불변식 보호: 외부에서 직접 수정 불가
     * 읽기 전용 뷰 제공
     */
    val orderItems: List<OrderItem>
        get() = _orderItems.toList()

    val domainEvents: List<Any>
        get() = _domainEvents.toList()

    init {
        require(customerId > 0) { "고객 ID는 양수여야 합니다." }
    }

    /**
     * ★ Aggregate Root의 핵심 메서드 ★
     * 외부에서는 이 메서드로만 OrderItem 추가
     * 비즈니스 규칙을 검증하고 일관성 보장
     */
    fun addItem(productInfo: ProductInfo, quantity: Int) {
        require(status == OrderStatus.PENDING) {
            "주문 대기 상태에서만 항목을 추가할 수 있습니다. 현재 상태: $status"
        }

        // 같은 상품이 이미 있으면 수량만 증가
        val existingItem = _orderItems.find { it.productInfo.productId == productInfo.productId }
        if (existingItem != null) {
            existingItem.changeQuantity(existingItem.quantity + quantity)
        } else {
            val newItem = OrderItem(
                productInfo = productInfo,
                quantity = quantity,
                order = this
            )
            _orderItems.add(newItem)
        }
    }

    /**
     * 항목 제거: Aggregate Root가 일관성 보장
     */
    fun removeItem(productId: Long) {
        require(status == OrderStatus.PENDING) {
            "주문 대기 상태에서만 항목을 제거할 수 있습니다."
        }

        _orderItems.removeIf { it.productInfo.productId == productId }

        require(_orderItems.isNotEmpty()) {
            "주문에는 최소 1개 이상의 항목이 필요합니다."
        }
    }

    /**
     * 도메인 로직: 총 주문 금액 계산
     * Money Value Object의 연산 활용
     */
    fun calculateTotalAmount(): Money {
        return _orderItems
            .map { it.calculateTotalPrice() }
            .fold(Money.ZERO) { acc, money -> acc + money }
    }

    /**
     * 도메인 로직: 주문 확정
     * 비즈니스 규칙 검증 + 상태 변경 + 이벤트 발행
     */
    fun confirm() {
        require(status == OrderStatus.PENDING) {
            "대기 중인 주문만 확정할 수 있습니다. 현재 상태: $status"
        }
        require(_orderItems.isNotEmpty()) {
            "주문 항목이 없습니다."
        }

        this.status = OrderStatus.CONFIRMED

        // Domain Event 발행
        val totalAmount = calculateTotalAmount()
        _domainEvents.add(
            OrderPlaced(
                orderId = id!!,
                customerId = customerId,
                totalAmount = totalAmount,
                itemCount = _orderItems.size
            )
        )
    }

    /**
     * 도메인 로직: 주문 취소
     * 상태 전이 규칙 검증
     */
    fun cancel(reason: String) {
        require(status.canBeCancelled()) {
            "현재 상태($status)에서는 주문을 취소할 수 없습니다."
        }

        val previousStatus = this.status
        this.status = OrderStatus.CANCELLED

        // Domain Event 발행
        _domainEvents.add(
            OrderCancelled(
                orderId = id!!,
                customerId = customerId,
                reason = reason,
                previousStatus = previousStatus
            )
        )
    }

    /**
     * 도메인 로직: 상태 변경
     * 비즈니스 규칙에 따른 전이만 허용
     */
    fun changeStatus(newStatus: OrderStatus) {
        require(status.canTransitionTo(newStatus)) {
            "주문 상태를 $status 에서 $newStatus 로 변경할 수 없습니다."
        }
        this.status = newStatus
    }

    /**
     * 도메인 이벤트 클리어 (이벤트 발행 후 호출)
     */
    fun clearDomainEvents() {
        _domainEvents.clear()
    }

    /**
     * Entity는 ID로 동등성 비교
     */
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Order) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int {
        return id?.hashCode() ?: 0
    }
}
