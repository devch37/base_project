# chat-tutor — 화면 공유 상담 솔루션을 만들며 배우는 실시간 웹

웹 통신 기초부터 STOMP·JWT·DOM 화면 동기화·Hazelcast 다중 서버까지,
**하나의 실제 프로젝트(화면 공유 상담)** 를 24개 장에 걸쳐 쌓아 올리며 배운다.

```
 고객 브라우저 (보험 가입 페이지 + SDK)                     상담사 콘솔
 ┌──────────────────────────────┐                        ┌──────────────────────────────┐
 │ 이름 [홍길동      ]             │   DOM 스냅샷 + 변경분     │ ┌──────────────────────────┐ │
 │ 주민번호 [••••••-•••••••]      │ ─────────────────────▶ │ │ (고객 화면이 iframe 에 복제) │ │
 │ [기본형] [표준형] [고급형]       │       cobrowse-server  │ │  ● 고객 커서               │ │
 │                    ┌────────┐ │ ◀───────────────────── │ └──────────────────────────┘ │
 │                    │상담 위젯 │ │   클릭·입력 명령(동의 시)  │  채팅 · 재동기화 · 상담 종료     │
 └──────────────────────────────┘                        └──────────────────────────────┘
```

## 무엇을 배우나

| 단계 | 장 | 주제 |
|---|---|---|
| [1-basic](1-basic/) | 01~06 | URL·Origin, HTTP·REST·fetch, 비동기 JS·이벤트 루프, Node/npm/Vite·Gradle/JAR·환경 변수, Spring 구조·DI·정책 Bean 교체, 서버 간 호출·타임아웃·재시도 |
| [2-intermediate](2-intermediate/) | 07~12 | WebSocket, STOMP·Pub/Sub, heartbeat·재연결, 인증·인가, JWT, STOMP 인가·토큰 만료 |
| [3-advanced](3-advanced/) | 13~19 | DOM·이벤트, 바이트·base64·압축, 스냅샷·MutationObserver, iframe·canvas·overlay, 원격 제어·에코 방지, 조각 전송, 순서·손실·재동기화 |
| [4-practical](4-practical/) | 20~24 | SDK 설계, TLS·프록시·Upgrade, CORS vs Origin·XSS·CSP·마스킹, Hazelcast 클러스터, 장애 복구·캡스톤 |

👉 **[LEARNING_GUIDE.md](LEARNING_GUIDE.md)** — 처음 받은 주제 목록(A~H)을 "프로젝트 이해에 필요한 순서"로 재배치한 커리큘럼, 추가한 필수 개념(★), 뒤로 미룬 고급 주제
👉 **[QUICK_START.md](QUICK_START.md)** — 설치와 실행
👉 **[docs/00-big-picture.md](docs/00-big-picture.md)** — 전체 구조 한 장 요약

## 폴더 지도

```
chat-tutor/
├─ README.md · LEARNING_GUIDE.md · QUICK_START.md · PROGRESS.md · CLAUDE.md(튜터 모드 규칙)
├─ docs/                 00-big-picture, GLOSSARY, TROUBLESHOOTING, ADVANCED_TOPICS
├─ 1-basic/ … 4-practical/   장별 README(개념) + Node 실습 스크립트
├─ server/               Spring Boot 모듈 (Gradle 멀티 프로젝트, Java 21)
│   ├─ spring-basics     05~06  REST·DI·정책 교체·서버 간 호출
│   ├─ raw-websocket     07     STOMP 없는 WebSocket
│   ├─ stomp-chat        08~09  STOMP 채팅·heartbeat
│   ├─ secure-chat       10~12  JWT·인터셉터·접근 제어·만료
│   └─ cobrowse-server   13~24  최종 서버 (화면 중계·원격 명령·Hazelcast)
├─ web/
│   ├─ sdk/              화면 공유 SDK (TypeScript) + 단위 테스트
│   ├─ apps/customer     고객사 사이트 예제 (보험 가입 + SDK)
│   ├─ apps/agent        상담사 콘솔
│   ├─ labs/             장별 브라우저 실습 페이지
│   ├─ tenant-backend/   "고객사 백엔드" 흉내 (API 키 보관, 토큰 중계)
│   └─ e2e/              Playwright 실제 브라우저 테스트 (단일 서버 + 클러스터 장애)
└─ exercises/            연습문제 9개 (src: 직접 풀기 / solutions: 해답 / test)
```

## 검증 상태 (작성 시점 2026-10-09, macOS · Java 21 · Node 23)

| 범위 | 결과 |
|---|---|
| 서버 테스트 `./gradlew test` | 5개 모듈, 56개 테스트 통과 (단위·통합·실제 WebSocket·Hazelcast 2노드 클러스터) |
| SDK 단위 테스트 `npm test` | 48개 통과 (직렬화·왕복 퍼징·XSS 소독·코덱·순서·원격 제어) |
| 연습문제 해답 `npm run ex:solution` | 31개 통과 |
| e2e `npm run e2e` | 10개 통과 — 실제 Chromium 2개 + 실제 서버 JAR: 화면 복제·마스킹·원격 조작·ack·채팅·연결 끊김 복구, 그리고 서버 2대 중 하나를 SIGKILL 한 뒤 복구·TTL 소멸 |
| 타입 검사·빌드 | `npm run typecheck`, Vite 앱 빌드, SDK 라이브러리 빌드 통과 |
| Node 실습 스크립트 | lab:01~19, lab:21 실제 서버 대상으로 실행 확인 |

**검증하지 못한 것** (환경에 없음): nginx 실제 실행(`4-practical/21-tls-proxy-upgrade/nginx.conf` 는 참고용 — 같은 동작은 `proxy-demo.ts` 로 확인),
실제 TLS 인증서·HTTPS 배포, Docker/Kubernetes, 모바일 브라우저, 대규모 부하.

## 이 튜토리얼이 실측으로 밝혀낸 것들
문서는 추측 대신 실제로 돌려 본 결과를 근거로 썼다. 예를 들어:
- Tomcat WebSocket 버퍼 기본 8KB → 20KB 메시지는 Spring 64KB 한도와 무관하게 1009 로 끊긴다 (18장)
- Spring 은 기본적으로 한 연결의 STOMP 메시지를 병렬 처리 → 2000개 중 447개 순서 뒤바뀜, 순서 보존 설정 시 0개 (19장)
- 순서 보존을 켜면 인터셉터 거부가 ERROR 프레임 없이 로그에만 남아 CONNECT 가 응답 없이 매달린다 → 소켓을 직접 닫도록 설계 (12장)
- 클라이언트가 heartbeat 2초를 요청해도 서버가 10초면 실제 주기는 10초 → 5초 idle 프록시에 끊긴다 (21장)
- Origin 헤더 없는 클라이언트는 WebSocket Origin 검사를 통과한다 → Origin 검사는 인증을 대신하지 못한다 (07·22장)
