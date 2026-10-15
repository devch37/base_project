# 학습 가이드 — 무엇을, 어떤 순서로, 왜 그 순서로

이 문서는 처음에 받은 주제 목록(A~H)을 **"화면 공유 상담 프로젝트를 이해하는 데 필요한 순서"** 로 다시 묶은 것이다.

- 원래 목록은 주제별(웹 기초 / 실시간 / 인증 / 화면 동기화 / Spring / 데이터 / 운영 / 다중 서버)로 나뉘어 있다.
- 하지만 실제로 이해하려면 **앞 장의 개념을 재료로 다음 장을 쌓아야** 한다. 예를 들어 STOMP 인가(12장)는 Spring 인터셉터(05장)와 JWT(11장)를 둘 다 알아야 읽을 수 있다.
- 그래서 A~H 를 쪼개서 **4단계 24장**으로 다시 배치했다. 각 장에는 그 장의 개념만으로 끝까지 읽을 수 있는 코드와 실습이 붙어 있다.

> 표기: **★추가** = 원래 목록에 없지만 프로젝트를 이해하는 데 꼭 필요해서 넣은 개념.
> **⏭ 고급** = 지금은 이름만 알고 넘어가고 [docs/ADVANCED_TOPICS.md](docs/ADVANCED_TOPICS.md)에서 나중에 다루는 것.

---

## 0. 큰 그림 먼저 (30분)

[docs/00-big-picture.md](docs/00-big-picture.md) — 최종적으로 무엇을 만드는지, 메시지가 어디서 어디로 흐르는지를 한 장으로 본다.
이 그림을 머릿속에 두고 각 장을 읽으면 "지금 배우는 것이 전체 중 어디인지"가 보인다.

---

## 1단계 `1-basic/` — 웹과 서버의 기초

목표: 브라우저와 서버가 HTTP 로 대화하는 방식, 비동기 코드, 빌드 도구, Spring 의 뼈대를 손에 익힌다.
이 단계가 끝나면 "REST API 하나를 Spring 으로 만들고, 다른 서버를 안전하게 호출"할 수 있다.

| 장 | 제목 | 원래 주제 | ★추가한 필수 개념 |
|---|---|---|---|
| [01](1-basic/01-web-basics/) | 웹 통신 기초 | A: 브라우저·서버·포트·URL·Origin | DNS, TCP 연결, "HTTP 는 텍스트 약속"이라는 감각 |
| [02](1-basic/02-http-rest-json/) | HTTP 요청·응답과 REST | A: HTTP·GET·POST·상태 코드·REST·JSON·헤더·fetch | 안전성·멱등성, Content-Type, fetch 는 4xx/5xx 에서 throw 하지 않는다 |
| [03](1-basic/03-async-js/) | 비동기 JavaScript | A: 동기·비동기·Promise·async/await | 이벤트 루프와 마이크로태스크(→15장 MutationObserver 이해의 열쇠), 타임아웃·취소(AbortController) |
| [04](1-basic/04-runtime-build-tools/) | 실행 환경과 빌드 도구 | G: Node.js·npm·Vite, 브라우저 vs Node, Gradle·JAR, 환경 변수·외부 설정 | 설정 우선순위(명령행 > 환경 변수 > yml), "브라우저 코드에는 비밀을 넣을 수 없다" |
| [05](1-basic/05-spring-structure/) | Spring 서버 구조 | E: Spring Boot·Controller·DTO·DI·Bean·Configuration·인터페이스·고객사 정책 교체 | 입력 검증과 예외→상태 코드 매핑(ProblemDetail), 시간(Clock) 주입으로 테스트 가능하게 |
| [06](1-basic/06-server-to-server-http/) | 서버 간 HTTP 호출과 오류 처리 | E: 서버 간 HTTP 호출과 오류 처리 | 연결/읽기 타임아웃, 재시도해도 되는 오류 구분, 대체값(fallback), 서버 스레드 모델 |

## 2단계 `2-intermediate/` — 실시간 통신과 인증

목표: "요청-응답"을 넘어 **연결을 열어 두고 양방향으로** 주고받는다. 그리고 그 연결을 **누가 무엇을 할 수 있는지** 지킨다.
이 단계가 끝나면 "JWT 로 보호되는 방 단위 실시간 채팅 서버"를 만들 수 있다.

