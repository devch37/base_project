package com.jpatutor.ch14_transaction_lock;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockRepository extends JpaRepository<Stock, Long> {

    /**
     * [14장] 비관적 락 - "충돌이 자주 일어날 것"이라 비관(pessimistic)하고, 아예 DB row 자체에
     * 락을 걸어서 다른 트랜잭션이 같은 row를 건드리지 못하게 막아버린다.
     *
     * @Lock(LockModeType.PESSIMISTIC_WRITE)를 붙이면 하이버네이트가 이 쿼리를
     * "SELECT ... FOR UPDATE" 형태로 실행한다. 이 SQL을 실행한 트랜잭션이 커밋(또는 롤백)해서
     * 락을 반납하기 전까지, 같은 row를 SELECT ... FOR UPDATE로 읽으려는 다른 트랜잭션은
     * 그 자리에서 "대기(block)"한다. 그래서 두 트랜잭션이 동시에 값을 읽고 계산하는
     * 경쟁 상태(race condition) 자체가 원천 차단된다.
     *
     * 대가: 락을 잡은 트랜잭션이 끝날 때까지 다른 트랜잭션들이 멈춰서 기다리므로, 충돌이
     * 잦은 자원(인기 상품 재고 차감 등)에는 필요하지만, 남용하면 전체 처리량(throughput)이
     * 크게 떨어지고 데드락 위험도 커진다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Stock s where s.id = :id")
    Stock findByIdForUpdate(@Param("id") Long id);
}
