# 08. STOMP 와 Pub/Sub — CONNECT · SEND · SUBSCRIBE · 브로커 · /app · /topic · roomId

## 이 장의 목표
- WebSocket 위에 **왜** STOMP 가 필요한지 말할 수 있다.
- STOMP 프레임(CONNECT, CONNECTED, SUBSCRIBE, SEND, MESSAGE, ERROR, RECEIPT, DISCONNECT)을 읽고 직접 쓸 수 있다.
- Pub/Sub 와 메시지 브로커, `/app`·`/topic`·`/queue`·`/user` 주소의 역할, roomId 로 방을 나누는 방법을 안다.
- **REST Controller 와 STOMP 메시지 Controller 의 차이**를 표로 설명할 수 있다.

## 프로젝트에서 이 장의 자리
최종 서버의 모든 실시간 메시지는 STOMP 주소로 오간다 ([00-big-picture 의 주소 표](../../docs/00-big-picture.md)).
"화면은 `/topic/cobrowse/{room}/screen` 으로, 명령은 `/topic/cobrowse/{room}/commands` 로" — 이 설계의 문법이 이 장이다.

---

## 1. WebSocket 위에 왜 STOMP 인가

07장에서 직접 발명해야 했던 것들을 STOMP 가 표준으로 준다.

| 직접 만들어야 했던 것 | STOMP 가 주는 것 |
|---|---|
| 메시지 종류 `"type":"join"` | 명령(command): `SUBSCRIBE`, `SEND`, `UNSUBSCRIBE` … |
| 누구에게 보낼지 `rooms` Map | **destination**(주소) + 구독 → 브로커가 알아서 |
| 인증 정보 전달 방법 | `CONNECT` 프레임의 헤더 (12장: `Authorization`) |
| 오류 알리기 | `ERROR` 프레임 |
| 처리 확인 | `receipt` 헤더 → `RECEIPT` 프레임 |
| 연결 살아 있나 | `heart-beat` 협상 (09장) |
| 메타데이터 | `content-type`, `content-length`, 사용자 정의 헤더 |

STOMP 프레임은 HTTP 와 닮은 텍스트다:
```
SEND                                   ← 명령
destination:/app/rooms/r1/send         ← 헤더들
content-type:application/json
                                       ← 빈 줄
{"from":"고객","text":"안녕"}^@         ← 본문 + NULL 문자(\0)
```

## 2. Pub/Sub 와 메시지 브로커

```
          SUBSCRIBE /topic/rooms/r1                     ┌──────────────┐
상담사 ──────────────────────────────────────────────▶ │              │
          SUBSCRIBE /topic/rooms/r1                     │   브로커       │ "r1 구독자 목록: 상담사, 고객"
고객   ──────────────────────────────────────────────▶ │ (simple broker│
                                                        │  = 서버 메모리)│
고객 ── SEND /app/rooms/r1/send ──▶ @MessageMapping ──▶ │              │──MESSAGE──▶ 상담사
                                   (ChatController)     │              │──MESSAGE──▶ 고객
                                    검증·seq·저장         └──────────────┘
```
- **발행자(publisher)는 구독자(subscriber)를 모른다.** "r1 주소로 보낸다"만 안다. 그래서 구독자가 늘어도 발행 코드는 그대로.
- **브로커**: 주소별 구독자 목록을 들고 메시지를 나눠 주는 우체국. Spring 의 `enableSimpleBroker` 는 **서버 메모리 안**의 브로커 → 서버가 2대면 서로의 구독자를 모른다 (23장).

## 3. 주소 체계: /app · /topic · /queue · /user · roomId

| 접두어 | 가는 곳 | 용도 | 예 |
|---|---|---|---|
| `/app` | **우리 컨트롤러** (`@MessageMapping`) | 서버가 먼저 검증·가공 | `/app/rooms/r1/send` |
| `/topic` | 브로커 → 구독자 **전원** (1:N) | 방송 | `/topic/rooms/r1` |
| `/queue` | 브로커 (관례상 1:1) | 개인 메시지 | |
| `/user` | 특정 **사용자**의 세션들로 변환 | 나에게만 오는 오류·응답 | `/user/queue/errors` |

- **roomId 를 주소에 넣는다**: `/topic/rooms/{roomId}`. 방 = 주소 하나. 구독한 사람만 그 방 메시지를 받는다.
- `/topic` 으로 **직접 SEND** 하면 컨트롤러를 거치지 않고 브로커가 바로 뿌린다 → 검증·권한을 우회 (실습 페이지의 "우회" 버튼). 12장에서 막는다.

## 4. REST Controller vs STOMP 메시지 Controller

