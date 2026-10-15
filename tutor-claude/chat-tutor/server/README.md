# server — Spring Boot 모듈 (Gradle 멀티 프로젝트, Java 21, Spring Boot 3.5)

각 모듈은 **그 장의 개념만으로** 처음부터 끝까지 읽을 수 있게 독립적으로 만들었다. 모듈끼리 코드를 공유하지 않는다(의도된 중복).

| 모듈 | 장 | 패키지 | 핵심 클래스 |
|---|---|---|---|
| `spring-basics` | 05~06 | `tutor.chat.basics` | RoomController, RoomService, PolicyConfig, CrmClient, GlobalExceptionHandler |
| `raw-websocket` | 07 | `tutor.chat.rawws` | WebSocketConfig, RoomHandler, KeepAliveTask |
| `stomp-chat` | 08~09 | `tutor.chat.stomp` | StompConfig, ChatController, PresenceTracker, NoticeRestController |
| `secure-chat` | 10~12 | `tutor.chat.secure` | JwtService, StompAuthInterceptor, DefaultRoomAccessPolicy, ExpiredSessionSweeper, InternalApiController |
| `cobrowse-server` | 13~24 | `tutor.chat.cobrowse` | CobrowseController, StompAuthInterceptor, StoreConfig, HazelcastMessageRelay, RoomStore, PresenceService |

```bash
./gradlew test                                   # 전체
./gradlew :server:<모듈>:test                     # 하나
./gradlew :server:<모듈>:bootRun                  # 실행 (모두 8080 — 하나씩)
./gradlew :server:cobrowse-server:bootJar         # build/libs/cobrowse-server.jar
```
