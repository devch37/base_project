# Lab 1 (Assignment). Spring Security 기본 설정

## 목표
- 기본 보안 정책을 명시한다.
- URL 및 메서드 레벨 인가를 적용한다.

## 과제
- `SecurityFilterChain`을 등록한다.
- `/ping`은 익명 접근 허용, 나머지는 인증 필요로 설정한다.
- 메서드 레벨 인가를 적용해 `/admin/health`에 ADMIN 권한을 요구한다.

## 힌트
- `@EnableMethodSecurity`
- `@PreAuthorize("hasRole('ADMIN')")`

## 체크리스트
- 기본 정책이 allow-all이 아닌가
- URL 레벨과 메서드 레벨 규칙이 충돌하지 않는가
