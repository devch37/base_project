# 📦 websocket 패키지 (`@tutor/ws-kit`)

> **WebSocket 을 원리부터 분산 운영까지.** 9개 장 + 실무형 미니 라이브러리(`src/`) + 55개 테스트.
> 이 패키지의 `src/` 는 **WebRTC 시그널링 서버의 기반**으로 그대로 쓰입니다 (webrtc 패키지).

## 학습 순서

| 단계 | 장 | 주제 | 핵심 질문 | 실행 |
|---|---|---|---|---|
| 🟢 basic | [01](./1-basic/01-handshake-echo) | 핸드셰이크·프레임 | WebSocket 은 HTTP 와 뭐가 다른가? 한 메시지는 선로에서 어떻게 생겼나? | `npm run ws:01` |
| | [02](./1-basic/02-message-protocol) | 메시지 프로토콜 | 봉투·검증·요청/응답을 어떻게 설계하나? | `npm run ws:02` |
| | [03](./1-basic/03-rooms-broadcast) | 방과 브로드캐스트 | 누구에게 보내고, 끊기면 어떻게 정리하나? | `npm run ws:03` |
| 🟡 intermediate | [04](./2-intermediate/04-heartbeat-reconnect) | 하트비트·재연결 | 조용히 죽은 연결을 어떻게 알아채고, 어떻게 다시 붙나? | `npm run ws:04` |
| | [05](./2-intermediate/05-auth-security) | 인증·보안 | 헤더를 못 붙이는데 인증은? CSWSH 는? | `npm run ws:05` |
| | [06](./2-intermediate/06-backpressure-ratelimit) | 백프레셔·속도 제한 | 느린 클라이언트 1명이 서버를 죽이지 못하게 | `npm run ws:06` |
| 🔴 advanced | [07](./3-advanced/07-reliable-delivery) | 신뢰성 전달 | 끊긴 사이의 메시지는? "정확히 한 번"은? | `npm run ws:07` |
| | [08](./3-advanced/08-scale-out-redis) | **스케일 아웃(Redis)** | 서버가 3대면? 한 대가 죽으면? | `npm run ws:08` |
| | [09](./3-advanced/09-production) | **운영** | 무중단 배포, 용량, 모니터링, 부하 테스트 | `npm run ws:09` · `ws:09:load` |

각 장은 `README.md`(개념·심화) + 주석이 풍부한 코드 + `demo.ts`(한 방에 실행) 로 구성됩니다. **README 를 먼저 읽고 → demo 를 실행하고 → 코드를 읽고 → 장 끝의 "직접 해 보기"** 를 하세요.

```bash
npm install            # 루트에서 한 번
npm run ws:01          # 1장부터
npm test -w @tutor/ws-kit    # 55개 테스트 (redis-server 가 있으면 분산 테스트도 실제 Redis 로)
```

---

## 1. WebSocket 한눈에 보기

### 언제 쓰나 — 선택 가이드

| 요구 | 추천 | 이유 |
|---|---|---|
| 서버→클라 알림만 (피드, 진행률, 알림) | **SSE** | HTTP 그대로, 자동 재연결, 프록시 친화. 단방향이면 더 단순 |
| 양방향 + 낮은 지연 (채팅, 협업, 게임, 시그널링) | **WebSocket** | 이 패키지 |
| 요청/응답 위주, 가끔 갱신 | HTTP + polling / long-polling | 상태 없는 인프라, 캐시 가능 |
| 서버 간 스트리밍 RPC | gRPC (HTTP/2) | 스키마, 양방향 스트림 |
| 비신뢰 데이터그램, HOL 블로킹 회피 | WebTransport / WebRTC DataChannel | UDP 계열 |
| 브라우저 ↔ 브라우저 직접(P2P), 미디어 | **WebRTC** | webrtc 패키지 |

### 라이브러리 선택