| 장 | 제목 | 원래 주제 | ★추가한 필수 개념 |
|---|---|---|---|
| [07](2-intermediate/07-http-vs-websocket/) | HTTP 와 WebSocket | B: 차이, 연결 수립과 유지 | 101 Switching Protocols, close code(1000/1001/1006/4xxx), WebSocketSession 은 스레드 안전하지 않다 |
| [08](2-intermediate/08-stomp-pubsub/) | STOMP 와 Pub/Sub | B: STOMP 의 필요성, CONNECT·SEND·SUBSCRIBE, Pub/Sub·브로커, /app·/topic·roomId / E: REST vs STOMP Controller | MESSAGE·ERROR·RECEIPT 프레임, /queue 와 /user, @SubscribeMapping |
| [09](2-intermediate/09-heartbeat-reconnect/) | heartbeat · 연결 종료 · 재연결 | B: heartbeat, 연결 종료, 재연결 | 지수 백오프 + jitter, 재연결 후 재구독, 놓친 메시지 복구(seq), presence |
| [10](2-intermediate/10-authn-authz/) | 인증과 인가 | C: 인증 vs 인가, 쿠키·세션 vs 토큰 | 쿠키 속성(HttpOnly·Secure·SameSite), 401 과 403 의 차이 |
| [11](2-intermediate/11-jwt/) | JWT | C: 구조·서명·만료·클레임, 서명 vs 암호화, Bearer vs 내부 API 발급 키 | HS256 vs RS256, alg:none 공격, 시계 오차 허용(clock skew) |
| [12](2-intermediate/12-stomp-security/) | STOMP 보안 | C: 사용자·방·역할별 접근 제어, 토큰 만료 vs 연결된 소켓 종료 / E: 인터셉터가 검사하는 위치 | default deny, /topic 직접 SEND 로 컨트롤러 우회, "ERROR 프레임 = 연결 종료" |

## 3단계 `3-advanced/` — 화면 동기화와 데이터 전송

목표: 고객 브라우저의 화면을 **DOM 단위로** 상담사 브라우저에 복제하고, 큰 데이터를 안전하게 나르고, 빠지거나 뒤섞인 메시지에서 회복한다.
이 단계가 끝나면 SDK(`web/sdk/src`)의 모든 파일을 읽을 수 있다.

| 장 | 제목 | 원래 주제 | ★추가한 필수 개념 |
|---|---|---|---|
| [13](3-advanced/13-html-dom-events/) | HTML · DOM · DOM 이벤트 | D: HTML·DOM·DOM 이벤트 | 이벤트 전파(캡처/버블), `isTrusted`, attribute vs property |
| [14](3-advanced/14-bytes-encoding-compression/) | 문자열 · 바이트 · 압축 | F: 문자열·UTF-8·바이트·바이너리, JSON·base64, 압축·해제 | "크기는 글자 수가 아니라 바이트", 압축이 손해인 경우 |
| [15](3-advanced/15-dom-snapshot-mutation/) | DOM 스냅샷과 MutationObserver | D: MutationObserver, 전체 스냅샷과 변경분, DOM 변경 감지 vs 입력·스크롤 동기화 | 노드 ID 매핑, 배치 처리와 형제 순서 |
| [16](3-advanced/16-render-iframe-canvas-overlay/) | 상담사 화면 재현 | D: iframe·canvas·overlay, CSS·이미지·스크립트 처리의 어려움 | 상대 URL 절대화, same-origin 스타일시트 인라인 |
| [17](3-advanced/17-remote-control-echo/) | 원격 클릭·입력과 에코 방지 | D: 클릭·입력 명령 반영, 이벤트가 양쪽에서 반복되는 문제와 방지 | 고객 동의, 명령 화이트리스트, ack 로 결과값 맞추기 |
| [18](3-advanced/18-chunking/) | 큰 메시지 조각내기 | F: 조각내는 이유, 조각 번호·전송 ID·복원·타임아웃 | 크기 제한이 여러 겹(Tomcat 기본 8KB!), 조립 메모리 상한 |
| [19](3-advanced/19-order-loss-resync/) | 순서 · 중복 · 손실과 재동기화 | F: 메시지 순서·중복·손실과 화면 재동기화 | Spring 은 기본적으로 한 연결의 메시지도 병렬 처리한다(실측: 2000개 중 447개 뒤바뀜) |

## 4단계 `4-practical/` — 운영 · 보안 · 다중 서버

목표: 만든 것을 **실제 운영 환경**(HTTPS, 프록시, 여러 서버, 장애)에 올릴 때 생기는 문제를 다룬다.
이 단계가 끝나면 최종 프로젝트 전체를 설명하고, 장애 상황에서 무슨 일이 일어나는지 예측할 수 있다.

