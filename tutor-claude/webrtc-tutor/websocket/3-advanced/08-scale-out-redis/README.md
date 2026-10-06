# 08. 스케일 아웃 — "서버가 여러 대가 되는 순간 모든 것이 달라진다"

> **한 줄 요약**: WebSocket 연결은 *서버 프로세스 한 개의 메모리*에 있습니다. 서버가 늘면 ① **노드 간 메시지 버스** ② **공유 Presence** ③ **로드밸런서 설정** ④ **장애 시 자동 복구** 가 필요합니다. 이 장의 모든 코드는 **진짜 Redis 와 서버 3대**로 실행됩니다.

| 파일 | 내용 |
|---|---|
| [`node.ts`](./node.ts) | Redis 를 꽂은 서버 한 대 (단일 서버 코드와 달라진 건 부품 2개뿐) |
| [`lb.ts`](./lb.ts) | 학습용 L4 로드밸런서 (round-robin / ip-hash, 패시브 헬스체크 failover) |
| [`demo.ts`](./demo.ts) | `npm run ws:08` — 분산·구독 관찰·크래시 failover·Pub/Sub 한계 |
| 핵심 구현 | [`src/bus.ts`](../../src/bus.ts) (`RedisBus`), [`src/presence.ts`](../../src/presence.ts) (`RedisPresence`), [`src/hub.ts`](../../src/hub.ts) |

> 요구사항: Redis. `REDIS_URL` 이 없으면 로컬 `redis-server` 를 임시 포트로 띄웁니다 (`brew install redis` / `apt install redis-server`). 또는 `docker run -p 6379:6379 redis:7` 후 `REDIS_URL=redis://localhost:6379 npm run ws:08`.

---

## 1. 문제

```
 Alice ──ws──▶ [서버 A]                 [서버 B] ◀──ws── Bob       (둘 다 room "lobby")
                  │ Alice 의 메시지를 lobby 에 브로드캐스트
                  └ A 의 메모리에는 Bob 의 소켓이 없다 → 전달 불가!
```

1대로 충분하던 시절의 가정 3가지가 모두 깨집니다.

| 단일 서버에서는 | 다중 서버에서는 |
|---|---|
| 방 멤버가 한 프로세스 `Map` 에 있다 | 멤버가 여러 프로세스에 흩어져 있다 |
| 특정 사용자의 소켓을 바로 찾는다 | 그 사용자가 *어느 서버*에 있는지 모른다 |
| 서버 재시작 = 전부 끊김 (한 번) | 한 노드 장애 = *일부*만 끊김, 나머지는 정상 → 부분 장애 처리 필요 |

---

## 2. 아키텍처

```
                       ┌──────────────── Redis ────────────────┐
                       │  Pub/Sub: room:<id>  node:<nodeId>     │
                       │  Presence: ws:conn:<peerId> → nodeId   │
                       │            ws:room:<id> (ZSET, TTL)    │
                       └────────▲──────────▲──────────▲─────────┘
                                │          │          │
   클라이언트 ──▶ [로드밸런서] ──┼─▶ 노드 A ┼─▶ 노드 B ┼─▶ 노드 C
                                  (소켓 보유) (소켓 보유) (소켓 보유)
```

### 구성 요소 3가지 (`src/`)

**① Bus (메시지 버스)** — 노드 간 메시지 전달
* `room:<방ID>` : 방 브로드캐스트. **그 방에 멤버가 1명이라도 있는 노드만 구독**(첫 멤버 입장 시 SUBSCRIBE, 마지막 퇴장 시 UNSUBSCRIBE). 데모 ②에서 Redis 가 `room:lobby` 구독자를 *노드 수(2)* 로 보여 줍니다.
* `node:<nodeId>` : 노드 개인 우편함. 특정 peer 에게 가는 1:1 메시지를 그 peer 가 있는 노드로 전달.
* 로컬 멤버에겐 **Redis 를 거치지 않고 직접** 보내고, Bus 에는 `origin` 을 달아 발행 → 내 노드로 되돌아온 메시지는 `origin === 내 nodeId` 로 무시(중복 전달 방지).