| | `ws` (이 튜토리얼) | Socket.IO | uWebSockets.js | 브라우저 네이티브 |
|---|---|---|---|---|
| 성격 | 순수 WebSocket 구현 | 자체 프로토콜 + 기능 풍부 | C++ 기반 초고성능 | 클라이언트만 |
| 프로토콜 호환 | 표준 (어떤 클라이언트와도) | **Socket.IO 서버/클라이언트끼리만** | 표준 | 표준 |
| 룸/ack/재연결 | 직접 구현 (이 튜토리얼) | 내장 | 직접/일부 | 직접 |
| 폴백 | 없음 | long-polling 폴백 | 없음 | — |
| 선택 | 원리 학습 + 가볍게 필요한 것만 | 빠르게 만들고 싶을 때 | 극한의 연결 수/처리량 | — |

> Socket.IO 는 훌륭하지만 "WebSocket 이 아니라 Socket.IO 프로토콜"입니다. 표준 WebSocket 클라이언트(모바일 네이티브, 서드파티)와 호환이 필요하면 `ws` 계열이 낫고, 이 튜토리얼은 **원리를 이해해야 어떤 도구를 써도 문제를 풀 수 있기 때문에** `ws` 를 택했습니다.

---

## 2. 라이브러리 지도 (`src/`)

1~7장에서 배운 조각들이 `src/` 에서 **하나의 서버**로 조립됩니다.

```
src/
├─ protocol.ts    봉투(Envelope) + zod 검증                         ← 2장
├─ errors.ts      close code 정책, WsError/AuthError                ← 1·4장
├─ auth.ts        ticket 발급/검증(HMAC), Origin 검사, 1회용 저장소   ← 5장
├─ ratelimit.ts   토큰 버킷                                         ← 6장
├─ connection.ts  연결 래퍼: 송신 한계(soft/hard), 속도 제한 상태      ← 6장
├─ hub.ts         방/브로드캐스트/1:1 라우팅 (노드 간 포함)           ← 3·8장
├─ bus.ts         MemoryBus / RedisBus(Pub/Sub, Sharded)            ← 8장
├─ presence.ts    Memory / RedisPresence (TTL, 유령 정리)            ← 8장
├─ server.ts      WsServer: 업그레이드 검사 + 하트비트 + 라우팅 + 우아한 종료 ← 4·5·9장
├─ metrics.ts     Prometheus 지표                                   ← 9장
├─ reliable.ts    ReplayLog / SeqTracker (브라우저 겸용)              ← 7장
└─ client.ts      WsClient: 재연결·앱 ping·요청/응답·방 자동 재입장    ← 2·4·7장 (브라우저 겸용)
```

### 서버 사용 예

```ts
import { WsServer, RedisBus, RedisPresence, verifyTicket } from '@tutor/ws-kit';

const server = new WsServer({
  port: 8080,
  allowedOrigins: ['https://app.example.com'],
  authenticate: (_req, url) => ({ userId: verifyTicket(url.searchParams.get('ticket'), SECRET).sub }),
  bus: new RedisBus(REDIS_URL),                 // 다중 노드. 생략하면 단일 노드(메모리)
  presence: new RedisPresence(REDIS_URL),
});

server.on('chat.send', async (ctx) => {          // 타입별 핸들러 (id 가 있으면 reply 가 응답이 된다)
  const { room, text } = parsePayload(schema, ctx.msg.payload);
  await ctx.hub.broadcast(room, { v: 1, type: 'chat.message', room, from: ctx.conn.id, payload: { text } });
  ctx.reply({ ok: true });
});
await server.start();
// SIGTERM → await server.close({ graceMs: 10_000, reconnectJitterMs: 5_000 })
```

내장 핸들러: `ping`, `room.join`, `room.leave`, `room.message`, `room.direct`(1:1 — WebRTC 시그널링에 사용).

### 클라이언트 사용 예 (브라우저/Node 공통)

