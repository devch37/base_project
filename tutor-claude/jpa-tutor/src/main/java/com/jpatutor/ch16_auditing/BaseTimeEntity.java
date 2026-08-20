package com.jpatutor.ch16_auditing;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * [16장] Spring Data JPA Auditing - 생성/수정 시각을 자동으로 채워주는 공통 부모 클래스.
 *
 * - @EntityListeners(AuditingEntityListener.class): 이 리스너가 엔티티의 영속화/수정 이벤트를
 *   가로채서 @CreatedDate, @LastModifiedDate 필드를 자동으로 채워준다.
 * - 이 기능이 동작하려면 애플리케이션 어딘가에 @EnableJpaAuditing이 선언되어 있어야 한다
 *   (이 프로젝트에서는 JpaTutorApplication에 선언해두었다).
 * - @MappedSuperclass이므로 5장에서 배운 것처럼 별도 테이블을 만들지 않고, 상속받는 자식
 *   엔티티의 테이블에 created_date, last_modified_date 컬럼으로 합쳐진다.
 *
 * 실무에서는 여기에 createdBy/lastModifiedBy(등록자/수정자, @CreatedBy/@LastModifiedBy)까지
 * 함께 두고, AuditorAware<String> 빈을 등록해서 "현재 로그인한 사용자"를 자동으로 채우는
 * 패턴을 거의 표준처럼 사용한다.
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {

    @CreatedDate
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime lastModifiedDate;
}
