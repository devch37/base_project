# 4 · 다음 단계 — chat-tutor 로 이어가기

stomp-tutor 에서 익힌 것이 chat-tutor 의 어디로 확장되는지 정리했다.
이제 chat-tutor 의 같은 장을 읽으면 "아, 그때 그거구나" 하고 이어질 것이다.

| stomp-tutor 에서 본 것 | chat-tutor 에서 더 깊게 | 무엇이 추가되나 |
|---|---|---|
| `RawChatHandler` (1단계) | 07장 · `server/raw-websocket` | ping/pong 으로 죽은 연결 정리, close code, Origin 검사 테스트 |
| `StompConfig`, `ChatController` (2단계) | 08장 · `server/stomp-chat` | `/user/queue` 개인 메시지, 오류 처리(`@MessageExceptionHandler`), 입장·퇴장(presence) |
| stompjs `reconnectDelay`, heartbeat | 09장 | heartbeat 협상 규칙, 지수 백오프 + jitter, 놓친 메시지 채우기 |
| "누구나 아무 방에나 보낼 수 있음" | 10~12장 · `server/secure-chat` | JWT 로그인, 인터셉터로 방·역할 권한 검사, `/topic` 직접 SEND 차단, 토큰 만료 |
| `ChatBroadcaster` 인터페이스 (3단계) | 23장 · `MessageRelay` | 같은 구조 + 강제 퇴장 같은 "제어 명령"도 모든 서버에 방송 |
| `HistoryStore` + IMap (3단계) | 23장 · `RoomStore`, `PresenceStore` | 방·배정 정보 공유, presence 에 TTL |
| `setPreserveReceiveOrder` (2단계 함정) | 19장 | 순서 번호(seq)로 받는 쪽에서도 확인, 빠진 메시지 감지·재동기화 |
| 8081 을 껐다 켜기 (3단계) | 24장 | 강제 종료(kill -9)·TTL·재동기화, 장애 유형별 표 |
| 채팅 메시지 | 13~19장 | 채팅 대신 **화면(DOM)** 을 보내는 화면 공유 |

## stomp-tutor 에서 일부러 뺀 것 (그래서 단순하다)
- **인증·권한**: 누구나 아무 이름·아무 방으로 접속 가능 → 실서비스에서는 절대 안 됨 (chat-tutor 10~12장)
- **메시지 크기 제한**: Tomcat 기본 8KB (chat-tutor 18장)
- **TTL·장애 정리**, 오류 응답 채널, Origin 검사 테스트 등

## 추천 순서
1. stomp-tutor 1→2→3단계 (반나절~하루)
2. chat-tutor `LEARNING_GUIDE.md` 의 1단계(01~06)는 아는 부분이면 빠르게
3. chat-tutor 07~09 → stomp-tutor 와 비교하며 읽기
4. chat-tutor 10~12 (보안) → 13~19 (화면 동기화) → 20~24
