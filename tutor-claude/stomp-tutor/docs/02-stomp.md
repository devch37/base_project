# 2단계 · STOMP — WebSocket 위의 "우편 규칙"

## 한 줄 요약
> WebSocket 이 **도로**라면, STOMP 는 **주소 체계와 우편 규칙**이다.
> "이 주소를 구독할게", "이 주소로 보내 줘"를 표준 형식으로 말할 수 있게 해 준다.

## STOMP 메시지(프레임)는 이렇게 생겼다

HTTP 와 비슷한 텍스트다. `chat.html` 오른쪽 로그에서 실제로 볼 수 있다.
```
SUBSCRIBE                         ← 명령
id:sub-0                          ← 헤더들
destination:/topic/rooms/lobby
                                  ← 빈 줄
                                  ← (본문 없음) + 끝 표시 \0
```

| 명령 | 누가 | 뜻 |
|---|---|---|
| `CONNECT` / `CONNECTED` | 클라이언트 / 서버 | 연결 시작, 승인 (heartbeat 주기도 여기서 정함) |
| `SUBSCRIBE` | 클라이언트 | "이 주소로 오는 메시지를 나에게 줘" |
| `SEND` | 클라이언트 | "이 주소로 보내 줘" |
| `MESSAGE` | 서버 | 구독한 주소에 메시지가 왔어 |
| `DISCONNECT` | 클라이언트 | 정상 종료 |
| `ERROR` | 서버 | 문제가 생겼어 (보통 그 뒤 연결 종료) |

## 주소 규칙: `/app` 과 `/topic`

`StompConfig.java`:
```java
registry.addEndpoint("/ws");                         // WebSocket 연결 주소
registry.enableSimpleBroker("/topic");               // /topic/... = 브로커가 구독자 전원에게
registry.setApplicationDestinationPrefixes("/app");  // /app/...   = 우리 컨트롤러가 먼저
```

```
철수 ── SEND /app/rooms/lobby/send ──▶ ChatController.send()   (검사·저장·가공)
                                             │
                                             ▼
                              브로커: "/topic/rooms/lobby 구독자 누구?" → 철수, 영희
철수 ◀── MESSAGE ──┤
영희 ◀── MESSAGE ──┘
```
- **브로커** = 주소별 구독자 목록을 들고 나눠 주는 우체국. `enableSimpleBroker` 는 **서버 메모리 안**의 우체국이다.
- **방 = 주소 하나.** `lobby` 방 = `/topic/rooms/lobby`. 1단계처럼 방별 목록을 직접 만들 필요가 없다 — 브로커가 구독 정보로 대신한다.
- 보내는 쪽(철수)은 받는 사람이 누군지 모른다. "이 주소로"만 안다. 이것이 **Pub/Sub(발행/구독)**.

## `ChatController.java` — 세 가지 방식

### ① `@SendTo` — 가장 단순
```java
@MessageMapping("/echo")       // SEND /app/echo 를 받는다
@SendTo("/topic/echo")         // return 값을 /topic/echo 구독자 전원에게
public Map<String, String> echo(@Payload String text) { return Map.of("echo", "에코: " + text); }
```

### ② 코드로 직접 보내기 — 방 채팅
```java
@MessageMapping("/rooms/{roomId}/send")
public void send(@DestinationVariable String roomId, @Payload SendRequest request) {
    ...
    broadcaster.send(message);   // 내부적으로 template.convertAndSend("/topic/rooms/" + roomId, message)
}
```
①과 결과는 같다. `@SendTo` 대신 직접 보내는 이유는 3단계에서 "보내는 방법"을 Hazelcast 로 **바꿔 끼우기** 위해서다.

### ③ `@SubscribeMapping` — 구독한 그 사람에게만 한 번
```java
@SubscribeMapping("/rooms/{roomId}/history")   // SUBSCRIBE /app/rooms/lobby/history
public List<ChatMessage> history(...)          // → 구독한 사람에게만 지난 대화를 한 번 보냄
```
입장 직후 "지난 대화 불러오기"에 딱 맞다.

### REST 컨트롤러와 비교
| | REST (`@RestController`) | STOMP (`@Controller` + `@MessageMapping`) |
|---|---|---|
| 받는 것 | HTTP 요청 | STOMP SEND 프레임 |
| 경로 변수 | `@PathVariable` | `@DestinationVariable` |
| 본문 | `@RequestBody` | `@Payload` |
| 반환값이 가는 곳 | **요청한 사람** | `@SendTo` 주소의 **구독자 전원** |

