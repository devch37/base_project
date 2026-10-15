# 00. 큰 그림 — 우리가 만드는 것

## 한 문장으로

> 고객이 보험 가입 화면에서 막히면, **상담사가 그 화면을 실시간으로 함께 보면서** 채팅하고,
> 고객이 허락하면 **상담사가 대신 클릭·입력**해 줄 수 있는 "화면 공유(co-browsing) 상담" 솔루션.

영상(화면 녹화)을 보내는 방식이 아니다. 고객 브라우저의 **DOM(화면을 이루는 요소 트리)을 JSON 으로 직렬화**해서 보내고,
상담사 브라우저가 그것으로 **똑같은 DOM 을 다시 만든다.** 그래서 글자가 선명하고, 데이터가 작고, 주민번호 같은 칸만 골라 가릴 수 있다.

## 등장인물

```
┌──────────────────────────────┐                           ┌──────────────────────────────┐
│ 고객 브라우저                    │                           │ 상담사 브라우저                   │
│  보험 가입 페이지 (고객사 사이트)   │                           │  상담사 콘솔 (우리 제품)          │
│  + 우리 SDK (web/sdk)          │                           │  + 우리 SDK (CobrowseAgent)     │
│    Recorder: DOM 변화 기록      │                           │    Mirror: iframe 에 DOM 재현   │
│    RemoteControl: 명령 적용     │                           │    Overlay: 고객 커서 그리기      │
└──────────────┬───────────────┘                           └──────────────┬───────────────┘
               │ ① 로그인/상담 시작                                         │ ① 상담사 로그인
               ▼                                                          ▼
┌──────────────────────────────┐   ② X-Api-Key 로 방 생성·토큰 발급   ┌───────────────────────┐
│ 고객사 백엔드                    │ ─────────────────────────────────▶ │                       │
│ (web/tenant-backend, Node)    │ ◀───────────────── JWT ─────────── │                       │
└──────────────────────────────┘                                     │  cobrowse-server       │
               ③ 브라우저는 JWT 를 들고 WebSocket(STOMP) 연결 ──────────▶ │  (Spring Boot)        │
                                                                     │                       │
                                                                     │  서버가 여러 대면       │
                                                                     │  Hazelcast 로 연결     │
                                                                     └───────────────────────┘
```

- **고객사 백엔드**: 우리 솔루션을 "도입한 회사"(예: ACME 보험)의 서버. 고객이 누구인지 알고, 우리 서버의 **내부 API 키**를 갖고 있다.
- **cobrowse-server**: 우리 제품의 서버. 화면 데이터를 **해석하지 않고 중계**한다. 누가 어느 방에서 무엇을 할 수 있는지 검사한다.
- **SDK**: 고객사 웹페이지에 "끼워 넣는" 우리 JS. 고객사 개발자는 SDK 의 공개 API 만 안다.

## 메시지가 흐르는 길 (STOMP 주소)

| 방향 | 보내는 주소 (SEND) | 받는 주소 (SUBSCRIBE) | 누가 보내나 | 장 |
|---|---|---|---|---|
| 화면 | `/app/cobrowse/{room}/frame` | `/topic/cobrowse/{room}/screen` | 고객 → 상담사 | 15~19 |
| 원격 명령 | `/app/cobrowse/{room}/command` | `/topic/cobrowse/{room}/commands` | 상담사 → 고객 | 17 |
| 재동기화 요청 | `/app/cobrowse/{room}/resync` | (commands 로 전달) | 상담사 → 고객 | 19 |
| 원격 조작 동의 | `/app/cobrowse/{room}/consent` | `/topic/rooms/{room}/status` | 고객 → 모두 | 17 |
| 채팅 | `/app/rooms/{room}/chat` | `/topic/rooms/{room}/chat` | 양쪽 | 08 |
| 상담 종료 | `/app/rooms/{room}/close` | `/topic/rooms/{room}/status` | 상담사 | 12 |
| 토큰 갱신 | `/app/token/refresh` | `/user/queue/token` | 양쪽 | 12 |
| 개인 오류 | — | `/user/queue/errors` | 서버 → 그 사람만 | 08 |

`/app` 으로 보내면 **서버 코드(컨트롤러)가 먼저** 받고, `/topic` 은 **구독자 전원에게** 간다. (08장)

## 한 번의 상담이 진행되는 순서

