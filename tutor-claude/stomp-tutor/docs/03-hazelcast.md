# 3단계 · Hazelcast — 서버가 2대가 되면

## 문제: 브로커는 자기 서버의 구독자만 안다

사용자가 많아져 서버를 2대로 늘렸다. 로드밸런서가 철수는 8081, 영희는 8082 에 붙였다.

```
철수 ──▶ [서버 8081]  브로커 구독자 목록: 철수
영희 ──▶ [서버 8082]  브로커 구독자 목록: 영희

철수가 "안녕" → 8081 브로커: "/topic/rooms/lobby 구독자? 철수뿐" → 영희는 못 받음 ❌
```
실제로 확인했다: Hazelcast 없이 서버 2대를 띄우면 8081 의 철수 메시지가 8082 의 영희 화면에 **도착하지 않는다.**

같은 이유로 "최근 대화"(`HistoryStore`)도 서버마다 따로라서, 8082 에 새로 들어온 사람은 8081 에서 오간 대화를 못 본다.

## 해결: Hazelcast 로 서버들을 묶는다

**Hazelcast** = 여러 서버가 메모리를 함께 쓰게 해 주는 자바 라이브러리.
우리 Spring 앱 **안에서** 같이 실행된다(임베디드). 앱 2개를 띄우면 Hazelcast 멤버 2개가 서로를 찾아 하나의 **클러스터**가 된다.

이 프로젝트가 쓰는 Hazelcast 기능은 딱 두 개다.

| | **ITopic** (방송) | **IMap** (공유 저장소) |
|---|---|---|
| 비유 | 사내 방송 — 지금 듣는 사람만 듣는다 | 공용 게시판 — 나중에 와도 읽을 수 있다 |
| 저장? | 안 됨 | 됨 |
| 여기서 쓰는 곳 | 채팅 메시지를 **모든 서버에** 전달 | **최근 대화** 보관 |
| 코드 | `HazelcastChatBroadcaster` | `HistoryStore` + `hz.getMap("history")` |

### ITopic 으로 메시지 전달

```
철수 ─SEND─▶ 서버8081.ChatController ─▶ HazelcastChatBroadcaster.send()
                                            │ topic.publish(message)
                                            ▼
                               [ Hazelcast Topic "chat" ]
                                 │                    │
                                 ▼                    ▼
                        서버8081 리스너          서버8082 리스너
                        → 8081 브로커           → 8082 브로커
                        → 철수 ✅               → 영희 ✅
```
```java
// HazelcastChatBroadcaster 생성자: 모든 서버가 같은 Topic 을 구독한다
topic.addMessageListener(event -> {
    ChatMessage m = event.getMessageObject();
    template.convertAndSend("/topic/rooms/" + m.roomId(), m);   // 받은 서버가 "자기" 구독자에게
});

public void send(ChatMessage message) { topic.publish(message); }   // 보낼 때는 Topic 에만
```
**함정**: 보낸 서버(8081) 자신도 Topic 메시지를 받는다. 그래서 `send()` 에서 로컬 브로커로 **따로** 또 보내면 철수는 같은 메시지를 **두 번** 받는다.
테스트 `A에_붙은_철수의_메시지가_B에_붙은_영희에게_한_번만_간다_Topic` 이 "한 번만"을 확인한다.

### IMap 으로 최근 대화 공유

```java
public HistoryStore(ConcurrentMap<String, List<ChatMessage>> map) { ... }
```
- 서버 1대: `new ConcurrentHashMap<>()`
- 서버 N대: `hz.getMap("history")` — **IMap 은 ConcurrentMap 을 구현**한다. 그래서 `HistoryStore` 코드는 똑같다.

