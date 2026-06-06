package com.tutor.library._3_clean_architecture.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MemberJpaRepository extends JpaRepository<MemberJpaEntity, Long> {

    boolean existsByEmail(String email);

    Optional<MemberJpaEntity> findByEmail(String email);

    @Query("SELECT COUNT(b) FROM BookJpaEntity b WHERE b.borrowedByMemberId = :memberId AND b.status = 'BORROWED'")
    int countActiveLoansByMember(@Param("memberId") String memberId);
}
