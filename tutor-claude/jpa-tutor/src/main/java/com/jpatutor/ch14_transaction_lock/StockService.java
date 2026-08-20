package com.jpatutor.ch14_transaction_lock;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * [14장] @Transactional의 기본 동작: 이 클래스의 public 메서드가 호출되면 스프링이
 * 프록시를 통해 트랜잭션을 시작하고, 메서드가 정상 종료되면 커밋, 예외(런타임)가 터지면
 * 롤백한다. 즉 decreaseWithLock()이 끝나는 시점(커밋 시점)에 비로소 비관적 락으로 잡았던
 * row lock이 실제로 풀린다 - 그 전까지는 다른 스레드의 findByIdForUpdate 호출이 대기한다.
 */
@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;

    @Transactional
    public void decreaseWithLock(Long stockId) throws InterruptedException {
        Stock stock = stockRepository.findByIdForUpdate(stockId);
        // 락을 잡은 상태에서 일부러 지연을 줘서, 동시에 호출된 다른 스레드가 대기하는 것을 재현한다.
        Thread.sleep(300);
        stock.decrease(1);
    }

    @Transactional
    public void decreaseWithoutLock(Long stockId) throws InterruptedException {
        Stock stock = stockRepository.findById(stockId).orElseThrow();
        Thread.sleep(300);
        stock.decrease(1);
    }
}