**② Presence (접속 정보 공유)** — "누가 어디에"
* `ws:conn:<peerId> → nodeId` (STRING + TTL) : 1:1 메시지의 목적지 노드를 찾는 O(1) 조회.
* `ws:room:<id>` (ZSET, score=만료시각) : 방 멤버 목록. 조회 시 `score > now` 만 읽어 **만료된 유령은 자동 제외**.
* 살아 있는 노드가 주기적으로 `refresh` 로 TTL 연장. **노드가 죽으면 연장이 멈추고 → TTL 후 소멸.** 데모 ④에서 죽은 노드 B 의 유령(`bob@B`)이 잠시 보였다가 사라집니다.

**③ 로드밸런서** — 접속을 노드에 분산 (아래 4절)

> 이 설계의 장점: `WsServer` 의 핸들러/인증/백프레셔 코드는 **단일 서버와 100% 동일**합니다. `MemoryBus → RedisBus`, `MemoryPresence → RedisPresence` 로 부품만 교체했을 뿐입니다.

---

## 3. 노드 장애 (이 장에서 가장 중요한 실습)

데모 ④: 노드 B 를 `kill -9` 처럼 죽입니다 (정리 코드 없이).

```
t=0     B 크래시. B 의 소켓은 모두 끊김. Redis 에는 B 가 쓴 presence 가 그대로 남음 ("유령")
t≈50ms  B 에 있던 bob, erin 의 WsClient 가 close(1006) 감지 → 백오프+지터 후 재연결 → LB 가 살아있는 A, C 로 배정
        → welcome 수신 → joinRoom 자동 재입장 (서버 상태는 연결과 함께 사라졌으므로)
t<TTL   presence 에 bob@B(유령) 와 bob@A(새 연결) 가 잠시 공존. 1:1 메시지를 유령에게 보내면 'node:B' 로 발행되지만 구독자 없음 → 유실
t=TTL   유령 항목 만료 → 정리 완료
```

**알아 둘 점**
* **유령 TTL 은 트레이드오프**: 짧으면 정리가 빠르지만 refresh 주기가 짧아져 Redis 부하↑, 일시적 지연에도 정상 멤버가 사라질 위험. 길면(30~60초) 부하는 낮지만 유령이 오래 남음. 실무 기본은 TTL 30s / refresh 10s.
* **유령에게의 1:1 전송**은 조용히 유실됩니다. 중요한 메시지는 *ack + 재시도* 또는 영속 큐(7장). 
* LB 가 죽은 노드로 계속 연결을 보내면 안 됩니다 → **헬스체크** (`/healthz`, `/readyz` — `WsServer` 가 기본 제공). 데모의 `lb.ts` 는 연결 실패 시 3초간 제외하는 *패시브* 방식, Nginx/ALB 는 *액티브* 헬스체크도 합니다.
* **재연결 쓰나미**: 노드 하나가 가진 연결이 1만 개면 그 1만 개가 동시에 나머지 노드로 몰립니다. 클라이언트 지터(4장) + 노드 여유 용량(N+1) + 서버 `maxConnections` 로 인한 503 거절이 필요합니다.

---

## 4. 로드밸런서

### L4 (TCP) vs L7 (HTTP)

| | L4 (NLB, HAProxy tcp 모드) | L7 (Nginx, ALB, Envoy) |
|---|---|---|
| 동작 | TCP 연결을 백엔드에 연결해 바이트 중계 | HTTP 를 해석, 업그레이드 후 터널링 |
| WebSocket | **그냥 동작** (이 장의 `lb.ts`) | `Upgrade`/`Connection` 헤더 설정 필요 |
| TLS | 통과(passthrough) 또는 종료 | 종료(termination) 가 일반적 |
| 기능 | 단순·빠름 | 경로/헤더 기반 라우팅, 인증, 레이트리밋, 헬스체크 풍부 |
| idle timeout | 보통 길게 설정 가능 | **ALB 기본 60초, Nginx `proxy_read_timeout` 기본 60초** ← 하트비트 필요 |

### Nginx 설정 (L7)

```nginx
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

upstream ws_backend {
    # least_conn: 연결 수가 적은 노드로 (WebSocket 은 연결이 오래 가서 round-robin 보다 균형이 낫다)
    least_conn;
    server node-a:8080 max_fails=2 fail_timeout=5s;
    server node-b:8080 max_fails=2 fail_timeout=5s;
    server node-c:8080 max_fails=2 fail_timeout=5s;
    keepalive 64;
}

server {
    listen 443 ssl;
    location /ws {
        proxy_pass http://ws_backend;
        proxy_http_version 1.1;                       # WebSocket 은 HTTP/1.1 업그레이드가 필요
        proxy_set_header Upgrade $http_upgrade;       # ★ 이 두 줄이 없으면 101 이 안 나온다
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout  3600s;                    # 기본 60초면 유휴 연결이 끊긴다 → 늘리고 앱 하트비트도 함께
        proxy_send_timeout  3600s;
        proxy_buffering off;                          # 실시간 스트림은 버퍼링 금지
    }
}
```
(전체 구성은 `infra/nginx/` 참고)

