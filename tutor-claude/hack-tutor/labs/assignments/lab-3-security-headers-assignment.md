# Lab 3 (Assignment). 보안 헤더 설정

## 목표
- 기본 보안 헤더를 설정한다.
- 브라우저 측 방어를 활성화한다.

## 과제
- `Content-Security-Policy`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`를 설정한다.
- 정책이 실제 기능을 깨지 않는지 확인한다.

## 힌트
- Spring Security의 `headers` DSL 사용

## 체크리스트
- CSP가 리소스 로딩을 막지 않는가
- iframe 사용 여부를 고려했는가
