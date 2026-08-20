package com.jpatutor.ch13_bulk;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class BulkOperationTest {

    @Autowired
    EntityManager em;

    @Autowired
    MemberRepository memberRepository;

    @Test
    @DisplayName("clearAutomatically 없이 벌크 update를 하면, 영속성 컨텍스트의 캐시된 엔티티는 DB와 어긋난다")
    @Transactional
    void bulkUpdateWithoutClearCausesStaleEntity() {
        Member member = new Member("홍길동", 20);
        memberRepository.save(member); // 영속성 컨텍스트(1차 캐시)에 age=20인 상태로 올라간다.

        memberRepository.bulkIncreaseAgeWithoutClear(0); // DB에서는 age가 21로 바뀐다.

        // 하지만 1차 캐시에는 여전히 age=20인 예전 객체가 남아있고, find()는 DB를 다시 조회하지
        // 않고 캐시를 그대로 반환하므로 "실제로는 21인데 20으로 보이는" 불일치가 발생한다.
        Member stillCached = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(stillCached.getAge()).isEqualTo(20); // 벌크 연산 전 값 그대로 (버그 재현)

        // 네이티브 쿼리로 실제 DB 값을 확인해보면 21로 정확히 반영되어 있다.
        Integer realAgeInDb = (Integer) em.createNativeQuery(
                "select age from ch13_member where id = " + member.getId()).getSingleResult();
        assertThat(realAgeInDb).isEqualTo(21);
    }

    @Test
    @DisplayName("clearAutomatically=true면 벌크 연산 직후 영속성 컨텍스트가 비워져서 최신 값을 다시 조회한다")
    @Transactional
    void bulkUpdateWithClearIsConsistent() {
        Member member = new Member("김철수", 20);
        memberRepository.save(member);

        memberRepository.bulkIncreaseAge(0);

        // clearAutomatically=true 덕분에 영속성 컨텍스트가 비워졌고, 아래 findById는
        // 1차 캐시에 아무것도 없으므로 DB에서 다시 SELECT해서 최신 값(21)을 가져온다.
        Member reloaded = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(reloaded.getAge()).isEqualTo(21);
    }

    @Test
    @DisplayName("벌크 delete: 조건에 맞는 로우를 한 번의 DELETE 문으로 모두 제거한다")
    @Transactional
    void bulkDelete() {
        memberRepository.save(new Member("아기", 2));
        memberRepository.save(new Member("성인", 30));

        int deletedCount = memberRepository.bulkDeleteYoungerThan(18);

        assertThat(deletedCount).isEqualTo(1);
        assertThat(memberRepository.findAll()).extracting(Member::getName).containsExactly("성인");
    }
}
