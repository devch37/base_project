# Lab 3 (Solution). 보안 헤더 설정

## 요약
- Spring Security의 headers DSL로 기본 헤더를 설정한다.

## 예시 코드
```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
  http
    .headers(headers -> headers
      .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'")
      )
      .referrerPolicy(ref -> ref.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
      .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
      .permissionsPolicy(perm -> perm.policy("geolocation=(), microphone=(), camera=()"))
    );
  return http.build();
}
```
