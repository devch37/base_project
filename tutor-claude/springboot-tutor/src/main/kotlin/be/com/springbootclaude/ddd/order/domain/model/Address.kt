package be.com.springbootclaude.ddd.order.domain.model

import jakarta.persistence.Embeddable

/**
 * Value Object: Address (배송지 주소)
 *
 * 왜 Address를 Value Object로?
 * - 주소는 변경되면 완전히 새로운 주소 (부분 변경이 아님)
 * - 주소 자체에 유효성 검증 로직 포함
 * - 여러 Aggregate에서 재사용 가능 (User, Order, Store 등)
 *
 * Value Object의 특징:
 * - data class로 만들면 equals/hashCode 자동 생성
 * - val로 선언하여 불변성 보장
 * - 생성 시점에 유효성 검증 (init 블록)
 */
@Embeddable
data class Address(
    val zipCode: String = "",
    val city: String = "",
    val street: String = "",
    val detailAddress: String = ""
) {
    init {
        require(zipCode.isNotBlank()) { "우편번호는 필수입니다." }
        require(city.isNotBlank()) { "도시는 필수입니다." }
        require(street.isNotBlank()) { "도로명은 필수입니다." }
        require(zipCode.matches(Regex("\\d{5}"))) {
            "우편번호는 5자리 숫자여야 합니다. 입력값: $zipCode"
        }
    }

    /**
     * Value Object는 비즈니스 로직도 포함할 수 있음
     */
    fun getFullAddress(): String {
        return "[$zipCode] $city $street $detailAddress"
    }

    /**
     * 특정 지역인지 판단하는 도메인 로직
     */
    fun isSeoulArea(): Boolean = city.contains("서울")
}
