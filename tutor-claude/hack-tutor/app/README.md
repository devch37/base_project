# HackTutor Spring Boot App

로컬 보안 실습을 위한 최소 Spring Boot 앱입니다.

## 실행
- `./gradlew bootRun`

## 엔드포인트
- `GET /ping` (인증 불필요)
- `GET /admin/health` (ADMIN 권한 필요)
- `POST /users` (DTO 검증 적용)

## 주의
- 실제 서비스가 아니라 로컬 실습 전용입니다.
