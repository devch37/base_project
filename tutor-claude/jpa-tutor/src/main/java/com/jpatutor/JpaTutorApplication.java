package com.jpatutor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * 이 프로젝트는 "실행"보다는 "테스트로 학습"하는 프로젝트다.
 * 각 챕터 패키지(ch01_basic ~ ch16_auditing) 밑의 테스트 코드를 하나씩 실행하며
 * 콘솔에 찍히는 SQL(p6spy 로그)을 직접 눈으로 확인하는 것이 핵심 학습 방법이다.
 *
 * 예) ./gradlew test --tests "com.jpatutor.ch07_proxy_fetch.*"
 */
@EnableJpaAuditing // 16장(Auditing)에서 사용하는 @CreatedDate, @LastModifiedDate를 활성화한다.
@SpringBootApplication
public class JpaTutorApplication {

    public static void main(String[] args) {
        SpringApplication.run(JpaTutorApplication.class, args);
    }
}
