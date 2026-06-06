package com.tutor.library._3_clean_architecture.infrastructure.persistence;

import com.tutor.library._3_clean_architecture.domain.model.Member;
import jakarta.persistence.*;

@Entity
@Table(name = "members")
public class MemberJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private int borrowLimit;

    protected MemberJpaEntity() {}

    public static MemberJpaEntity fromDomain(Member member) {
        MemberJpaEntity entity = new MemberJpaEntity();
        entity.id = member.getId();
        entity.name = member.getName();
        entity.email = member.getEmail();
        entity.borrowLimit = member.getBorrowLimit();
        return entity;
    }

    public Member toDomain() {
        return Member.reconstitute(id, name, email, borrowLimit);
    }

    public Long getId() { return id; }
}
