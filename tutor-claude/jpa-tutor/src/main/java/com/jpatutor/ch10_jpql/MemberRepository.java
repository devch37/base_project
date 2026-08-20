package com.jpatutor.ch10_jpql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * [10장] JPQL(Java Persistence Query Language) - 객체(엔티티)를 대상으로 쿼리를 짜는 언어.
 * 테이블이 아니라 "엔티티와 필드 이름"을 기준으로 쿼리를 작성하고, 하이버네이트가 이걸 실제
 * SQL로 번역해서 실행해준다. SQL과 문법이 비슷하지만 FROM 절에 테이블 대신 엔티티가 온다.
 */
public interface MemberRepository extends JpaRepository<Member, Long> {

    // 기본 JPQL: 엔티티 이름(Member)과 필드 이름(age)을 사용한다.
    @Query("select m from Member m where m.age >= :age")
    List<Member> findByAgeGreaterThanEqual(@Param("age") int age);

    // 페치 조인(fetch join): "join fetch"라고 쓰면 연관된 엔티티(team)를 프록시가 아니라
    // 실제 데이터까지 함께 SELECT해서 한 번에 채워 넣는다. LAZY로 설정되어 있어도 페치 조인을
    // 쓰면 그 쿼리에 한해서는 즉시 로딩처럼 동작한다.
    // 이게 없으면(그냥 join만 쓰면) team은 프록시 상태로 남고, 각 member마다 team.getName()을
    // 호출할 때마다 추가 SELECT가 발생하는 N+1 문제가 생긴다 (12장에서 자세히 재현한다).
    @Query("select m from Member m join fetch m.team t")
    List<Member> findAllWithTeamFetchJoin();

    // DTO 프로젝션(constructor expression): 엔티티 전체가 아니라 필요한 컬럼만 뽑아서
    // 바로 DTO 객체로 조립해 반환한다. 엔티티 프록시/영속성 컨텍스트 관리 오버헤드가 없어서
    // 화면에 뿌릴 데이터만 필요한 조회(읽기 전용 API)에서는 이 방식이 성능상 유리하다.
    @Query("select new com.jpatutor.ch10_jpql.MemberTeamDto(m.id, m.name, t.name) " +
            "from Member m join m.team t")
    List<MemberTeamDto> findAllAsDto();
}
