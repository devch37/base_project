# 07. HTTP 와 WebSocket — 연결 수립과 연결 유지

## 이 장의 목표
- HTTP 로는 "서버가 먼저 말하기"가 왜 어려운지, WebSocket 이 무엇을 바꾸는지 설명할 수 있다.
- 핸드셰이크(`Upgrade` → `101 Switching Protocols`)를 손으로 보내 보고 이해한다.
- 연결을 **유지**하고 **죽은 연결을 정리**하는 방법(ping/pong, idle timeout)과 close code 를 안다.

## 프로젝트에서 이 장의 자리
상담사가 화면을 보는 동안 고객 화면이 바뀔 때마다 **서버가 먼저** 상담사에게 보내야 한다.
HTTP(요청해야 응답이 온다)로는 이걸 자연스럽게 할 수 없다. 이후 모든 실시간 기능은 WebSocket 위에서 돈다.

---

## 1. HTTP 의 한계

| 방법 | 동작 | 문제 |
|---|---|---|
| 폴링 | 1초마다 "새 거 있어?" | 대부분 헛요청, 최대 1초 지연 |
| 롱 폴링 | 새 게 생길 때까지 응답을 미룸 | 매번 연결·헤더 오버헤드, 서버 구현 복잡 |
| SSE | 서버→클라이언트 한 방향 스트림 | 클라이언트→서버는 따로 HTTP |
| **WebSocket** | 한 번 연결 후 **양방향**으로 계속 | 연결을 관리해야 한다(이 장과 09장) |

## 2. 연결 수립 = HTTP 로 시작해서 "갈아타기"

```
브라우저                                          서버
  │ GET /ws/echo HTTP/1.1                           │
  │ Upgrade: websocket          ← "프로토콜 바꾸자"  │
  │ Connection: Upgrade                             │
  │ Sec-WebSocket-Key: (무작위 16바이트 base64)       │
  │ Sec-WebSocket-Version: 13                       │
  │ Origin: http://localhost:5173  ← 브라우저가 자동으로│
  │────────────────────────────────────────────────▶│ Origin 검사 (허용 목록에 없으면 403)
  │◀────────────────────────────────────────────────│
  │ HTTP/1.1 101 Switching Protocols                │
  │ Upgrade: websocket                              │
  │ Sec-WebSocket-Accept: base64(SHA1(Key + GUID))  │ ← "WebSocket 을 아는 서버" 증명
  │═════════ 이제부터 같은 TCP 연결 위로 WebSocket 프레임 ═════════│
```
- 핸드셰이크는 **평범한 HTTP GET** 이다. 그래서 이 시점에는 헤더·쿠키·쿼리를 읽을 수 있다 (`HandshakeLoggingInterceptor`).
- 101 이후에는 HTTP 가 아니다. 프레임 = 짧은 헤더(종류·길이·마스킹) + 데이터.
- 프레임 종류: **text**, **binary**, **ping**, **pong**, **close**.

## 3. 연결 유지 — 왜 "살아 있는지" 모르는가

TCP 는 상대가 조용히 사라지면(와이파이 끊김, 노트북 덮개) **바로 알 수 없다.** FIN 패킷도 close 프레임도 안 오기 때문이다.
그동안 서버는 그 연결을 살아 있다고 믿고 메모리를 잡고, 메시지를 보내려 한다.
또 중간의 프록시·로드밸런서는 "한동안 조용한 연결"을 임의로 끊는다(nginx 기본 60초, 21장).

해결: **주기적으로 신호를 주고받는다.**
- 서버가 `ping` 프레임 → 브라우저가 **자동으로** `pong` (JS 코드 필요 없음)
- 일정 시간 pong 이 없으면 서버가 연결을 닫는다 (`KeepAliveTask`: 15초마다 ping, 45초간 pong 없으면 종료)

> 브라우저 JS 는 ping 프레임을 직접 보낼 API 가 없다. 그래서 STOMP 는 자기 계층에서 heartbeat 를 따로 정의한다 (09장).

## 4. close code

| 코드 | 의미 | 클라이언트는? |
|---|---|---|
| 1000 | 정상 종료 | 재연결 안 함 |
| 1001 | 떠남 (탭 닫힘, **서버 종료**) | 재연결 |
| 1006 | 비정상 — close 프레임 없이 끊김 (네트워크 단절, 프로세스 강제 종료) | 재연결 |
| 1008 | 정책 위반 | 보통 재연결 안 함 |
| 1009 | 메시지가 너무 큼 (18장!) | 보내는 크기를 줄여야 |
| 1011 | 서버 내부 오류 | 재연결 |
| 4000~4999 | **애플리케이션이 정의** — 우리 서버: 4001 토큰 만료, 4401 인증 실패, 4003 강제 퇴장, 4500(Spring) 세션 신뢰 불가 | 코드별로 다르게 (09·12장) |

