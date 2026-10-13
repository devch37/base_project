# stomp-tutor — WebSocket · STOMP · Hazelcast 를 작은 채팅 앱 하나로

`chat-tutor` 가 너무 크게 느껴질 때 먼저 하는 **워밍업 프로젝트**다.
Spring Boot 앱 **하나**(모듈 1개, Node·Vite 없음, HTML 도 Spring 이 직접 서빙)로 세 가지를 차례대로 배운다.

```
1단계 WebSocket   브라우저 ⇄ 서버 사이에 "계속 열려 있는 양방향 관"을 만든다
2단계 STOMP       그 관 위에 "주소(방)·구독·보내기" 규칙을 얹는다
3단계 Hazelcast   서버를 2대로 늘려도 다른 서버 사용자끼리 대화되게 한다
```

## 바로 실행

```bash
cd stomp-tutor
./gradlew bootRun          # 처음엔 의존성 다운로드로 1~2분
```
브라우저에서 http://localhost:8080 → 1단계, 2단계 링크.

서버 2대(3단계):
```bash
./gradlew bootJar
PORT=8081 HAZELCAST=true java -jar build/libs/stomp-tutor.jar     # 터미널 1
PORT=8082 HAZELCAST=true java -jar build/libs/stomp-tutor.jar     # 터미널 2
```
http://localhost:8081/chat.html 과 http://localhost:8082/chat.html 을 각각 열고 같은 방에서 대화.

테스트: `./gradlew test` (1·2·3단계 8개, 3단계는 한 JVM 에 서버 2대를 띄워 확인)

## 공부 순서

| 순서 | 문서 | 코드 | 브라우저 |
|---|---|---|---|
| 1 | [docs/01-websocket.md](docs/01-websocket.md) | `step1_websocket/` (2개 파일) | `/raw.html` |
| 2 | [docs/02-stomp.md](docs/02-stomp.md) | `step2_stomp/` (4개 파일) | `/chat.html` |
| 3 | [docs/03-hazelcast.md](docs/03-hazelcast.md) | `step3_hazelcast/` (5개 파일) | 8081, 8082 의 `/chat.html` |
| 4 | [docs/04-next.md](docs/04-next.md) | — | chat-tutor 의 어느 장으로 이어지는지 |

## 전체 구조 (핵심 파일은 이게 전부)

```
stomp-tutor/
├─ build.gradle.kts                      의존성: web, websocket, hazelcast
├─ src/main/resources/application.yml    포트·Hazelcast 켜기/끄기
├─ src/main/resources/static/            브라우저 화면 (Spring 이 그대로 서빙)
│   ├─ index.html   raw.html(1단계)   chat.html(2·3단계)   style.css
└─ src/main/java/tutor/stomp/
    ├─ StompTutorApplication.java
    ├─ ServerInfo.java                  GET /api/info — 지금 몇 번 서버? 클러스터 멤버 수?
    ├─ step1_websocket/
    │   ├─ RawWebSocketConfig.java      /ws-raw 주소 등록
    │   └─ RawChatHandler.java          접속자 목록 + 전원에게 보내기 (직접 구현)
    ├─ step2_stomp/
    │   ├─ StompConfig.java             /ws 엔드포인트, /app·/topic 규칙
    │   ├─ ChatController.java          @MessageMapping, @SendTo, @SubscribeMapping
    │   ├─ ChatMessage.java · SendRequest.java
    └─ step3_hazelcast/
        ├─ ChatBroadcaster.java         "방송" 인터페이스
        ├─ LocalChatBroadcaster.java    서버 1대: 이 서버 브로커로
        ├─ HazelcastChatBroadcaster.java 서버 N대: Hazelcast Topic 으로 모든 서버에
        ├─ HistoryStore.java            최근 대화: ConcurrentHashMap 또는 Hazelcast IMap
        └─ BroadcastConfig.java         설정값 하나로 위 Bean 들을 골라 끼움
```

## 메시지 한 개가 지나가는 길 (이것만 이해하면 끝)

```
[철수 브라우저]  SEND /app/rooms/lobby/send  {"sender":"철수","text":"안녕"}
      │
      ▼
ChatController.send()            ← /app 으로 온 것은 컨트롤러가 먼저 받는다
      │ history.add()            ← 최근 대화 저장
      │ broadcaster.send()
      ▼
(서버 1대) LocalChatBroadcaster ─────────────────────────▶ 브로커 ─▶ /topic/rooms/lobby 구독자 전원
(서버 N대) HazelcastChatBroadcaster ─▶ Hazelcast Topic ─▶ 각 서버 ─▶ 각 서버의 브로커 ─▶ 그 서버의 구독자
      │
      ▼
[영희 브라우저]  MESSAGE /topic/rooms/lobby  {"sender":"철수","text":"안녕","receivedBy":8081,...}
```

## 검증한 것
- `./gradlew test` 8개 통과 (실제 WebSocket 연결, 실제 Hazelcast 2노드, 메시지 순서)
- 실제 Chromium 으로: 서버 2대(8081·8082, Hazelcast) 에서 8081 의 철수 → 8082 의 영희 전달, 늦게 들어온 사람의 지난 대화, `@SendTo` 에코, raw.html
- 8081 을 끈 뒤에도 8082 에서 지난 대화가 **순서대로** 남아 있는 것 (IMap 백업)
- 반대로 Hazelcast **없이** 서버 2대를 띄우면 8081 의 메시지가 8082 사용자에게 **도착하지 않는 것**도 확인

`chat.html` 은 STOMP 클라이언트 라이브러리를 CDN(jsdelivr)에서 받는다 → 인터넷 연결 필요.
