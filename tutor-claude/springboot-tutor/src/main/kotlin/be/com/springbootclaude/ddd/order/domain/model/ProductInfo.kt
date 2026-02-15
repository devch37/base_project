package be.com.springbootclaude.ddd.order.domain.model

import jakarta.persistence.Embeddable
import jakarta.persistence.Embedded

/**
 * Value Object: ProductInfo (상품 정보)
 *
 * 왜 별도의 Value Object로?
 * - Order는 Product Entity에 직접 의존하지 않음 (느슨한 결합)
 * - 주문 시점의 상품 정보를 스냅샷으로 저장
 * - Product가 나중에 수정되어도 주문 내역은 불변
 *
 * 이것이 DDD의 핵심: Bounded Context 간 격리
 * - Order Context는 Product의 모든 정보가 필요 없음
 * - 필요한 정보만 Value Object로 표현
 */
@Embeddable
data class ProductInfo(
    val productId: Long = 0,
    val productName: String = "",
    @Embedded
    val price: Money = Money.ZERO
) {
    init {
        require(productId > 0) { "상품 ID는 양수여야 합니다." }
        require(productName.isNotBlank()) { "상품명은 필수입니다." }
    }
}