| | REST (`RoomController`, 05장) | STOMP (`ChatController`) |
|---|---|---|
| 매핑 | `@PostMapping("/api/rooms")` | `@MessageMapping("/rooms/{roomId}/send")` (앞에 `/app`) |
| 경로 변수 | `@PathVariable` | `@DestinationVariable` |
| 본문 | `@RequestBody` | `@Payload` |
| 반환값이 가는 곳 | **요청한 사람**에게 HTTP 응답 | `@SendTo` 주소의 **구독자 전원** |
| 상태 코드 | 200/404/… | **없다.** 오류는 ERROR 프레임 또는 `/user/queue/errors` 로 직접 |
| 실행 스레드 | 톰캣 요청 스레드 | clientInboundChannel 스레드 풀 (19장: 순서 문제의 원인) |
| 서버가 먼저 보내기 | 불가 | `SimpMessagingTemplate.convertAndSend(...)` |

둘이 한 서버에서 함께 산다: `NoticeRestController` — 관리자가 **HTTP** 로 공지를 보내면 그 방 **WebSocket 구독자**에게 실시간으로 간다.

## 5. 그 밖의 장치
- `@SubscribeMapping("/rooms/{roomId}/history")` — 구독하면 **그 사람에게 한 번만** 응답(요청-응답 흉내). 입장 직후 최근 대화 불러오기.
- `@MessageExceptionHandler` + `@SendToUser("/queue/errors")` — 예외를 **보낸 사람에게만** 알린다.
- seq(순번) — 방마다 서버가 1, 2, 3… 을 붙인다. 놓친 메시지 찾기(09장), 순서 확인(19장)의 열쇠.

---

## 코드 읽기 (`server/stomp-chat/src/main/java/tutor/chat/stomp/`)
- `StompConfig` — 엔드포인트 `/ws`, `/app`·`/topic`·`/queue`·`/user` 접두어, simple broker
- `ChatController` — `@MessageMapping`/`@SendTo`, `@SubscribeMapping`, `@MessageExceptionHandler`
- `ChatHistory` — seq 부여와 최근 N개 보관 (락 안에서)
- `PresenceTracker` — SUBSCRIBE/UNSUBSCRIBE/DISCONNECT 이벤트로 입장·퇴장
- `NoticeRestController` — REST → WebSocket
- 테스트 `StompChatTest` — 브로드캐스트, 방 분리, 개인 오류 큐, history, REST 공지, heartbeat 협상, 퇴장

## 직접 해 보기
```bash
./gradlew :server:stomp-chat:bootRun        # 터미널 1
npm run lab:08                              # 터미널 2: 라이브러리 없이 STOMP 프레임을 손으로
npm run dev                                 # 터미널 3: http://localhost:5173/labs/08-stomp-chat/
```
1. `lab:08` 출력에서 CONNECT → CONNECTED, SUBSCRIBE, SEND(`/app`) → **MESSAGE**(`/topic`), DISCONNECT(receipt) → RECEIPT 를 짝지어 보라.
   MESSAGE 의 `content-length` 가 본문 **글자 수**보다 큰 이유는? (14장)
2. 브라우저 탭 두 개로 같은 방에서 대화. 개발자도구 WS → Messages 에서 프레임 원문.
3. "빈 메시지" 버튼 → 나에게만 `/user/queue/errors`. 다른 탭에는 안 간다.
4. "우회" 버튼 → 다른 탭에 **가짜 공지**가 보인다. 왜 가능한가?
5. `curl -X POST localhost:8080/api/rooms/r1/notice -H 'Content-Type: application/json' -d '{"text":"점검"}'` → 브라우저에 실시간 공지.

## 자주 하는 실수
- SUBSCRIBE 에는 기본적으로 응답이 없다. 구독 직후 바로 SEND 하면 "구독이 서버에 도착하기 전"이라 자기 메시지를 못 받을 수 있다 (테스트의 `Thread.sleep(200)`).
- `@SendTo` 없이 return 하면 기본 주소(`/topic` + 원래 destination)로 간다 — 의도와 다를 수 있다.
- 클라이언트가 보낸 `from` 을 믿는다 → 사칭 (12장에서 Principal 로 교체).

## 확인 질문
1. 고객이 `/app/rooms/r1/send` 로 보낸 메시지가 상담사에게 도착하기까지 거치는 것들을 순서대로.
2. 상담사 3명이 같은 방을 구독한다. 고객 메시지 하나에 서버가 보내는 MESSAGE 프레임은 몇 개?
3. 서버 A 의 simple broker 에 구독한 상담사는 서버 B 로 들어온 고객 메시지를 받을 수 있나?

<details><summary>답</summary>

1. WebSocket 프레임 → STOMP 디코딩 → (12장: 인터셉터) → `@MessageMapping` 메서드 → 반환값 → 브로커 → `/topic/rooms/r1` 구독자별 MESSAGE.
2. 3개 (보낸 고객도 구독 중이면 4개).
3. 없다. 23장의 주제.
</details>

## 연습
- `exercises/src/03-stomp-frame.ts` — 프레임 인코딩·디코딩

다음 → [09. heartbeat · 연결 종료 · 재연결](../09-heartbeat-reconnect/)
