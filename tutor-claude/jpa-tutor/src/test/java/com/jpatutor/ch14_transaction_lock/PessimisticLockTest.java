package com.jpatutor.ch14_transaction_lock;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * [14장] 비관적 락이 실제로 두 트랜잭션을 "직렬화(serialize)"시키는지 벽시계 시간(wall-clock time)으로
 * 확인한다. 각 서비스 메서드는 락을 잡은 채로 300ms 대기하도록 되어 있으므로:
 * - 락이 걸리면: 두 스레드가 순서대로 실행되어 총 소요시간이 대략 300ms * 2 = 600ms 이상.
 * - 락이 없으면: 두 스레드가 동시에 실행되어 총 소요시간이 대략 300ms 근처.
 *
 * @SpringBootTest를 사용해 각 스레드의 서비스 호출이 진짜로 별도 트랜잭션(별도 커넥션)으로
 * 커밋되게 만든다 (@DataJpaTest/@Transactional로 테스트를 감싸면 테스트 전체가 하나의
 * 트랜잭션이 되어버려서 "여러 트랜잭션의 동시성"을 재현할 수 없다).
 */
@SpringBootTest
class PessimisticLockTest {

    @Autowired
    StockRepository stockRepository;

    @Autowired
    StockService stockService;

    @Test
    @DisplayName("비관적 락(PESSIMISTIC_WRITE): 두 트랜잭션이 같은 row를 두고 직렬화되어 순차 실행된다")
    void pessimisticLockSerializesConcurrentAccess() throws InterruptedException {
        Stock stock = stockRepository.saveAndFlush(new Stock(10));

        long elapsed = runConcurrentlyAndMeasure(
                () -> stockService.decreaseWithLock(stock.getId()));

        // 300ms 두 번이 직렬로 실행되므로 최소 550ms 이상 걸려야 한다 (여유 마진 포함).
        assertThat(elapsed).isGreaterThanOrEqualTo(550);

        Stock reloaded = stockRepository.findById(stock.getId()).orElseThrow();
        assertThat(reloaded.getQuantity()).isEqualTo(8); // 10 - 1 - 1, 두 감소 모두 정상 반영
    }

    @Test
    @DisplayName("락이 없으면 두 트랜잭션이 동시에 실행되어 훨씬 빨리 끝난다 (직렬화되지 않음)")
    void withoutLockRunsConcurrently() throws InterruptedException {
        Stock stock = stockRepository.saveAndFlush(new Stock(10));

        long elapsed = runConcurrentlyAndMeasure(
                () -> stockService.decreaseWithoutLock(stock.getId()));

        // 락이 없으므로 두 스레드가 병렬로 300ms 슬립 -> 전체 소요시간은 550ms보다 훨씬 짧다.
        assertThat(elapsed).isLessThan(550);
    }

    private long runConcurrentlyAndMeasure(ThrowingRunnable task) throws InterruptedException {
        CountDownLatch startLatch = new CountDownLatch(2);
        CountDownLatch doneLatch = new CountDownLatch(2);

        Runnable wrapped = () -> {
            try {
                startLatch.countDown();
                startLatch.await(); // 두 스레드가 최대한 동시에 출발하도록 맞춘다.
                task.run();
            } catch (Exception e) {
                throw new RuntimeException(e);
            } finally {
                doneLatch.countDown();
            }
        };

        long start = System.currentTimeMillis();
        new Thread(wrapped).start();
        new Thread(wrapped).start();
        doneLatch.await(5, TimeUnit.SECONDS);
        return System.currentTimeMillis() - start;
    }

    @FunctionalInterface
    private interface ThrowingRunnable {
        void run() throws Exception;
    }
}