### Sticky Session 이 필요한가?
* **순수 WebSocket 은 필요 없습니다.** 연결 *한 번* 맺어 그 TCP 연결이 계속 같은 노드에 붙기 때문입니다.
* **필요한 경우**: ① 폴백(long-polling, SockJS, Socket.IO 의 HTTP 폴링)처럼 요청마다 다른 연결을 쓰는 방식, ② **재연결 시 같은 노드로 돌아가야** 메모리의 세션/방 상태를 이어받을 때. → *상태를 노드 메모리가 아니라 Redis 에 두면* sticky 가 필요 없어지는 것이 이 장의 설계 목표입니다.
* `ip-hash` sticky 는 NAT 뒤 수백 명이 한 노드로 쏠리는 **불균형**을 만들 수 있습니다.

### 라우팅 전략 (심화)
| 전략 | 설명 | 용도 |
|---|---|---|
| least_conn | 연결 수가 적은 노드 | 일반 (균등 분산) |
| **방 ID 해시 (consistent hashing)** | 같은 방 → 같은 노드 | 방 단위 상태가 무거울 때(게임 룸, 협업 문서, **WebRTC SFU**). Redis 트래픽도 줄어든다 → webrtc 9장 |
| 지역(Geo) 라우팅 | 가까운 리전의 노드 | 지연 최소화 |

---

## 5. 팬아웃과 확장성 (심화)

방 하나에 N명이 있고 초당 M 메시지라면 서버 전체의 전송은 **초당 N×M**.

```
메시지 1건 → Redis PUBLISH 1번 → (구독 노드 수 k 만큼 Redis 가 복사) → 각 노드가 로컬 멤버에게 전송
                                                           └ 총 전송 = 멤버 수 N
```
* Redis 가 하는 일은 **노드 수 k** 에 비례(멤버 수 N 이 아님). 방 인원이 10만 명이어도 노드가 10대면 Redis 는 10복사만 합니다. 이것이 "방당 노드 구독" 설계의 핵심 이득.
* **병목은 어디인가**: ① 노드의 팬아웃 CPU/대역폭(N×M), ② Redis 단일 스레드 PUBLISH 처리량(메시지율), ③ 느린 소비자(6장).
* **Hot room (한 방에 트래픽 폭주)**: 한 채널은 한 Redis 샤드/스레드로 가므로 한계가 있다.
  * 방을 **서브채널 K개로 샤딩** (`room:lobby:0..K-1`, 멤버는 `hash(peerId) % K` 채널에 구독 / 발행은 K개 모두) — 병렬화.
  * **Sharded Pub/Sub** (Redis 7+ `SPUBLISH/SSUBSCRIBE`, `new RedisBus(url, {sharded:true})`): 일반 Pub/Sub 은 Redis **Cluster 에서 모든 노드로 브로드캐스트**되어 클러스터를 늘려도 처리량이 안 늘지만, Sharded 는 채널을 슬롯에 매핑해 *담당 노드에서만* 전달 → 클러스터 규모로 확장.
  * 읽기 전용 대형 방(라이브 방송 채팅)은 **방송 전용 팬아웃 계층**(노드 트리)을 둡니다.

### 메시지 버스 선택

| | Redis Pub/Sub | Redis Streams | Kafka | NATS |
|---|---|---|---|---|
| 전달 보장 | **at-most-once** (구독자 없으면 소멸) | 영속, 소비자 그룹, ack | 영속, 파티션 순서, 대규모 | core: at-most-once / JetStream: 영속 |
| 지연 | 매우 낮음 (~sub-ms) | 낮음 | 상대적으로 높음 (배치) | 매우 낮음 |
| 순서 | 채널 내 | 스트림 내 | 파티션 내 | 서브젝트 내 |
| 운영 부담 | 낮음 | 낮음 | 높음 | 낮음~중간 |
| 적합 | **실시간 팬아웃**(채팅, 시그널링, 프레즌스) | 놓치면 안 되는 이벤트 + resume | 이벤트 소싱, 대규모 로그 | 마이크로서비스 + 실시간 |

