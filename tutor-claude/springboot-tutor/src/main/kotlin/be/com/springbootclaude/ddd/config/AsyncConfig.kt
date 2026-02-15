package be.com.springbootclaude.ddd.config

import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableAsync

/**
 * 비동기 처리 설정
 *
 * @EnableAsync: 비동기 이벤트 처리를 위한 설정
 * - OrderEventHandler의 @Async 메서드 활성화
 * - 이벤트 핸들러가 비동기로 실행됨
 */
@Configuration
@EnableAsync
class AsyncConfig