## 5. 순수 WebSocket 으로 방 채팅을 만들어 보면

`RoomHandler` 를 읽어 보면 WebSocket 이 **아무 규칙도 주지 않는다**는 게 보인다.
- 메시지 종류(입장? 채팅?) → 우리가 `"type"` 필드를 발명
- 누구에게 보낼지 → 우리가 `rooms` Map 을 직접 관리
- 오류 알리기 → 우리가 `"error"` 타입 발명
- 받았는지 확인 → 방법 없음

이 "직접 발명해야 하는 규칙"을 표준화한 것이 08장의 **STOMP** 다.

### ★ WebSocketSession 은 스레드 안전하지 않다
A 와 B 가 동시에 말하면 두 톰캣 스레드가 C 의 세션에 **동시에** `sendMessage` 한다 → 예외나 프레임 깨짐.
`ConcurrentWebSocketSessionDecorator` 가 버퍼 + 락으로 순서대로 보내고, 너무 느린 클라이언트는 한도를 넘으면 끊는다.
(STOMP 를 쓰면 Spring 이 내부에서 이 처리를 해 준다.)

---

## 코드 읽기 (`server/raw-websocket/src/main/java/tutor/chat/rawws/`)
- `WebSocketConfig` — 경로 ↔ 핸들러, Origin 허용 패턴
- `HandshakeLoggingInterceptor` — 핸드셰이크(HTTP) 단계의 헤더 출력
- `EchoHandler` — "서버가 먼저 말하기"
- `RoomHandler` — 직접 만든 규칙의 방 채팅, 스레드 안전 데코레이터
- `KeepAliveTask` — ping 과 죽은 연결 정리
- 테스트 `RawWebSocketTest` — 에코, 방 브로드캐스트, **허용되지 않은 Origin 은 403**

## 직접 해 보기
```bash
./gradlew :server:raw-websocket:bootRun     # 터미널 1
npm run lab:07                              # 터미널 2: 핸드셰이크를 손으로 + WebSocket API
npm run dev                                 # 터미널 3: http://localhost:5173/labs/07-raw-websocket/
```
1. `lab:07` 출력에서 `Sec-WebSocket-Accept` 기대값이 서버 값과 일치하는지.
2. 브라우저 실습 페이지 → 개발자도구 **Network → WS** → 요청 헤더의 `Upgrade`, 응답 상태 101, **Messages** 탭의 프레임.
3. 탭 두 개로 `/ws/room` 에 같은 방 join → 채팅 → 한 탭 닫기 → "나갔습니다".
4. 서버를 Ctrl+C 로 끄면 브라우저 close code 는? (1001 또는 1006 — 어떤 경우에 무엇이 나오는지 비교)
5. `lab:07` 끝의 메시지: Node 클라이언트는 **Origin 헤더 없이도** 연결된다(서버 로그 `Origin=null`). Origin 검사가 무엇을 막고 무엇을 못 막는지 22장에서 다시.

## 자주 하는 실수
- `ws.send()` 를 `onopen` 전에 호출 → `InvalidStateError`. `readyState === OPEN` 확인.
- 서버에서 여러 스레드가 같은 세션에 동시에 send.
- 빈 방 Map 을 안 지워 메모리 누수 (`RoomHandler.leave` 의 `computeIfPresent`).
- WebSocket 은 CORS 로 보호된다고 착각 → **아니다.** 서버가 Origin 을 검사해야 한다.

## 확인 질문
1. 핸드셰이크 요청은 GET 인가 POST 인가? 이 시점에 쿠키를 읽을 수 있나?
2. 1006 으로 끊겼다. 서버가 클라이언트에게 close 프레임을 보냈을까?
3. 브라우저가 서버의 ping 에 pong 을 보내려면 JS 에서 무엇을 해야 하나?

<details><summary>답</summary>

1. GET. 평범한 HTTP 요청이므로 쿠키·헤더·쿼리 모두 읽을 수 있다.
2. 아니다. 1006 은 "close 프레임 없이 끊김"을 클라이언트가 스스로 붙인 코드다.
3. 아무것도. 브라우저가 자동으로 한다.
</details>

다음 → [08. STOMP 와 Pub/Sub](../08-stomp-pubsub/)
