# 05. 인증/인가 심화 (Spring Security)

## 목표
- 인증(Authentication)과 인가(Authorization)를 명확히 구분한다.
- Spring Security의 기본 흐름을 이해한다.

## 핵심 개념
- 세션 기반 vs 토큰 기반 인증
- 권한 모델(ROLE, 권한 기반, ABAC 개념)
- 최소 권한 원칙
- CSRF 개념과 방어 전략

## 설명(주석)
실서비스 사고의 상당수는 인증/인가 실수에서 발생한다. Spring Security는 기본이 강력하지만 **설정 실수**가 가장 흔한 위험 요소다.

## 체크리스트
- URL 레벨과 메서드 레벨 접근 제어를 일관되게 사용하는가
- 권한 실패 시 응답이 과도한 정보를 노출하지 않는가
- CSRF 정책을 요구사항에 맞게 유지하는가

## Java/Spring 체크리스트
- `resources/checklists/05_authn_authz_checklist.md`

## 실습 연결
- `labs/lab-spring-security-basics.md`
