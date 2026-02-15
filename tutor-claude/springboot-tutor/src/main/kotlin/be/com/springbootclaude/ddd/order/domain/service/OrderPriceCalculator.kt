package be.com.springbootclaude.ddd.order.domain.service

import be.com.springbootclaude.ddd.order.domain.model.Money
import be.com.springbootclaude.ddd.order.domain.model.Order
import org.springframework.stereotype.Service

/**
 * Domain Service: OrderPriceCalculator
 *
 * Domain Service란?
 * - 특정 Entity나 Value Object에 속하지 않는 도메인 로직
 * - Stateless (상태를 갖지 않음)
 * - 여러 Aggregate를 조율하는 로직
 *
 * 언제 Domain Service를 만드는가?
 * 1. 로직이 특정 Entity에 억지로 끼워맞춰지는 느낌
 * 2. 여러 Aggregate에 걸친 연산
 * 3. 외부 정책이나 룰 엔진 같은 것
 *
 * 예시:
 * - 주문 총액 계산은 Order에 있지만,
 * - 할인 정책은 여러 요소를 고려 (고객 등급, 프로모션, 쿠폰 등)
 * - 이런 복잡한 계산 로직은 Domain Service로
 */
@Service
class OrderPriceCalculator {

    /**
     * 도메인 로직: 배송비 계산
     * - 서울 지역: 무료
     * - 기타 지역: 3000원
     * - 10만원 이상: 무료
     */
    fun calculateDeliveryFee(order: Order): Money {
        val totalAmount = order.calculateTotalAmount()

        // 10만원 이상 주문은 배송비 무료
        if (totalAmount >= Money.of(100000)) {
            return Money.ZERO
        }

        // 서울 지역은 배송비 무료
        if (order.deliveryAddress.isSeoulArea()) {
            return Money.ZERO
        }

        // 기본 배송비
        return Money.of(3000)
    }

    /**
     * 도메인 로직: 최종 결제 금액 계산
     * 주문 금액 + 배송비 - 할인
     */
    fun calculateFinalAmount(order: Order): Money {
        val itemsTotal = order.calculateTotalAmount()
        val deliveryFee = calculateDeliveryFee(order)
        val discount = calculateDiscount(order)

        return itemsTotal + deliveryFee - discount
    }

    /**
     * 도메인 로직: 할인 금액 계산
     * 실제로는 쿠폰, 프로모션, 회원 등급 등 고려
     */
    private fun calculateDiscount(order: Order): Money {
        val totalAmount = order.calculateTotalAmount()

        // 예시: 20만원 이상 구매 시 5% 할인
        return if (totalAmount >= Money.of(200000)) {
            Money(totalAmount.amount * 0.05.toBigDecimal())
        } else {
            Money.ZERO
        }
    }

    /**
     * 도메인 로직: 포인트 적립액 계산
     * - 최종 결제 금액의 1% 적립
     */
    fun calculateEarnedPoints(order: Order): Int {
        val finalAmount = calculateFinalAmount(order)
        return (finalAmount.amount * 0.01.toBigDecimal()).toInt()
    }
}
