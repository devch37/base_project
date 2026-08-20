package com.jpatutor.ch09_spring_data_jpa;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * [9장] Spring Data JPA는 인터페이스만 정의하면 구현체를 런타임에 자동으로 만들어준다
 * (프록시 기반, org.springframework.data.jpa.repository.support.SimpleJpaRepository가 그 실체다).
 *
 * JpaRepository<Member, Long>을 상속하는 것만으로 save, findById, findAll, delete,
 * count 같은 기본 CRUD와 페이징 기능이 전부 공짜로 생긴다.
 *
 * 메서드 이름만으로 쿼리를 만드는 "쿼리 메서드(Query Method)" 규칙:
 * - findBy + 필드명: WHERE 조건
 * - And/Or로 조건 연결
 * - GreaterThan, LessThan, Between, Like, In 등 비교 연산자
 * - OrderBy + 필드명 + Asc/Desc: 정렬
 *
 * 장점은 SQL/JPQL을 안 짜도 된다는 것이지만, 조건이 3~4개 이상으로 복잡해지면 메서드 이름이
 * 감당 안 될 정도로 길어진다. 그 경계를 넘어서면 10장(JPQL)이나 11장(QueryDSL)으로 넘어가야 한다.
 */
public interface MemberRepository extends JpaRepository<Member, Long> {

    // "이름이 정확히 일치하는 회원을 찾는다" -> select m from Member m where m.name = :name
    Optional<Member> findByName(String name);

    // 나이가 age 초과인 회원들을 이름 오름차순으로 정렬해서 조회
    List<Member> findByAgeGreaterThanOrderByNameAsc(int age);

    // 이름 + 나이 조건을 AND로 결합
    List<Member> findByNameAndAge(String name, int age);

    // count(*) > 0 여부만 확인하는 EXISTS 쿼리 (엔티티 전체를 안 가져오므로 존재 여부 체크에 효율적)
    boolean existsByName(String name);

    // Pageable을 받아서 Page<Member>로 반환하면, Spring Data JPA가 자동으로
    // "본 데이터 조회 쿼리" + "전체 개수를 세는 count 쿼리" 두 개를 실행해서 페이징 메타데이터
    // (전체 페이지 수, 전체 개수 등)까지 채워준다.
    Page<Member> findByAgeGreaterThan(int age, Pageable pageable);
}
