package com.tutor.library._3_clean_architecture.infrastructure.persistence;

import com.tutor.library._3_clean_architecture.domain.model.Member;
import com.tutor.library._3_clean_architecture.domain.port.out.MemberRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class MemberRepositoryAdapter implements MemberRepositoryPort {

    private final MemberJpaRepository memberJpaRepository;

    public MemberRepositoryAdapter(MemberJpaRepository memberJpaRepository) {
        this.memberJpaRepository = memberJpaRepository;
    }

    @Override
    public Member save(Member member) {
        MemberJpaEntity entity = MemberJpaEntity.fromDomain(member);
        MemberJpaEntity savedEntity = memberJpaRepository.save(entity);
        return savedEntity.toDomain();
    }

    @Override
    public Optional<Member> findById(Long id) {
        return memberJpaRepository.findById(id)
                .map(MemberJpaEntity::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return memberJpaRepository.existsByEmail(email);
    }

    @Override
    public int countActiveLoansByMember(Long memberId) {
        return memberJpaRepository.countActiveLoansByMember(memberId.toString());
    }
}