```ts
import { WsClient } from '@tutor/ws-kit/client';

const client = new WsClient({
  url: async () => `wss://example.com/ws?ticket=${await fetchTicket()}`,   // 재연결마다 새 ticket
});
client.on('message', (e) => console.log(e));
client.on('reconnecting', ({ attempt, delayMs }) => console.log('재연결', attempt, delayMs));
await client.connect();
await client.joinRoom('lobby');                    // 재연결 후 자동 재입장
const res = await client.request('chat.send', { room: 'lobby', text: 'hi' });   // await 가능한 요청/응답
```

---

## 3. 개념 치트시트

| 주제 | 한 줄 | 장 |
|---|---|---|
| 핸드셰이크 | `Upgrade: websocket` → `101` + `Sec-WebSocket-Accept` | 1 |
| 프레임 | opcode, FIN, MASK(클라→서버 필수), 길이 7/16/64비트 | 1 |
| close code | 1000 정상, 1001 이탈, 1006 비정상(전송 불가·관측값), 4000+ 앱 정의 | 1·4 |
| 메시지 봉투 | `{v, type, id, replyTo, payload, error}` | 2 |
| 상관관계 ID | 요청 id ↔ 응답 replyTo, 타임아웃 필수 | 2 |
| 방 | 두 방향 인덱스, 빈 방 삭제, 끊김 시 정리 | 3 |
| half-open | TCP 가 모르는 죽은 연결 → ping/pong + terminate | 4 |
| 재연결 | 지수 백오프 + **지터**, close code 별 정책, 성공은 welcome 후 | 4 |
| CSWSH | WebSocket 은 CORS 없음 → **Origin 검사** | 5 |
| ticket | 짧은 수명 + 1회용, 업그레이드 시점 검증 | 5 |
| 백프레셔 | `send()` 즉시 리턴 → `bufferedAmount` 한계, conflation | 6 |
| seq/resume | at-least-once, 재생 버퍼, gap → 스냅샷 | 7 |
| 멱등성 키 | 재시도해도 부수효과 한 번 | 7 |
| 스케일 아웃 | Bus(Pub/Sub) + Presence(TTL) + LB | 8 |
| 우아한 종료 | readyz 503 → shutdown 알림+지터 → 1012 | 9 |

---

## 4. FAQ

**Q. 브라우저에서 헤더를 못 붙이는데 JWT 는 어떻게 보내나요?** → 5장. HTTP 로 단기 1회용 ticket 을 받아 `?ticket=` 으로 접속.

**Q. WebSocket 은 HTTP/2 에서 동작하나요?** → RFC 8441 로 가능하지만 대부분의 환경에선 HTTP/1.1 업그레이드를 씁니다. LB 가 HTTP/2 를 종단한다면 백엔드와는 HTTP/1.1 로 업그레이드하는 설정이 필요할 수 있습니다.

**Q. 연결을 몇 개까지 받을 수 있나요?** → 9장 `loadtest.ts` 로 *직접 재세요*. 이 환경에서 유휴 연결당 ≈ 11KB, 3000명 팬아웃 ≈ 16ms. 실제 한계는 FD·메모리·팬아웃 CPU.

**Q. 서버를 늘리면 sticky session 이 필요한가요?** → 순수 WebSocket 은 불필요. 상태를 Redis 에 두면 더욱 불필요 (8장).

**Q. 메시지를 절대 잃으면 안 되는데?** → WebSocket 은 전송 수단일 뿐. 중요한 이벤트는 **영속 저장(DB/Streams) + seq/resume + 멱등성** (7장).

**Q. 이 코드를 그대로 프로덕션에?** → `src/` 는 학습과 실무 사이의 *출발점*입니다. 9장 체크리스트를 따라 부하·장애 테스트를 하고, 인증은 검증된 JWT 라이브러리/키 로테이션으로, 관측성은 실제 스택(OTel, Prometheus)에 연결하세요.

---

## 5. 다음 단계

➡ **[webrtc 패키지](../webrtc)** — WebSocket 으로 만든 시그널링 서버 위에서 P2P 화상/데이터 통신, TURN, SFU, 분산까지.
연습 문제는 [`exercises/`](./exercises).
