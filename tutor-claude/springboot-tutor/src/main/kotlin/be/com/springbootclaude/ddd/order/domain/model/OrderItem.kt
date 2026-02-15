package be.com.springbootclaude.ddd.order.domain.model

import jakarta.persistence.*

/**
 * Entity: OrderItem (주문 항목)
 *
 * Entity vs Value Object 구분:
 * - Entity: 식별자(ID)가 있고, 생명주기가 있음
 * - OrderItem은 Order 없이는 존재할 수 없음 (종속적)
 * - 하지만 각 항목을 구분할 필요가 있으므로 Entity
 *
 * DDD에서 Entity의 특징:
 * - 고유 식별자 존재
 * - 시간에 따라 상태 변경 가능 (Mutable)
 * - 동등성 비교는 ID로 함
 */
@Entity
@Table(name = "order_items")
class OrderItem(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "productId", column = Column(name = "product_id")),
        AttributeOverride(name = "productName", column = Column(name = "product_name")),
        AttributeOverride(name = "price.amount", column = Column(name = "product_price"))
    )
    val productInfo: ProductInfo,

    @Column(nullable = false)
    var quantity: Int,

    /**
     * OrderItem은 독립적으로 존재하지 않고 항상 Order에 속함
     * 이것이 Aggregate 패턴의 핵심
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    var order: Order? = null
) {
    init {
        require(quantity > 0) { "수량은 1개 이상이어야 합니다." }
    }

    /**
     * 도메인 로직: 이 항목의 총 가격 계산
     * Money Value Object의 연산자를 활용
     */
    fun calculateTotalPrice(): Money {
        return productInfo.price * quantity
    }

    /**
     * 도메인 로직: 수량 변경
     * 비즈니스 규칙을 포함한 메서드
     */
    fun changeQuantity(newQuantity: Int) {
        require(newQuantity > 0) { "수량은 1개 이상이어야 합니다." }
        this.quantity = newQuantity
    }

    /**
     * Entity는 ID로 동등성 비교
     */
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is OrderItem) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int {
        return id?.hashCode() ?: 0
    }
}
