# Lab 1. Spring Security 기본 설정

## 목표
- Spring Security의 기본 흐름을 이해한다.
- URL 및 메서드 레벨 인가를 적용한다.

## 과제/정답
- `labs/assignments/lab-1-security-basics-assignment.md`
- `labs/solutions/lab-1-security-basics-solution.md`

## 주석
이 실습은 **방어 설정**을 다룬다. 실제 서비스가 아니라 로컬 앱에만 적용한다.

## 단계
1. 보안 설정 클래스 생성
- `SecurityFilterChain` 빈을 등록한다.
- 기본 정책을 명시적으로 작성한다.

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

2. 메서드 레벨 인가 적용
```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/admin/health")
public String adminHealth() {
  return "ok";
}
```

3. 테스트 포인트
- `/ping`은 인증 없이 접근 가능
- `/admin/health`는 관리자만 접근 가능

## 체크리스트
- 인증/인가 규칙이 분리되어 있는가
- URL 레벨과 메서드 레벨 규칙이 충돌하지 않는가
- 기본 정책을 명시적으로 선언했는가
