# 12. STOMP 보안 — 인터셉터 위치 · 사용자·방·역할별 접근 제어 · 토큰 만료 vs 열린 소켓

## 이 장의 목표
- 인증·인가 검사를 **어디서** 해야 하는지(Filter, HandlerInterceptor, HandshakeInterceptor, ChannelInterceptor) 설명할 수 있다.
- "사용자 × 방 × 역할 × 행동" 접근 제어를 default deny 로 구현할 수 있다.
- **토큰 만료와 이미 연결된 소켓 종료가 다른 문제**인 이유를 설명하고 둘 다 처리할 수 있다.

## 프로젝트에서 이 장의 자리
최종 서버의 `StompAuthInterceptor` 가 모든 STOMP 프레임을 검사한다.
고객이 남의 방 화면을 보거나, 상담사가 가짜 화면을 밀어 넣거나, 만료된 토큰으로 계속 엿듣는 것을 여기서 막는다.

---

## 1. 검사 위치 — 네 개의 관문

```
HTTP 요청 ─▶ [① Servlet Filter] ─▶ DispatcherServlet ─▶ [② HandlerInterceptor] ─▶ @RestController
                 (Spring Security)                         (ApiKeyInterceptor: /internal/**)

WebSocket 핸드셰이크(HTTP GET) ─▶ [① Filter] ─▶ [③ HandshakeInterceptor] ─▶ 101
                                                     (07장 HandshakeLoggingInterceptor)
101 이후 STOMP 프레임 ──────────────────────▶ [④ ChannelInterceptor] ─▶ @MessageMapping / 브로커
                                                  (StompAuthInterceptor)
```
**핵심: 101 이후 WebSocket 연결 "안"의 프레임은 ①②③을 지나가지 않는다.** 그래서 ④가 필요하다.

### 왜 핸드셰이크(③)가 아니라 CONNECT(④)에서 인증하나
- 브라우저의 `new WebSocket(url)` 은 **Authorization 헤더를 붙일 수 없다.**
- 쿼리(`?token=…`)로 보내면 프록시·서버 **접근 로그에 토큰이 남는다.**
- 쿠키는 자동 전송 → CSWSH(22장) 위험.
- STOMP **CONNECT 프레임에는 헤더를 자유롭게** 넣을 수 있다 → `Authorization: Bearer …`

## 2. ChannelInterceptor 가 하는 일 (`StompAuthInterceptor.preSend`)

| 프레임 | 검사 | 실패 시 |
|---|---|---|
| CONNECT | JWT 검증 → `accessor.setUser(principal)` (이후 모든 프레임에 사용자가 붙는다) | 연결 거부 |
| SUBSCRIBE | 주소가 **화이트리스트**에 있나 + 그 방을 READ 할 권한 | 거부 |
| SEND | 주소 화이트리스트(**`/topic` 직접 SEND 금지**) + WRITE/CLOSE 권한 + **토큰 만료 재확인** | 거부 |

컨트롤러는 인가가 끝난 뒤라 "업무"만 한다. 그리고 `from` 은 클라이언트 본문이 아니라 **Principal 에서** 채운다(사칭 방지).

## 3. 사용자 · 방 · 역할별 접근 제어

`RoomAccessPolicy`(인터페이스) + `DefaultRoomAccessPolicy` — 05장 패턴 그대로, 고객사별로 교체 가능.

```
default deny: 명시적으로 허용한 경우만 true
 1) 방이 존재하고, 사용자와 같은 고객사(tenant)
 2) CUSTOMER: 토큰에 적힌 자기 방에서 READ/WRITE (CLOSE 불가)
 3) AGENT   : 지금 "배정된" 방에서 READ/WRITE/CLOSE   ← 매번 서버 상태 조회 (11장)
 4) 종료된 방: READ 만
```
최종 서버(`cobrowse-server`)는 행동을 더 쪼갠다: SCREEN_SEND(고객만), SCREEN_VIEW(상담사만), COMMAND_SEND(상담사만) … (17장 표)

## 4. 실측: "ERROR 프레임 = 연결 전체 종료"

인터셉터에서 예외를 던지면 Spring 은 ERROR 프레임을 보내고 **연결을 닫는다**(STOMP 규약). `SecureStompTest` 가 확인한다:
```
고객이 남의 방을 SUBSCRIBE → ERROR "이 방을 볼 권한이 없습니다" → 연결 끊김 (구독 하나만 거절되는 게 아니다!)
```
설계 결론:
- **보안 위반**(남의 방, 역할 위반) → 인터셉터에서 거부, 연결 종료. 정상 클라이언트는 이런 요청을 안 보낸다.
- **업무 규칙 거절**(예: 고객이 원격 조작에 동의하지 않음) → 컨트롤러가 `/user/queue/errors` 로 알리고 **연결 유지** (17장).
- 클라이언트는 권한 없는 주소를 **애초에 구독하지 않게** 만든다.

> ⚠ 순서 보존 모드에서는 다르다 (19장 실측): `setPreserveReceiveOrder(true)` 를 켜면 인터셉터 예외가 ERROR 프레임으로 **가지 않고 서버 로그에만** 남는다.
> 거부된 CONNECT 는 응답 없이 매달린다. 그래서 `cobrowse-server` 의 인터셉터는 거부할 때 **소켓을 직접 닫는다**(close code 포함).

