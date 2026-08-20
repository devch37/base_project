package com.jpatutor.ch06_valuetype;

import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [6장] 임베디드 타입(값 타입, Value Object).
 *
 * - @Embeddable: 다른 엔티티에 "끼워 넣어(embed)" 사용할 수 있는 타입임을 표시한다.
 * - 값 타입은 엔티티와 달리 "식별자(@Id)가 없다". city="서울", street="강남대로"인 두 Address는
 *   완전히 동일한 것으로 취급되어야 한다 (동일성이 아니라 "값이 같은지"로 비교, equals/hashCode 필수).
 * - 실무 원칙: 값 타입은 반드시 불변(immutable)으로 설계해야 한다. setter를 두지 않고
 *   생성자로만 값을 채운 뒤, 값을 바꾸고 싶으면 "새 Address 객체를 통째로 교체"하는 방식으로 써야 한다.
 *   그 이유는 값 타입 인스턴스를 여러 엔티티가 공유(참조)하게 되면, 한쪽에서 setter로 값을 바꿨을 때
 *   의도치 않게 다른 엔티티의 값까지 같이 바뀌어버리는(부작용) 매우 찾기 힘든 버그가 생기기 때문이다.
 */
@Embeddable
@Getter
@EqualsAndHashCode
@NoArgsConstructor
public class Address {

    private String city;
    private String street;
    private String zipcode;

    public Address(String city, String street, String zipcode) {
        this.city = city;
        this.street = street;
        this.zipcode = zipcode;
    }
}
