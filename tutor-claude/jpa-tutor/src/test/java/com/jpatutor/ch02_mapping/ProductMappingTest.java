package com.jpatutor.ch02_mapping;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ProductMappingTest {

    @Autowired
    EntityManager em;

    @Test
    @DisplayName("Enum은 STRING으로 저장되어 사람이 읽을 수 있는 값으로 DB에 들어간다")
    @Transactional
    void enumStoredAsString() {
        Product product = new Product("자바 ORM 표준 프로그래밍", ProductCategory.BOOK,
                new BigDecimal("35000"), "JPA를 다루는 대표적인 책");
        em.persist(product);
        em.flush();
        em.clear();

        // 콘솔의 p6spy 로그를 보면 insert 문의 category 컬럼 값이 숫자(0,1,2..)가 아니라
        // 'BOOK'이라는 문자열로 나가는 것을 확인할 수 있다.
        Object[] row = (Object[]) em.createNativeQuery(
                        "select category, product_name from ch02_product where id = ?1")
                .setParameter(1, product.getId())
                .getSingleResult();

        assertThat(row[0]).isEqualTo("BOOK");
        assertThat(row[1]).isEqualTo("자바 ORM 표준 프로그래밍");
    }

    @Test
    @DisplayName("@Transient 필드는 DB에 저장되지 않고, 다시 조회하면 초기값(null)으로 돌아온다")
    @Transactional
    void transientFieldIsNotPersisted() {
        Product product = new Product("노트북", ProductCategory.ELECTRONICS,
                new BigDecimal("1500000"), "고성능 노트북");
        product.markDiscount("10% 할인"); // 메모리 상에서만 존재하는 값

        em.persist(product);
        em.flush();
        em.clear(); // 영속성 컨텍스트를 비워서 DB에서 진짜로 다시 읽어오게 만든다.

        Product reloaded = em.find(Product.class, product.getId());

        // discountBadge는 컬럼 자체가 없으므로 DB에서 다시 읽어오면 당연히 null이다.
        assertThat(reloaded.getDiscountBadge()).isNull();
        assertThat(reloaded.getName()).isEqualTo("노트북");
    }
}
