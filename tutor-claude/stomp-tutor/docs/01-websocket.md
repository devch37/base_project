# 1단계 · WebSocket — "계속 열려 있는 양방향 관"

## HTTP 로는 왜 채팅이 불편한가

HTTP 는 **물어봐야 답이 오는** 구조다.

```
브라우저: 새 메시지 있어?   → 서버: 없어
브라우저: 새 메시지 있어?   → 서버: 없어       ← 1초마다 계속 물어봐야 한다 (폴링)
브라우저: 새 메시지 있어?   → 서버: 철수가 "안녕"
```
서버는 영희에게 "철수가 말했어!"라고 **먼저** 알려 줄 방법이 없다.

## WebSocket 은 연결을 열어 둔다

```
브라우저 ── GET /ws-raw  (Upgrade: websocket) ──▶ 서버      ← 시작은 평범한 HTTP 요청
브라우저 ◀── 101 Switching Protocols ──────────── 서버      ← "좋아, 지금부터 WebSocket 으로"
브라우저 ◀═══════════ 열린 연결 (양쪽 다 언제든 보냄) ═════════▶ 서버
```
- 한 번 연결하면 끊을 때까지 유지된다.
- **서버가 먼저** 보낼 수 있다 → 철수가 말하는 순간 서버가 영희에게 밀어 준다.

## 코드 보기

### `RawWebSocketConfig.java` — 주소 등록
```java
registry.addHandler(handler, "/ws-raw")
        .setAllowedOriginPatterns("http://localhost:*", ...);
```
"`/ws-raw` 로 오는 WebSocket 연결은 `RawChatHandler` 가 맡는다".
`setAllowedOriginPatterns`: 어느 웹사이트에서 연결해도 되는지. (다른 사이트가 몰래 연결하는 것을 막는 장치)

### `RawChatHandler.java` — 실제 일
| 메서드 | 언제 불리나 | 하는 일 |
|---|---|---|
| `afterConnectionEstablished` | 누가 연결했을 때 | 목록에 추가 + **서버가 먼저** 환영 인사 |
| `handleTextMessage` | 누가 메시지를 보냈을 때 | 목록의 **전원**에게 보내기 |
| `afterConnectionClosed` | 연결이 끊겼을 때 | 목록에서 빼기 |

```java
private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
```
- `WebSocketSession` = 연결 하나. 이 목록이 "지금 접속한 사람들"이다.
- **static 이 아니어도 되는 이유**: `@Component` 라서 Spring 이 이 객체를 앱 전체에 **하나만** 만든다(싱글톤).
- **Concurrent 인 이유**: 여러 사람이 동시에 말하면 여러 스레드가 이 목록을 동시에 만진다.
- `synchronized (s)`: 한 연결에 두 스레드가 **동시에** `sendMessage` 하면 안전하지 않아서.

## 직접 해 보기
1. `./gradlew bootRun` → http://localhost:8080/raw.html 을 **탭 두 개**로 연다.
2. 둘 다 "연결" → 한쪽에서 메시지 → 양쪽 로그에 보인다.
3. 개발자도구(F12) → **Network → WS** → `ws-raw` 클릭
   - Headers: 요청의 `Upgrade: websocket`, 응답 상태 **101**
   - Messages: 주고받은 메시지들
4. 한 탭을 닫으면 서버 콘솔에 `끊김 code=1001`. "닫기" 버튼은 `code=1000`.

## 불편한 점을 느껴 보자 (→ 2단계의 이유)
"방" 기능을 넣으려면 어떻게 해야 할까?
- 메시지에 `{"type":"join","room":"lobby"}` 같은 **형식을 직접 발명**하고
- 방마다 접속자 목록 `Map<String, Set<WebSocketSession>>` 을 **직접 관리**하고
- 연결이 끊기면 모든 방에서 **직접 빼고**
- 잘못된 메시지에 오류를 어떻게 알릴지도 **직접 정해야** 한다.

모든 채팅 서비스가 이걸 매번 새로 만든다면? → 이 규칙들을 표준으로 정한 것이 **STOMP** 다.

## 확인 질문
1. WebSocket 연결의 첫 요청은 HTTP 인가?
2. `sessions` 를 그냥 `HashSet` 으로 하면 어떤 일이 생길 수 있나?
3. 서버를 재시작하면 `sessions` 목록은 어떻게 되나?

<details><summary>답</summary>

1. 그렇다. `Upgrade: websocket` 헤더가 붙은 평범한 GET. 서버가 101 로 답한 뒤부터 WebSocket 이다.
2. 여러 스레드가 동시에 추가·삭제·순회하다 예외(ConcurrentModificationException)나 데이터 깨짐이 생길 수 있다.
3. 메모리라서 사라진다. 브라우저들은 끊겼다가 다시 연결해야 한다.
</details>

다음 → [2단계 · STOMP](02-stomp.md)
