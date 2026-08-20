package com.jpatutor.ch15_performance;

import org.hibernate.LazyInitializationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * [15장] @SpringBootTest를 사용해 "진짜 트랜잭션 경계"를 재현한다.
 * (@DataJpaTest는 테스트 메서드 전체를 하나의 트랜잭션으로 감싸버리기 때문에, 서비스 메서드가
 * 끝나도 테스트 자체의 트랜잭션이 계속 열려있어 OSIV-off 상황을 재현할 수 없다)
 */
@SpringBootTest
class OsivAndFetchStrategyTest {

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    OrderQueryService orderQueryService;

    @Test
    @DisplayName("open-in-view: false 상태에서, 트랜잭션 밖에서 지연 로딩 필드에 접근하면 LazyInitializationException이 터진다")
    void lazyFieldAccessOutsideTransactionFails() {
        Member member = memberRepository.save(new Member("홍길동"));
        Order order = orderRepository.save(new Order(member));

        // 서비스 메서드(트랜잭션)는 이미 끝났다. 즉 영속성 컨텍스트(세션)는 닫혀있다.
        Order found = orderQueryService.findOrderWithoutTouchingLazyFields(order.getId());

        // member는 아직 초기화되지 않은 프록시 상태 - 세션이 없으므로 실제 값을 가져올 방법이 없다.
        assertThatThrownBy(() -> found.getMember().getName())
                .isInstanceOf(LazyInitializationException.class);
    }

    @Test
    @DisplayName("트랜잭션 안에서 fetch join으로 미리 초기화해두면, 트랜잭션 밖에서도 안전하게 값을 읽을 수 있다")
    void fetchJoinedFieldAccessOutsideTransactionSucceeds() {
        Member member = memberRepository.save(new Member("김철수"));
        Order order = orderRepository.save(new Order(member));

        Order found = orderQueryService.findOrderWithFetchJoin(order.getId());

        // fetch join으로 이미 실제 데이터가 채워진 상태라, 세션이 닫힌 뒤에도 예외 없이 값을 읽는다.
        assertThat(found.getMember().getName()).isEqualTo("김철수");
    }
}
