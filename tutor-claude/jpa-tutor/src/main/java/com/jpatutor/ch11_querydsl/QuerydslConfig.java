package com.jpatutor.ch11_querydsl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * [11장] JPAQueryFactory는 QueryDSL로 JPQL을 만들어 실행하는 진입점이다.
 * EntityManager를 그대로 감싸서 사용하므로, 스프링이 관리하는 트랜잭션 범위 안에서
 * 안전하게 동작한다 (내부적으로 매 요청마다 새 EntityManager를 참조하는 게 아니라,
 * 스프링이 프록시로 주입해주는 EntityManager를 사용하기 때문에 싱글턴 빈으로 등록해도 안전하다).
 */
@Configuration
public class QuerydslConfig {

    @PersistenceContext
    private EntityManager em;

    @Bean
    public JPAQueryFactory jpaQueryFactory() {
        return new JPAQueryFactory(em);
    }
}