**실무 조합**: *실시간 전달은 Pub/Sub*, *영속이 필요한 이벤트는 Streams/Kafka/DB 에 저장*(+ 7장의 seq/resume). 데모 ⑤가 Pub/Sub 의 유실을 보여 줍니다.

---

## 6. 실패 모드와 대응 (운영 체크리스트)

| 실패 | 증상 | 대응 |
|---|---|---|
| **Redis 다운** | 노드 간 전달 중단, presence 갱신 실패 | 노드는 **로컬 전달은 계속**(자기 소켓 간) + Redis 재연결 대기(ioredis 자동). 클라이언트에 "연결 불안정" 표시. Redis 는 Sentinel/Cluster 로 HA |
| **Redis 지연** | 브로드캐스트가 느려짐 | `bus.publish` 를 await 하되 타임아웃, 느린 Redis 가 이벤트 루프를 막지 않게 |
| **네트워크 파티션** | 일부 노드끼리만 통신 | Pub/Sub 은 분할 중 메시지 유실. 복구 후 seq/resume(7장)으로 보정 |
| **노드 크래시** | 유령 presence | TTL (3절) |
| **재연결 쓰나미** | 남은 노드 과부하 | 지터 + N+1 용량 + `maxConnections` + 503 |
| **배포(롤링)** | 연결 대량 끊김 | 우아한 종료(9장): `/readyz` 503 → `server.shutdown` 알림 + 지터 → 1012 |
| **스플릿 브레인** | 같은 사용자가 두 노드에 | presence 는 peerId(연결) 단위라 공존 가능. "사용자당 1세션" 정책이면 Redis 락/`SET NX` 로 보장 |

---

## 7. 용량 산정 감각 (대략)

| 항목 | 감각값 | 비고 |
|---|---|---|
| 연결당 메모리 | 수십 KB (유휴, 압축 없음) | `ws` 기준. 측정은 9장 `loadtest.ts` |
| 노드당 연결 수 | 수만 ~ 십만+ | FD 한계(`ulimit -n`), 메모리, 팬아웃 CPU 가 제약 |
| 하트비트 | 연결 N / 간격 초 = 초당 N/간격 패킷 | 100만 연결/30초 ≈ 3.3만/초 |
| 클라이언트 → 서버 포트 | 한 클라이언트 IP 당 약 6만 개 (임시 포트) | LB 와 백엔드 사이 연결이 몰리면 **LB↔백엔드 구간 포트 고갈** 주의 |
| **오토스케일 지표** | CPU 가 아니라 **연결 수 / 메시지율** 기준 | CPU 는 유휴 연결에선 낮아서 지표로 부적합 |

> WebSocket 서버는 **축소(scale-in)가 어렵습니다.** 노드를 줄이면 그 위의 연결이 모두 끊깁니다. 연결 드레이닝(서서히 내보내기)과 긴 `terminationGracePeriod` 가 필요합니다.

---

## 8. 직접 해 보기

1. `demo.ts` 에서 `presenceTtlMs` 를 100 으로 줄이고 `presenceRefreshMs` 를 300 으로 두면 어떤 일이 벌어질까요? (TTL < refresh 의 위험)
2. LB 를 `'ip-hash'` 로 바꾸고 클라이언트 6명을 만들면 노드 분포가 어떻게 되나요? 왜 한 노드로 쏠릴까요? (모두 127.0.0.1)
3. `new RedisBus(url, { sharded: true })` 로 노드를 띄워 보세요. 동작이 같은가요? Redis Cluster 에서는 무엇이 달라질까요?
4. 노드 B 크래시 직후 `alice → bob` 1:1 메시지를 보내면 어떻게 되는지 직접 확인하고, "ack + 재시도"로 보강하는 방법을 설계해 보세요.
5. 방 ID 해시로 같은 방 사용자를 같은 노드로 모으는 LB(`hash(room) % nodes`)를 `lb.ts` 에 추가해 보세요. 이때 Redis 구독 수와 트래픽은 어떻게 줄어드나요?
6. (도전) `RedisBus` 를 **Redis Streams** 기반으로 바꿔 `at-least-once` 로 만들어 보세요 (소비자 그룹 + ack). 지연과 Redis 부하는 어떻게 달라질까요?