```
고객                      고객사 백엔드              cobrowse-server                  상담사
 │ "상담 시작" 클릭              │                        │                              │
 │──POST /tenant/customer/session──▶                      │                              │
 │                              │──POST /internal/rooms──▶│ 방 생성 (RoomStore)            │
 │                              │──POST /internal/tokens─▶│ JWT 발급 (JwtService)          │
 │◀──────── roomId + JWT ───────│                        │                              │
 │══ WebSocket + STOMP CONNECT (Authorization: Bearer JWT) ══▶ 검증 (StompAuthInterceptor) │
 │── SUBSCRIBE /topic/cobrowse/{room}/commands ──────────▶│                              │
 │── SEND frame (snapshot) ─────────────────────────────▶│ (아직 보는 사람 없음)            │
 │                              │                        │◀── 상담사 로그인·배정·CONNECT ──│
 │                              │                        │◀── SUBSCRIBE .../screen ───────│
 │◀── commands: {type:"resync", reason:"viewer-joined"} ─│ (PresenceService)             │
 │── SEND frame (snapshot, 새 epoch) ───────────────────▶│── MESSAGE .../screen ────────▶│ iframe 에 화면 생성
 │ (고객이 입력·스크롤·DOM 변경)                            │                              │
 │── SEND frame (mutation/input/scroll, seq 2,3,4…) ────▶│── MESSAGE ──────────────────▶│ 변경분 적용
 │── SEND consent {remoteControl:true} ─────────────────▶│── status ───────────────────▶│ "조작 허용됨"
 │◀── commands: {type:"click", id:42, by:"agent-1"} ─────│◀── SEND command ──────────────│ 상담사가 클릭
 │ (실제로 클릭됨 → DOM 이 바뀜 → mutation 프레임으로 다시 상담사에게)                            │
```

## 이 튜토리얼에서 만드는 서버 모듈 (각 장의 개념만으로 처음부터 다시 만든다)

| 모듈 | 장 | 무엇을 보여 주나 |
|---|---|---|
| `server/spring-basics` | 05~06 | REST, DTO, DI, 고객사 정책 Bean 교체, 서버 간 호출(타임아웃·재시도) |
| `server/raw-websocket` | 07 | STOMP 없는 WebSocket — 규칙을 직접 발명해야 하는 불편함 |
| `server/stomp-chat` | 08~09 | STOMP 방 채팅, heartbeat, 입장/퇴장, 놓친 메시지 |
| `server/secure-chat` | 10~12 | JWT, 내부 API 키, 인터셉터 인가, 토큰 만료 처리 |
| `server/cobrowse-server` | 13~24 | 최종: 화면 중계, 원격 명령, 크기·순서 보장, Hazelcast 클러스터 |

브라우저 쪽은 `web/` 하나에 모았다: `web/sdk`(SDK), `web/apps`(고객 페이지·상담사 콘솔), `web/labs`(장별 실습 페이지), `web/tenant-backend`(고객사 백엔드 흉내).

## 이 튜토리얼이 "실측"으로 확인한 사실들

문서의 주장 중 일부는 테스트로 직접 확인했다. 직접 돌려 보면 같은 결과가 나와야 한다.

| 사실 | 확인한 곳 |
|---|---|
| Tomcat 의 WebSocket 텍스트 버퍼 기본값은 8KB — 20KB 메시지는 Spring 에 닿기도 전에 1009 로 끊긴다 | `server/stomp-chat/.../MessageSizeTest` |
| 인터셉터에서 거부하면 ERROR 프레임 뒤 **연결 전체**가 닫힌다 (기본 설정) | `server/secure-chat/.../SecureStompTest` |
| Spring 은 기본적으로 한 연결의 메시지도 병렬 처리해 순서가 뒤바뀐다 (2000개 중 447개), 순서 보존을 켜면 0개 | `server/cobrowse-server/.../OrderingTest` |
| 순서 보존(preserveReceiveOrder)을 켜면 인터셉터 예외가 ERROR 프레임으로 가지 않는다 → 서버가 직접 소켓을 닫아야 한다 | `cobrowse-server` `StompAuthInterceptor` 주석, `CobrowseFlowTest` |
| Origin 헤더 없는 클라이언트(Node 등)는 Origin 검사를 그냥 통과한다 → Origin 검사는 인증을 대신할 수 없다 | `npm run lab:07` |
| 고객은 서버 A, 상담사는 서버 B 에 붙어도 화면이 오가고, A 를 강제 종료해도 고객이 B 로 재연결해 화면이 다시 맞춰진다 | `web/e2e/cluster.e2e.ts` |

다음: [LEARNING_GUIDE.md](../LEARNING_GUIDE.md) 의 1단계부터.