| 장 | 제목 | 원래 주제 | ★추가한 필수 개념 |
|---|---|---|---|
| [20](4-practical/20-sdk-and-tooling/) | SDK 로 만들기 | G: SDK 와 일반 업무 화면 코드의 차이 | 라이브러리 빌드(ES/IIFE), 프로토콜 버전 호환, 공개 API 를 좁게 |
| [21](4-practical/21-tls-proxy-upgrade/) | HTTPS · WSS · TLS · 프록시 | G: HTTP/HTTPS, WS/WSS, TLS, 프록시와 WebSocket upgrade | 프록시 idle timeout vs heartbeat, X-Forwarded-* |
| [22](4-practical/22-browser-security-privacy/) | 브라우저 보안과 개인정보 | G: CORS vs WebSocket Origin 검사, XSS·CSP·iframe sandbox·개인정보 마스킹 | CSWSH(교차 사이트 WebSocket 탈취), 받는 쪽에서 다시 소독 |
| [23](4-practical/23-multi-server-hazelcast/) | 다중 서버와 Hazelcast | H: 로드밸런싱·클러스터, 다른 서버의 고객·상담사 메시지 전달, Topic vs IMap, 로컬 메모리 vs 공유 상태, heartbeat vs TTL | sticky session, 백업 복제, "소켓은 절대 공유 상태가 될 수 없다" |
| [24](4-practical/24-failover-capstone/) | 장애 후 재연결과 캡스톤 | H: 서버 장애 후 재연결과 화면 재동기화 | graceful shutdown, 장애 시나리오 표, 전체 흐름 설명하기 |

---

## 원래 주제 → 장 찾아보기 (역색인)

| 원래 주제 | 장 |
|---|---|
| 브라우저, 서버, 포트, URL, Origin | 01 |
| HTTP 요청·응답, GET·POST, 상태 코드 / REST, JSON, 헤더, fetch | 02 |
| 동기·비동기, Promise, async/await | 03 |
| HTTP 와 WebSocket 의 차이 / 연결 수립과 유지 | 07 |
| STOMP 가 필요한 이유 / CONNECT·SEND·SUBSCRIBE / Pub/Sub·브로커 / /app·/topic·roomId | 08 |
| heartbeat, 연결 종료, 재연결 | 09 (heartbeat 의 "연결 유지" 측면은 07, 프록시와의 관계는 21) |
| 인증 vs 인가 / 쿠키·세션 vs 토큰 | 10 |
| JWT 구조·서명·만료·클레임 / 서명 vs 암호화 / Bearer vs 내부 API 키 | 11 |
| 사용자·방·역할별 접근 제어 / 토큰 만료 vs 연결된 소켓 종료 | 12 |
| HTML, DOM, DOM 이벤트 | 13 |
| MutationObserver / 전체 스냅샷과 변경분 / DOM 변경 감지 vs 입력·스크롤 동기화 | 15 |
| iframe, canvas, overlay / CSS·이미지·스크립트 처리의 어려움 | 16 |
| 클릭·입력 명령 반영 / 이벤트 반복 전송 문제와 방지 | 17 |
| Spring Boot, Controller, DTO / DI, Bean, Configuration, 인터페이스 / 고객사 정책 교체 | 05 |
| REST Controller 와 STOMP 메시지 Controller 의 차이 | 08 (05 와 비교) |
| 인터셉터가 인증·권한을 검사하는 위치 | 12 (HTTP 쪽은 06·12) |
| 서버 간 HTTP 호출과 오류 처리 | 06 |
| 문자열·UTF-8·바이트·바이너리 / JSON 과 base64 / 압축 | 14 |
| 큰 메시지를 조각내는 이유 / 조각 번호·전송 ID·복원·타임아웃 | 18 |
| 순서·중복·손실과 화면 재동기화 | 19 |
| SDK 와 업무 화면 코드의 차이 | 20 |
| Node.js, npm, Vite / 브라우저 실행 vs Node 실행 / Gradle·JAR·빌드와 실행 / 환경 변수·외부 설정 | 04 |
| HTTP/HTTPS, WS/WSS, TLS / 프록시와 WebSocket upgrade | 21 |
| CORS 와 WebSocket Origin 검사의 차이 / XSS, CSP, iframe sandbox, 개인정보 마스킹 | 22 |
| 로드밸런싱·클러스터 / 다른 서버의 고객·상담사 메시지 / Topic vs IMap / 로컬 메모리 vs 공유 상태 / heartbeat vs TTL | 23 |
| 서버 장애 후 재연결과 화면 재동기화 | 24 |

---

## 왜 이 순서인가 (의존 관계)

```
01 웹 기초 ─▶ 02 HTTP/REST ─▶ 05 Spring ─▶ 06 서버 간 호출
     │              │             │
     │              ▼             ▼
     │        03 비동기 JS    08 STOMP Controller ◀── 07 WebSocket
     │              │             │                    │
     ▼              ▼             ▼                    ▼
04 도구(어디서 실행?)   09 heartbeat·재연결     10 인증/인가 ─▶ 11 JWT ─▶ 12 STOMP 보안
                          │                                         │
13 DOM ─▶ 15 스냅샷·변경분 ─▶ 16 재현 ─▶ 17 원격 제어                   │
             │                                                      │
14 바이트·압축 ─▶ 18 조각 ─▶ 19 순서·손실·재동기화 ◀─────────────────────┘
                                   │
          20 SDK · 21 TLS/프록시 · 22 보안 ─▶ 23 다중 서버 ─▶ 24 장애·캡스톤
```

