package com.jpatutor.ch06_valuetype;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ValueTypeTest {

    @Autowired
    EntityManager em;

    @Test
    @DisplayName("같은 임베디드 타입을 두 번 써도 @AttributeOverrides로 컬럼이 겹치지 않는다")
    @Transactional
    void embeddedTwiceWithOverrides() {
        Member member = new Member("홍길동", new Address("서울", "강남대로", "06000"));
        member.assignWorkAddress(new Address("서울", "테헤란로", "06120"));

        em.persist(member);
        em.flush();
        em.clear();

        Member reloaded = em.find(Member.class, member.getId());
        assertThat(reloaded.getHomeAddress().getStreet()).isEqualTo("강남대로");
        assertThat(reloaded.getWorkAddress().getStreet()).isEqualTo("테헤란로");
    }

    @Test
    @DisplayName("값 타입은 동일성이 아니라 값이 같은지로 비교한다 (equals/hashCode)")
    void valueEquality() {
        Address a1 = new Address("서울", "강남대로", "06000");
        Address a2 = new Address("서울", "강남대로", "06000");

        // 서로 다른 인스턴스지만(a1 != a2), 값이 모두 같으므로 값 타입 관점에서는 "같다".
        assertThat(a1).isNotSameAs(a2);
        assertThat(a1).isEqualTo(a2);
    }

    @Test
    @DisplayName("@ElementCollection은 별도 테이블에 저장되고, 주소를 교체하면 이력에 이전 값이 남는다")
    @Transactional
    void elementCollectionAndImmutableReplace() {
        Member member = new Member("김철수", new Address("서울", "강남대로", "06000"));
        member.addFavoriteFood("삼겹살");
        member.addFavoriteFood("냉면");
        em.persist(member);

        // 값 타입은 불변이므로 homeAddress 필드 안의 값을 직접 바꾸지 않고, 새 Address로 통째로 교체한다.
        member.moveHome(new Address("부산", "해운대로", "48000"));

        em.flush();
        em.clear();

        Member reloaded = em.find(Member.class, member.getId());
        assertThat(reloaded.getHomeAddress().getCity()).isEqualTo("부산");
        assertThat(reloaded.getAddressHistory()).hasSize(1);
        assertThat(reloaded.getAddressHistory().get(0).getCity()).isEqualTo("서울"); // 이전 주소가 이력에 보존됨
        assertThat(reloaded.getFavoriteFoods()).containsExactlyInAnyOrder("삼겹살", "냉면");
    }
}
