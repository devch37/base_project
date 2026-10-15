# 1단계 · 웹과 서버의 기초 (01~06)

| 장 | 한 줄 요약 |
|---|---|
| [01](01-web-basics/) | URL = scheme·host·port·path·query. **Origin = scheme+host+port**. HTTP 는 TCP 위의 텍스트 |
| [02](02-http-rest-json/) | GET(안전·멱등) vs POST. 4xx 는 내 잘못, 5xx 는 서버 사정. **fetch 는 404 에 throw 안 함** |
| [03](03-async-js/) | 동기 → 마이크로태스크 → 매크로태스크. 순서가 중요하면 Promise 체인으로 **한 줄 세우기** |
| [04](04-runtime-build-tools/) | 브라우저 vs Node. npm·Vite / Gradle·JAR. 설정은 밖으로(명령행 > 환경 변수 > yml). **브라우저에 비밀 금지** |
| [05](05-spring-structure/) | Controller(얇게) → Service → Repository. DI 로 **고객사 정책 Bean 교체**. ProblemDetail, Clock 주입 |
| [06](06-server-to-server-http/) | 타임아웃(연결·읽기), 오류 분류, **멱등할 때만 재시도**, 대체값을 숨기지 않기 |

## 치트시트
```text
상태 코드: 200 OK · 201 Created(+Location) · 400 모양 틀림 · 401 누구세요 · 403 권한 없음 · 404 없음(또는 숨김) · 422 업무 규칙 · 5xx 서버
같은 출처?: new URL(a).origin === new URL(b).origin
Spring 설정 덮어쓰기: java -jar app.jar --server.port=8081   /   SERVER_PORT=8081 java -jar app.jar
```
