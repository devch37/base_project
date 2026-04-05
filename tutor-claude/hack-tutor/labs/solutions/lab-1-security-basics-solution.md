# Lab 1 (Solution). Spring Security 기본 설정

## 요약
- `SecurityFilterChain`으로 기본 정책을 명시한다.
- 메서드 레벨 인가를 적용한다.

## 예시 코드
```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.enable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/ping").permitAll()
        .anyRequest().authenticated()
      )
      .httpBasic(Customizer.withDefaults());

    return http.build();
  }
}
```

```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/admin/health")
public String adminHealth() {
  return "ok";
}
```
