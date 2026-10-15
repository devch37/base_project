// ─────────────────────────────────────────────────────────────
// chat-tutor 의 Spring 서버 모듈 목록
//   장(chapter)이 진행될수록 앞 모듈의 개념을 "다시 구현"하며 쌓아 올린다.
//   모듈끼리 코드를 공유하지 않는 이유: 각 모듈을 그 장의 개념만으로
//   처음부터 끝까지 읽을 수 있게 하기 위해서다. (중복 < 읽기 쉬움)
// ─────────────────────────────────────────────────────────────
rootProject.name = "chat-tutor"

include(
    "server:spring-basics",   // 05~06장: Controller·DTO·DI·Bean·정책 교체·서버 간 HTTP 호출
    "server:raw-websocket",   // 07장: STOMP 없이 순수 WebSocket
    "server:stomp-chat",      // 08~09장: STOMP·Pub/Sub·heartbeat·연결 종료
    "server:secure-chat",     // 10~12장: JWT·내부 API 키·인터셉터·방/역할 권한·만료 처리
    "server:cobrowse-server", // 13~24장: 화면 동기화 중계·조각 전송·마스킹·Hazelcast 클러스터
)
