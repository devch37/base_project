package com.jpatutor.ch13_bulk;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberRepository extends JpaRepository<Member, Long> {

    /**
     * [13장] 벌크 연산: 조건에 맞는 모든 로우를 "UPDATE 문 한 방"으로 처리한다.
     * 대상이 100만 건이어도 엔티티를 하나하나 조회해서 setter로 바꾸고 flush하는 것보다
     * 압도적으로 빠르다 (엔티티 로딩/변경 감지 오버헤드가 전혀 없다).
     *
     * 하지만 대가가 있다: 벌크 연산은 영속성 컨텍스트를 완전히 무시하고 DB에 SQL을 직접
     * 실행하기 때문에, 이미 영속성 컨텍스트에 올라와 있는(1차 캐시에 있는) 엔티티들은
     * 이 변경 사항을 전혀 모른다! DB에는 반영됐지만 메모리 상의 엔티티는 예전 값 그대로다.
     *
     * clearAutomatically = true를 주면, Spring Data JPA가 이 메서드 실행 직후
     * 영속성 컨텍스트를 자동으로 clear()해줘서 이런 불일치를 방지해준다.
     * (clearAutomatically 없이 쓰면 반드시 실행 직후 em.clear()를 직접 호출해야 한다)
     */
    @Modifying(clearAutomatically = true)
    @Query("update Member m set m.age = m.age + 1 where m.age >= :minAge")
    int bulkIncreaseAge(@Param("minAge") int minAge);

    // 비교를 위해 일부러 clearAutomatically를 안 준 버전 (영속성 컨텍스트 불일치를 재현하기 위함).
    @Modifying
    @Query("update Member m set m.age = m.age + 1 where m.age >= :minAge")
    int bulkIncreaseAgeWithoutClear(@Param("minAge") int minAge);

    @Modifying(clearAutomatically = true)
    @Query("delete from Member m where m.age < :maxAge")
    int bulkDeleteYoungerThan(@Param("maxAge") int maxAge);
}
