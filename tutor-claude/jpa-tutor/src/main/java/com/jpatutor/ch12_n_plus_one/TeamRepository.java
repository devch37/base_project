package com.jpatutor.ch12_n_plus_one;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {

    // 아무 힌트도 없는 기본 findAll()로 팀만 조회하면(members는 LAZY), 나중에 각 team의
    // members를 순회할 때마다 매번 추가 SELECT가 나가서 "1(팀 조회) + N(각 팀의 멤버 조회)" 문제가 생긴다.

    // [해결책 1] 페치 조인. 컬렉션을 페치 조인할 때는 반드시 distinct를 붙여야 한다.
    // team과 member를 INNER/LEFT JOIN하면 team 하나에 member가 여러 개면 그만큼 로우가
    // 뻥튀기되어(카티션 곱) 같은 team 객체가 중복으로 리스트에 담기기 때문이다.
    // (JPQL의 distinct는 애플리케이션 레벨에서 중복 엔티티를 걸러주는 역할까지 겸한다 - 최신
    // 하이버네이트는 SQL에 DISTINCT를 안 붙이고도 이 중복 제거를 처리해준다)
    @Query("select distinct t from Team t join fetch t.members")
    List<Team> findAllFetchJoin();

    // [해결책 2] @EntityGraph. "이 쿼리를 실행할 때 members 연관관계까지 함께 로딩해줘"라고
    // 선언적으로 힌트를 주는 방식. 내부적으로는 페치 조인과 거의 동일하게 동작하지만,
    // JPQL을 직접 안 써도 되고 쿼리 메서드/기본 메서드에도 붙일 수 있어서 더 간결하다.
    @EntityGraph(attributePaths = "members")
    @Query("select t from Team t")
    List<Team> findAllEntityGraph();
}
