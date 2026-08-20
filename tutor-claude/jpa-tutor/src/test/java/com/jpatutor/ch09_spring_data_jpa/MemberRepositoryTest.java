package com.jpatutor.ch09_spring_data_jpa;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class MemberRepositoryTest {

    @Autowired
    MemberRepository memberRepository;

    @Test
    @DisplayName("쿼리 메서드: 메서드 이름만으로 조건절이 자동 생성된다")
    void queryMethods() {
        memberRepository.save(new Member("홍길동", 20));
        memberRepository.save(new Member("김철수", 30));

        assertThat(memberRepository.findByName("홍길동")).isPresent();
        assertThat(memberRepository.existsByName("김철수")).isTrue();
        assertThat(memberRepository.existsByName("없는사람")).isFalse();

        List<Member> over25 = memberRepository.findByAgeGreaterThanOrderByNameAsc(25);
        assertThat(over25).hasSize(1);
        assertThat(over25.get(0).getName()).isEqualTo("김철수");
    }

    @Test
    @DisplayName("Pageable을 넘기면 페이징 + 정렬 + 전체 개수 카운트까지 자동으로 처리된다")
    void paging() {
        for (int i = 1; i <= 15; i++) {
            memberRepository.save(new Member("member" + i, 20 + i));
        }

        // 나이 내림차순으로 정렬해서 0번째 페이지, 페이지당 5건씩 조회
        Page<Member> page = memberRepository.findByAgeGreaterThan(
                20, PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "age")));

        assertThat(page.getContent()).hasSize(5);
        assertThat(page.getTotalElements()).isEqualTo(15); // count 쿼리로 계산된 전체 개수
        assertThat(page.getTotalPages()).isEqualTo(3);
        assertThat(page.getContent().get(0).getAge()).isEqualTo(35); // 나이 내림차순 첫 번째
    }
}
