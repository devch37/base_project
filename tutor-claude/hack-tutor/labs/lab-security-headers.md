# Lab 3. 보안 헤더 설정

## 목표
- 기본 보안 헤더를 설정한다.
- 브라우저 측 보호 장치를 활성화한다.

## 과제/정답
- `labs/assignments/lab-3-security-headers-assignment.md`
- `labs/solutions/lab-3-security-headers-solution.md`

## 주석
헤더는 간단하지만 효과적인 방어 수단이다. 다만 정책을 너무 강하게 설정하면 정상 기능이 깨질 수 있으므로 **점진적으로 적용**한다.

## 예시 코드 (Spring Security)
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

## 체크리스트
- CSP가 실제 리소스 로딩과 충돌하지 않는가
- iframe 사용 여부를 확인했는가
- 필요하지 않은 브라우저 권한을 차단했는가