## 5. 토큰 만료 vs 이미 연결된 소켓 종료

> JWT 는 CONNECT 때 **한 번** 검증됐을 뿐이다. 15분이 지나 exp 를 넘겨도 **소켓은 멀쩡히 열려 있다.**

| 문제 | 해결 | 코드 |
|---|---|---|
| 만료 후에도 SEND 를 계속 보낸다 | 프레임마다 만료 재확인 | `requireLiveUser` |
| 만료 후 **조용히 구독만** 하며 엿듣는다 (프레임을 안 보내니 검사할 기회가 없다) | 주기적으로 만료된 연결을 찾아 **서버가 끊는다** (4001) | `ExpiredSessionSweeper` |
| 오래 상담하는데 끊기면 불편 | 연결 유지한 채 **토큰 갱신** (`/app/token/refresh`). 새 토큰은 같은 사용자여야 | `ChatController.refresh` |
| 배정 해제·퇴사 — 토큰은 아직 유효 | 레지스트리 수정 + 해당 사용자 연결 **강제 종료**(4003) | `InternalApiController.unassign`, `kick` |

서버가 연결을 끊으려면 소켓 객체가 필요한데, STOMP 계층에서는 세션 ID 만 보인다.
→ `configureWebSocketTransport` 에 **데코레이터**를 끼워 `WebSocketSession` 을 `SessionRegistry` 에 모아 둔다.

---

## 코드 읽기 (`server/secure-chat/src/main/java/tutor/chat/secure/`)
1. `StompConfig` — 인터셉터 등록, 세션 수집 데코레이터
2. `auth/StompAuthInterceptor` — CONNECT/SUBSCRIBE/SEND 검사, 화이트리스트 정규식
3. `room/RoomAccessPolicy`, `DefaultRoomAccessPolicy`, `RoomRegistry`
4. `auth/SessionRegistry`, `auth/ExpiredSessionSweeper` — 4001/4003
5. `chat/ChatController` — Principal 사용, 토큰 갱신
6. `internal/ApiKeyInterceptor`(HTTP 쪽 관문), `InternalApiController`
7. 테스트 `SecureStompTest` 12개 — 각 시나리오가 하나의 테스트
8. 최종판: `server/cobrowse-server/.../session/StompAuthInterceptor` (주소→행동 규칙 표, 소켓 직접 종료)

## 직접 해 보기
```bash
./gradlew :server:secure-chat:bootRun       # 터미널 1
npm run tenant                              # 터미널 2 (고객사 백엔드 → 8080)
npm run dev                                 # 터미널 3: http://localhost:5173/labs/12-secure-chat/
```
페이지 위쪽에서 "방 만들기 + 고객 토큰"(수명 40초) → "상담사 토큰" → 아래 두 칸에서:
1. 고객: **토큰 없이 CONNECT** → ERROR + 종료 코드
2. 고객: CONNECT → 내 방 구독 → 메시지 → **남의 방 구독** → ERROR 후 **연결 전체가 끊긴다**
3. 상담사: 배정 전 내 방 구독 → 거부. "배정" 후 다시 연결 → 구독 성공
4. 고객: "상담 종료" → CLOSE 권한 없음
5. 아무것도 안 하고 40초 기다리기 → **code 4001** 로 끊긴다 (조용히 구독만 하던 연결도)
6. 다시 연결 후 30초쯤에 "토큰 갱신" → 40초가 지나도 유지
7. 상담사 구독 중에 "배정 해제" → **code 4003**

**도전 과제 (Java)**: "슈퍼바이저(SUPERVISOR)" 역할을 추가하라 — 같은 고객사의 모든 방을 **READ 만** 가능. `Role`, `DefaultRoomAccessPolicy`, 토큰 발급 규칙, 테스트를 고친다.

## 자주 하는 실수
- `StompHeaderAccessor.wrap(message)` 로 얻은 accessor 에 `setUser` → 복사본이라 반영 안 됨. `MessageHeaderAccessor.getAccessor(...)` 를 쓴다.
- 화이트리스트 대신 블랙리스트 ("`/topic/admin` 만 막자") → 새 주소가 생길 때마다 구멍.
- 토큰 만료를 CONNECT 에서만 검사.
- 권한 해제 시 레지스트리만 고치고 열린 구독은 그대로.

## 확인 질문
1. Spring Security 의 HTTP 필터 설정만으로 STOMP 구독 권한을 지킬 수 있나?
2. 고객이 15분 토큰으로 연결해 20분째 구독만 하고 있다. `ExpiredSessionSweeper` 가 없다면?
3. 인가 실패를 "연결 종료"로 처리하는 것의 장단점은?

<details><summary>답</summary>

1. 없다. 101 이후 프레임은 HTTP 필터를 지나가지 않는다. (spring-security-messaging 은 ChannelInterceptor 를 쓴다)
2. 만료된 사용자가 계속 메시지를 받는다(엿듣기).
3. 장: 공격 시도를 즉시 차단, 단순. 단: 정상 사용자의 실수(늦은 권한 반영 등)에도 연결이 끊긴다 → 업무 거절은 별도 채널로.
</details>

다음 단계 → [3단계: 13. HTML · DOM · 이벤트](../../3-advanced/13-html-dom-events/)