- **Spring(E)을 실시간(B)보다 먼저**: STOMP 컨트롤러·인터셉터는 결국 Spring Bean 이다. DI 를 모르면 08장 코드가 마법처럼 보인다.
- **도구(G의 일부)를 04장으로 당김**: Gradle·npm·환경 변수를 모르면 1단계 실습부터 막힌다. 반면 TLS·프록시·CSP 같은 "운영" 주제는 실제로 배포할 때 의미가 생기므로 4단계로 미뤘다.
- **인증(C)을 STOMP(B) 바로 뒤에**: "연결 수립 시점에 누구인지 확인"(12장)은 WebSocket 과 STOMP 프레임 구조를 알아야 이해된다.
- **바이트(14)를 화면 동기화(15) 직전에**: 스냅샷 크기와 압축을 느껴 봐야 15~18장의 설계 이유가 납득된다.
- **다중 서버(H)는 마지막**: "한 서버에서 완벽히 동작"하는 것을 먼저 보고 나서야, 서버를 늘렸을 때 무엇이 깨지는지가 선명하게 보인다.

---

## ⏭ 뒤로 미룬 고급 주제

지금 단계에서 깊이 들어가면 큰 그림을 놓치는 것들이다. 각 장에서 "이런 게 있다"고만 언급하고, 상세는 [docs/ADVANCED_TOPICS.md](docs/ADVANCED_TOPICS.md) 로 모았다.

- 외부 메시지 브로커 relay(RabbitMQ/ActiveMQ 의 STOMP), Redis Pub/Sub 와의 비교
- Hazelcast split-brain, CP Subsystem, ReliableTopic, 클라이언트-서버 토폴로지
- 토큰 회전(refresh token rotation), 폐기 목록(revocation), RS256 + JWKS, JWE, mTLS
- Shadow DOM·cross-origin iframe·CSSOM(insertRule) 변경 추적, canvas/video 실시간 동기화(WebRTC 화면 공유와 혼합)
- 동시 편집 충돌 해결(OT/CRDT), 백프레셔·전송률 제한, 바이너리 프레임(MessagePack/CBOR), 사전(dictionary) 압축
- 관측(메트릭·분산 추적·로그 상관 ID), 부하 테스트, Kubernetes 배포와 드레인

---

## 장 하나를 공부하는 방법 (권장 루틴, 60~120분)

1. **README 의 "이 장의 목표"와 "프로젝트에서 이 장의 자리"를 먼저 읽는다** (5분) — 왜 배우는지부터.
2. **개념 설명을 읽는다** — 그림이 나오면 손으로 따라 그려 본다.
3. **"코드 읽기" 목록의 파일을 연다** — 주석이 설명의 연장이다. 주석만 따라 읽어도 흐름이 보이게 썼다.
4. **"직접 해 보기"를 실행한다** — 결과를 예측한 다음 실행한다. 예측과 다르면 그게 배울 거리다.
5. **"자주 하는 실수"를 읽고, "확인 질문"에 답을 말로 해 본다** — `<details>` 를 열기 전에.
6. 해당 연습문제(`exercises/`)가 있으면 푼다.
7. [PROGRESS.md](PROGRESS.md) 에 체크한다.

> 막히면 [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md), 용어는 [docs/GLOSSARY.md](docs/GLOSSARY.md).
> Claude 와 함께 공부하려면 이 폴더에서 **"오늘 공부 시작하자"** 라고 말하면 된다 ([CLAUDE.md](CLAUDE.md) 규칙대로 진행).

## 추천 일정

| 주 | 범위 | 비고 |
|---|---|---|
| 1주 | 00, 01~04 | 백엔드 경험이 있으면 01~02 는 빠르게. 03(이벤트 루프)은 천천히 |
| 2주 | 05~06 | Java 코드를 직접 고쳐 보는 "직접 해 보기"를 꼭 |
| 3주 | 07~09 | 브라우저 개발자도구의 WS 탭과 친해지기 |
| 4주 | 10~12 | 12장이 이 튜토리얼에서 가장 실무적인 장 중 하나 |
| 5주 | 13~16 | 15장 실험실(labs/15)에서 오래 놀수록 좋다 |
| 6주 | 17~19 | 19장 순서 실측은 꼭 직접 돌려 보기 |
| 7주 | 20~22 | |
| 8주 | 23~24 | 서버 두 대 띄우고 하나 죽여 보기 → 캡스톤 설명하기 |