```java
map.compute(roomId, (room, old) -> { 새 리스트 = old + 새 메시지; return 새 리스트; });
```
- `compute`: 읽고-고치고-쓰기를 **한 번에**. 두 서버가 동시에 추가해도 하나가 사라지지 않는다.
- 리스트를 직접 `old.add()` 하지 않는 이유: IMap 에서 꺼낸 값은 **복사본**이라 고쳐도 저장되지 않는다. 새 값으로 바꿔 넣어야 한다.

### `ChatMessage` 가 `Serializable` 인 이유
Hazelcast 는 메시지·값을 **다른 서버로 네트워크 전송**한다 → 바이트로 바꿀 수 있어야 한다.

## 설정 하나로 바꿔 끼우기 (`BroadcastConfig.java`)

```
app.hazelcast.enabled=false (기본) → LocalChatBroadcaster     + HistoryStore(ConcurrentHashMap)
app.hazelcast.enabled=true         → HazelcastChatBroadcaster + HistoryStore(IMap) + HazelcastInstance
```
`ChatController` 는 `ChatBroadcaster`(인터페이스)와 `HistoryStore` 만 알기 때문에 **한 줄도 바뀌지 않는다.**
이것이 Spring 의 DI(의존성 주입) + 인터페이스가 실무에서 빛나는 순간이다.

Hazelcast 설정에서 볼 것:
- `clusterName`: 같은 이름끼리만 합쳐진다 (다른 사람 개발 서버와 섞이지 않게)
- `setPort(5701).setPortAutoIncrement(true)`: Hazelcast 끼리 대화하는 포트. **HTTP 포트(8081·8082)와 별개**다. 두 번째 서버는 5702 를 쓴다.
- `tcpIp members`: 서로의 주소를 직접 적는다 (자동 탐색(멀티캐스트)은 회사망·클라우드에서 막힌 경우가 많다)

## 직접 해 보기
```bash
./gradlew bootJar
PORT=8081 HAZELCAST=true java -jar build/libs/stomp-tutor.jar     # 터미널 1
PORT=8082 HAZELCAST=true java -jar build/libs/stomp-tutor.jar     # 터미널 2
curl localhost:8082/api/info        # {"hazelcast":true,"clusterMembers":2,...}
```
1. http://localhost:8081/chat.html (철수) 와 http://localhost:8082/chat.html (영희) → 같은 방 → 대화.
   메시지 옆 **(서버 8081 이 받음)** — 8082 의 영희에게 8081 을 거쳐 왔다.
2. 8081 에서 몇 마디 → 8082 로 **새 탭**을 열어 입장 → 지난 대화가 보인다 (IMap).
3. **비교**: 두 서버를 끄고 `HAZELCAST=true` 를 빼고 다시 띄운다 → 철수와 영희가 서로 못 듣는다.
4. **장애**: Hazelcast 모드에서 8081 터미널을 Ctrl+C → 철수 화면은 "끊김"(3초마다 재연결 시도). 8082 의 영희는 계속 대화 가능.
   8082 로 새 탭을 열면 지난 대화가 **남아 있다** — IMap 이 데이터를 다른 서버에 **백업**해 두기 때문(기본 백업 1개).
   다시 8081 을 띄우면 철수가 자동 재연결된다.

## 확인 질문
1. Topic 과 IMap 중, "방에 지금 누가 있는지" 정보는 어디에 두는 게 맞을까?
2. `send()` 에서 `topic.publish()` 와 함께 로컬 브로커에도 보내면?
3. 서버를 3대로 늘리려면 코드를 고쳐야 하나?

<details><summary>답</summary>

1. IMap — 저장되어 나중에 조회해야 하는 "상태"이므로. (단, 서버가 죽으면 그 서버가 지워 줄 수 없으니 TTL(유통기한)을 함께 건다 → chat-tutor 23장)
2. 보낸 서버에 붙은 사람은 같은 메시지를 두 번 받는다.
3. 아니다. `PORT=8083 HAZELCAST=true` 로 하나 더 띄우면 된다 (members 목록에 5703 이 이미 있다).
</details>

다음 → [4 · 다음 단계](04-next.md)
