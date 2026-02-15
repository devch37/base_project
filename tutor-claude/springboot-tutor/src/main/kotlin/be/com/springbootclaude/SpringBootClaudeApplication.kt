package be.com.springbootclaude

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

/**
 * Smart Article Platform - Spring Boot 고급 기능 학습 프로젝트
 *
 * 이 애플리케이션은 4년차 백엔드 개발자가 Spring Boot의 고급 기능을
 * 실무 중심으로 학습할 수 있도록 설계되었습니다.
 *
 * Phase 1 (basic 패키지):
 * - Exception Handling: RFC 7807 Problem Details 패턴
 * - AOP: 로깅, 감사, 재시도 메커니즘
 * - Custom Annotations & Validators: 비즈니스 규칙의 선언적 표현
 *
 * Phase 2 (ddd 패키지):
 * - Domain-Driven Design 패턴 실습
 * - Aggregate Root, Entity, Value Object
 * - Domain Service, Repository, Factory
 * - Domain Events
 *
 * @EnableAspectJAutoProxy는 @SpringBootApplication에 포함되어 있습니다.
 */
@SpringBootApplication(scanBasePackages = ["be.com.springbootclaude"])
class SpringBootClaudeApplication

fun main(args: Array<String>) {
    runApplication<SpringBootClaudeApplication>(*args)
}
