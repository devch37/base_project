# 02. 네트워크 체크리스트 (Java/Spring)

- 애플리케이션이 노출하는 포트/프로토콜을 문서화한다.
- 로드밸런서/프록시 뒤에서 TLS 종료 지점을 확인한다.
- 쿠키에 `HttpOnly`, `Secure`, `SameSite` 속성을 설정한다.
- `X-Forwarded-*` 헤더 신뢰 범위를 제한한다.