## 브라우저 쪽 (`chat.html`)
```js
const client = new StompJs.Client({ brokerURL: `ws://${location.host}/ws`, reconnectDelay: 3000 });
client.onConnect = () => {
  client.subscribe(`/topic/rooms/${room}`, (msg) => show(JSON.parse(msg.body)));   // 구독
};
client.activate();                                                                   // 연결
client.publish({ destination: `/app/rooms/${room}/send`, body: JSON.stringify({...}) });  // 보내기
```
- `reconnectDelay: 3000`: 끊기면 3초 뒤 자동 재연결. 재연결되면 `onConnect` 가 다시 불려 **다시 구독**한다(구독은 연결과 함께 사라지므로).
- `heartbeatIncoming/Outgoing: 10000`: 10초마다 "살아 있음" 신호. 조용히 끊긴 연결을 알아차리고, 중간 프록시가 조용한 연결을 끊지 않게 한다.

## ★ 함정: 빠르게 보낸 메시지의 순서가 섞인다

이 프로젝트를 만들면서 실제로 겪었다. 철수가 "하나, 둘, 셋"을 빠르게 보냈더니 지난 대화에 **"하나, 셋, 둘"** 로 저장됐다.

이유: Spring 은 **한 사람(한 연결)이 보낸 메시지들도 여러 스레드로 동시에** 처리한다(처리량을 높이려는 기본값).
"둘"을 처리하는 스레드가 조금 늦으면 "셋"이 먼저 저장·방송된다.
`Step2OrderTest` 실측: 300개를 빠르게 보내면 **119개**가 순서가 뒤바뀌어 도착했다.

해결 (`StompConfig.java`):
```java
registry.setPreserveReceiveOrder(true);   // 들어오는 방향: 한 연결의 메시지는 도착 순서대로 하나씩
registry.setPreservePublishOrder(true);   // 나가는 방향: 각 구독자에게도 순서대로
```
켠 뒤에는 0 / 300. 대가는 "한 연결 안에서는 병렬 처리를 안 한다"는 것 — 접속자가 많으면 전체 처리량에는 영향이 작다.

> 교훈: "TCP 는 순서를 지켜 주니까 괜찮겠지"는 틀릴 수 있다. TCP 는 **연결 안의 바이트** 순서만 지킨다. 서버 안의 스레드 처리 순서는 별개다.

## 직접 해 보기
1. http://localhost:8080/chat.html 탭 두 개 (이름을 철수/영희로) → 같은 방 `lobby` 로 연결 → 대화.
2. 세 번째 탭은 방을 `room2` 로 → `lobby` 메시지가 **안 온다**.
3. 오른쪽 로그에서 `>>> CONNECT`, `<<< CONNECTED`(heart-beat 값), `>>> SUBSCRIBE`, `>>> SEND`, `<<< MESSAGE` 를 찾아라.
4. 대화 후 네 번째 탭으로 `lobby` 에 들어가면 **지난 대화**가 보인다 (`@SubscribeMapping`).
5. "@SendTo 에코 시험" 버튼 → 로그의 `[/topic/echo 수신]`.
6. 서버를 Ctrl+C → 상태가 "끊김" → 다시 `./gradlew bootRun` → 자동 재연결 (단, 지난 대화는 메모리라 사라졌다).
7. (순서 실험) `StompConfig` 의 두 `setPreserve…(true)` 줄을 주석 처리하고 `./gradlew test --tests '*Step2OrderTest*'` → 실패하며 뒤바뀐 개수가 출력된다. 확인 후 원복.

## 확인 질문
1. 철수가 `/topic/rooms/lobby` 로 **직접** SEND 하면 어떻게 될까? 무엇이 문제일까?
2. 영희가 구독만 하고 아무 말도 안 하는데 어떻게 메시지를 받나?
3. 서버를 2대 띄우고 철수는 8081, 영희는 8082 에 붙으면 대화가 될까?

<details><summary>답</summary>

1. 컨트롤러를 거치지 않고 브로커가 바로 뿌린다 → 빈 메시지 검사·저장·이름 확인 같은 서버 로직을 건너뛴다. 실무에서는 인터셉터로 막는다 (chat-tutor 12장).
2. 연결이 열려 있으므로 서버가 먼저 MESSAGE 프레임을 보낸다.
3. 안 된다! 브로커는 "자기 서버"의 구독자만 안다 → 3단계.
</details>

다음 → [3단계 · Hazelcast](03-hazelcast.md)
