package com.jpatutor.ch14_transaction_lock;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class OptimisticLockTest {

    @Autowired
    EntityManager em;

    @Autowired
    ProductRepository productRepository;

    @Test
    @DisplayName("내가 읽은 버전(version=0)이 그 사이 다른 트랜잭션에 의해 바뀌면(version=1), 내 UPDATE는 실패한다")
    @Transactional
    void staleVersionCausesOptimisticLockException() {
        Product product = productRepository.save(new Product("한정판 텀블러", 10));
        em.flush(); // version=0으로 INSERT
        em.clear();

        Product myView = productRepository.findById(product.getId()).orElseThrow(); // version=0으로 읽음

        // "다른 트랜잭션이 먼저 커밋해서 재고를 줄이고 버전을 올렸다"는 상황을 네이티브 쿼리로 흉내낸다.
        // (실제로는 별도 스레드/트랜잭션에서 벌어지는 일이지만, 여기서는 결정적인 테스트를 위해
        //  DB 상태만 직접 바꿔서 "이미 누군가 커밋한 상태"를 재현한다)
        em.createNativeQuery("update ch14_product set stock = 5, version = 1 where id = :id")
                .setParameter("id", product.getId())
                .executeUpdate();

        // 내가 들고 있던 myView는 여전히 version=0인 스냅샷이다. 여기에 변경을 가하고 flush하면,
        // 하이버네이트는 "update product set ... where id=? and version=0"을 실행하는데
        // 실제 DB에는 이미 version=1이라 조건에 맞는 row가 없어(0 rows affected) 예외가 터진다.
        myView.decreaseStock(1);

        assertThatThrownBy(() -> em.flush())
                .isInstanceOf(ObjectOptimisticLockingFailureException.class);
    }
}
