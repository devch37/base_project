package com.jpatutor.ch15_performance;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * [15장] OSIV(Open Session In View)를 끈 상태(이 프로젝트의 application.yml: open-in-view: false)에서
 * "트랜잭션이 끝나면 영속성 컨텍스트(세션)도 함께 닫힌다"는 것을 보여주기 위한 서비스.
 *
 * OSIV가 true(스프링 부트 기본값)이면 컨트롤러가 응답을 렌더링할 때까지 영속성 컨텍스트가
 * 열려있어서, 트랜잭션이 끝난 뒤(서비스 메서드 반환 후)에도 지연 로딩을 계속 사용할 수 있다.
 * 하지만 이건 "요청-응답 전체" 동안 DB 커넥션을 하나 붙잡고 있다는 뜻이라, 트래픽이 많은
 * 서비스에서는 커넥션 풀 고갈로 이어질 수 있다. 그래서 실무에서는 open-in-view: false로 끄고,
 * 대신 "트랜잭션 안에서 필요한 데이터를 다 준비해서" DTO나 fetch join으로 반환하는 패턴을 쓴다.
 */
@Service
@RequiredArgsConstructor
public class OrderQueryService {

    private final OrderRepository orderRepository;

    // 지연 로딩 필드(member, orderItems)를 트랜잭션 안에서 전혀 건드리지 않고 그대로 반환한다.
    // -> 트랜잭션이 끝나는 순간 세션이 닫히므로, 반환된 프록시들은 더 이상 초기화할 수 없다.
    @Transactional(readOnly = true)
    public Order findOrderWithoutTouchingLazyFields(Long id) {
        return orderRepository.findById(id).orElseThrow();
    }

    // fetch join으로 트랜잭션 "안에서" 필요한 연관관계를 전부 미리 초기화해둔다.
    // -> 세션이 닫혀도 이미 채워진 값이라 트랜잭션 밖에서 접근해도 예외가 나지 않는다.
    @Transactional(readOnly = true)
    public Order findOrderWithFetchJoin(Long id) {
        return orderRepository.findByIdFetchAll(id).orElseThrow();
    }
}
