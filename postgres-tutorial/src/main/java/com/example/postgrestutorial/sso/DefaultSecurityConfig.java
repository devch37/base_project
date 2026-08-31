package com.example.postgrestutorial.sso;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * SSO 프로필을 사용하지 않을 때 적용되는 학습용 보안 설정입니다.
 *
 * <p>Spring Security 의존성을 추가하면 기본적으로 모든 요청이 잠기기 때문에,
 * 기존 PostgreSQL 튜토리얼을 이전처럼 사용할 수 있도록 요청을 모두 허용합니다.
 * 운영 환경에서 이 설정을 그대로 사용하는 용도는 아닙니다.</p>
 */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(
        name = "tutorial.sso.enabled",
        havingValue = "false",
        matchIfMissing = true
)
public class DefaultSecurityConfig {

    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                // SSO를 켜지 않은 기본 모드에서는 기존 API를 인증 없이 실습할 수 있습니다.
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll())
                // 기존 curl POST 예제를 유지하기 위한 설정입니다. SSO 모드에서는 CSRF를 끄지 않습니다.
                .csrf(AbstractHttpConfigurer::disable);
        return http.build();
    }
}
