# 문제 해결

## 실행·환경

| 증상 | 원인 | 해결 |
|---|---|---|
| `Port 8080 is already in use` | 다른 서버 모듈(또는 다른 프로그램)이 8080 사용 중 | `lsof -nP -iTCP:8080 -sTCP:LISTEN` 으로 찾아 끄기. 모듈은 한 번에 하나만 |
| `Port 5173 is in use` (Vite strictPort) | 이미 `npm run dev` 가 떠 있음 | 기존 것을 쓰거나 끄기 |
| `./gradlew: Permission denied` | 실행 권한 없음 | `chmod +x gradlew` |
| Gradle 이 오래 멈춤 | 처음 의존성 다운로드 | 기다리기. 사내망이면 프록시 설정 |
| `Unsupported class file major version` | JDK 가 21 이 아님 | `java -version` 확인, JDK 21 설치 |
| `WebSocket is not defined` (Node 스크립트) | Node 21 이하 | Node 22 이상 |
| e2e: `Executable doesn't exist … chromium` | Playwright 브라우저 미설치 | `npx playwright install chromium` |
| e2e: `jar 없음` | JAR 를 안 만듦 | `./gradlew :server:cobrowse-server:bootJar` |

## 연결

| 증상 | 원인 | 해결 |
|---|---|---|
| 브라우저 WebSocket 핸드셰이크 403 | Origin 이 허용 목록에 없음 | `CHAT_ALLOWED_ORIGINS` 확인 (22장) |
| WebSocket 이 열리자마자 1009 로 닫힘 | 메시지가 한도 초과 (Tomcat 8KB 등) | 18장 크기 표: 서버 버퍼·STOMP 한도·SDK 조각 크기 |
| 일정 시간 조용하면 1006 으로 끊김 | 프록시 idle timeout > heartbeat 협상 주기 | 21장: heartbeat 주기를 프록시 timeout 보다 짧게 |
| CONNECT 했는데 아무 응답이 없다 | 인터셉터가 예외만 던지고 소켓을 안 닫음 (순서 보존 모드) | 12·19장: 거부 시 소켓 직접 종료 |
| 남의 방 구독 후 연결이 통째로 끊김 | STOMP ERROR = 연결 종료 (정상 동작) | 권한 없는 주소를 구독하지 않게 클라이언트 수정 |
| 연결은 됐는데 메시지가 안 온다 | 재연결 후 재구독 누락 / 주소 오타 / SUBSCRIBE 가 도착하기 전에 SEND | `protocol.ts` 의 `dest` 상수 사용, 재구독 확인 |
| 상담사 콘솔이 code 4003 으로 멈춤 | 배정 해제·강제 퇴장 (재연결 안 하는 게 정상) | 다시 배정받고 입장 |
| 40초마다 4001 로 끊김 | `?ttl=40` 으로 짧은 토큰 + 갱신 실패 | 고객사 백엔드(`npm run tenant`)가 떠 있는지 |

## 화면 동기화

| 증상 | 원인 | 해결 |
|---|---|---|
| 상담사 화면이 흰색 | 아직 스냅샷 전 / 고객이 오프라인 | 상담사 콘솔 "화면 다시 받기", 고객 위젯 상태 확인 |
| 이미지·CSS 가 깨짐 | 상대 URL·로그인 필요한 자원·CDN 제한 | 16장 표 |
| 입력값만 안 맞음 | property 변경이 input 이벤트 없이 일어남 (스크립트가 `.value=`) | 다음 스냅샷에서 맞춰짐. "화면 다시 받기" |
| 상담사 클릭이 안 먹음 | 고객이 원격 조작 미허용 → 가리키기만 됨 | 고객 위젯 "상담사 조작 허용" |
| 스크롤이 덜덜 떨림 | 에코 루프 | 17장 EchoGuard |
| 순서 뒤바뀜 카운트가 계속 오름 | 서버 순서 보존 꺼짐 | `chat.preserve-order: true` (19장) |

## 클러스터

| 증상 | 원인 | 해결 |
|---|---|---|
| `clusterMembers: 1` 에서 안 늘어남 | Hazelcast 포트·멤버 목록 불일치, 방화벽 | `CHAT_CLUSTER_PORT` 를 노드마다 다르게, `CHAT_CLUSTER_MEMBERS` 에 모두 포함 |
| 남의 개발 서버와 클러스터가 합쳐짐 | 같은 clusterName + 같은 네트워크 | `chat.cluster.name` 을 바꾸기 |
| 상담사가 방을 모른다고 거부됨 | 서버를 클러스터 모드가 아니게 띄움 | 두 서버 모두 `CHAT_CLUSTER_ENABLED=true` |
| 같은 메시지가 두 번 옴 | Topic 발행 + 로컬 직접 전송 (코드를 고쳤다면) | 23장 `HazelcastMessageRelay` 주석 |
