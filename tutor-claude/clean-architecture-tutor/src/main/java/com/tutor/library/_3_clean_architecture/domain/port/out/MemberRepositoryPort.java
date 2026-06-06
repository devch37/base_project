package com.tutor.library._3_clean_architecture.domain.port.out;

import com.tutor.library._3_clean_architecture.domain.model.Member;

import java.util.Optional;

/**
 * 아웃고잉 포트 - 회원 저장소
 */
public interface MemberRepositoryPort {

    Member save(Member member);

    Optional<Member> findById(Long id);

    boolean existsByEmail(String email);

    int countActiveLoansByMember(Long memberId);
}
