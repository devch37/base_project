package be.com.springbootclaude.config

import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaAuditing

/**
 * JpaConfig: JPA Auditing 활성화
 *
 * 학습 포인트:
 * - @EnableJpaAuditing: BaseEntity의 @CreatedDate, @LastModifiedDate가 자동으로 동작하도록 합니다.
 * - @Configuration: Spring이 이 클래스를 설정 클래스로 인식합니다.
 *
 * 실무 팁:
 * - JPA Auditing을 사용하면 생성/수정 시간을 수동으로 관리하지 않아도 됩니다.
 * - AuditorAware를 구현하면 createdBy, modifiedBy (누가 생성/수정했는지)도 자동 기록할 수 있습니다.
 */
@Configuration
@EnableJpaAuditing
class JpaConfig
