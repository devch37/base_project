package be.com.springbootclaude.ddd.order.domain.model

import jakarta.persistence.Embeddable
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Value Object: Money
 *
 * DDD에서 Value Object란?
 * - 식별자(ID)가 없고, 값 자체로 식별되는 객체
 * - 불변(Immutable)해야 함
 * - 비즈니스 로직을 캡슐화
 * - 동등성 비교는 값으로 함 (equals/hashCode)
 *
 * 왜 Money를 Value Object로?
 * - BigDecimal만 사용하면 음수 금액, 잘못된 연산 등을 막을 수 없음
 * - 비즈니스 규칙(음수 불가, 정확한 반올림 등)을 도메인 모델에 표현
 * - 재사용 가능한 도메인 개념으로 추상화
 *
 * JPA Mapping:
 * - @Embeddable: Value Object를 엔티티에 포함시킬 수 있음
 * - 데이터베이스에는 amount 컬럼으로 저장됨
 */
@Embeddable
data class Money(
    val amount: BigDecimal = BigDecimal.ZERO
) {
    init {
        require(amount >= BigDecimal.ZERO) {
            "금액은 0보다 작을 수 없습니다. 입력값: $amount"
        }
    }

    /**
     * 도메인 로직: 금액 더하기
     * 새로운 Money 객체를 반환 (불변성 유지)
     */
    operator fun plus(other: Money): Money {
        return Money(this.amount + other.amount)
    }

    /**
     * 도메인 로직: 금액 빼기
     */
    operator fun minus(other: Money): Money {
        return Money((this.amount - other.amount).setScale(2, RoundingMode.HALF_UP))
    }

    /**
     * 도메인 로직: 금액 곱하기 (수량 * 단가)
     */
    operator fun times(multiplier: Int): Money {
        require(multiplier >= 0) { "곱하는 수는 0 이상이어야 합니다." }
        return Money((this.amount * BigDecimal(multiplier)).setScale(2, RoundingMode.HALF_UP))
    }

    /**
     * 도메인 로직: 비교
     */
    operator fun compareTo(other: Money): Int {
        return this.amount.compareTo(other.amount)
    }

    fun isZero(): Boolean = amount == BigDecimal.ZERO

    companion object {
        val ZERO = Money(BigDecimal.ZERO)

        fun of(amount: Long): Money = Money(BigDecimal(amount))
        fun of(amount: String): Money = Money(BigDecimal(amount))
    }
}
