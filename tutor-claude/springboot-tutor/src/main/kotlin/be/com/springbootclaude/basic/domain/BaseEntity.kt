package be.com.springbootclaude.basic.domain

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

/**
 * BaseEntity: JPA Auditing을 활용한 공통 필드
 *
 * 학습 포인트:
 * 1. @MappedSuperclass: 이 클래스는 테이블로 생성되지 않고, 상속받는 엔티티에 필드만 추가됩니다.
 * 2. @EntityListeners: JPA Auditing을 활성화하여 createdAt, updatedAt을 자동으로 관리합니다.
 * 3. @CreatedDate, @LastModifiedDate: Spring Data JPA가 자동으로 시간을 기록합니다.
 *
 * 실무 팁:
 * - 모든 엔티티에 생성/수정 시간을 추가하면 디버깅과 감사(Audit)에 유용합니다.
 * - updatable = false를 사용하면 createdAt이 실수로 수정되는 것을 방지합니다.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class BaseEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @CreatedDate
    @Column(nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @LastModifiedDate
    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
