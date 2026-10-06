# WebSocket 연습 문제

각 장의 README 끝에도 "직접 해 보기"가 있습니다. 여기 있는 것은 **여러 장을 묶는 실전형 과제**입니다.
`solutions/` 에 해답이 있는 문제(★)는 **테스트로 검증**되어 있으니 먼저 풀어 본 뒤 비교해 보세요.

```bash
npm test -w @tutor/ws-kit          # 해답 포함 전체 테스트
```

---

## 🟢 기본

### E1 ★ RedisTicketStore (5장 + 8장)
`MemoryTicketStore` 는 서버가 2대일 때 ticket 1회용 보장이 깨집니다. `TicketStore` 인터페이스를 Redis 로 구현하세요.
* 요구: 두 서버가 **동시에** 같은 ticket 을 소비해도 정확히 한 쪽만 성공. 만료되면 키가 사라질 것.
* 힌트: `SET key 1 PX ttl NX` — 왜 `SETNX` + `EXPIRE` 두 명령이면 안 될까요?
* 해답: [`solutions/redis-ticket-store.ts`](./solutions/redis-ticket-store.ts)

### E2 ★ 입력 중 표시 (3장 + 6장)
`typing {room, typing}` 메시지를 방에 전파하세요.
* 요구: 방 멤버만 가능 / 같은 사용자·방은 최소 1초 간격(throttle) / `typing:false` 는 즉시 / 느린 소비자에겐 건너뜀(lossy)
* 해답: [`solutions/typing-indicator.ts`](./solutions/typing-indicator.ts)

### E3 방 인원 제한과 에러 코드 (2장 + 3장)
방마다 최대 N명. 초과 시 `room_full` 에러. 분산 환경에서 "정확한" 인원 제한은 어렵습니다 — 왜일까요? (힌트: `presence.members` 를 읽고 join 하는 사이의 경쟁)

---

## 🟡 중급

### E4 사용자당 1세션 (5장 + 8장)
같은 `userId` 로 두 번째 연결이 오면 **첫 번째를 4003(KICKED)로 끊기**. 서버가 여러 대일 때도 동작해야 합니다.
* 힌트: presence 의 `userId` 인덱스 + Bus 로 "kick" 명령 전파. 클라이언트는 4003 에서 **재연결하지 않아야** 핑퐁이 안 생깁니다(`isRetryableClose`).

### E5 메시지 히스토리 + resume (7장)
방마다 최근 100개 메시지를 보관하고, 입장 시 `afterSeq` 를 받으면 이어서 재생하세요. 서버 2대에서 seq 를 단일 순서로 만들려면 어떤 방법이 있을까요? (Redis `XADD` / 스트림 소유 노드)

### E6 서버 측 레이트리밋 분산화 (6장 + 8장)
사용자(IP 아님) 단위로 "분당 60 메시지"를 **여러 노드 전체에서** 제한하세요. Redis Lua 스크립트로 토큰 버킷을 구현해 원자성을 보장하세요.

---

## 🔴 고급

### E7 Redis Streams 기반 Bus (7장 + 8장)
`RedisBus` 를 Streams(`XADD`/`XREADGROUP`) 기반으로 바꿔 **at-least-once** 로 만들어 보세요. 노드가 잠시 죽었다 살아나도 놓친 메시지를 이어서 받아야 합니다. Pub/Sub 대비 지연과 Redis 부하가 어떻게 달라지는지 측정하세요.

### E8 큰 방 샤딩 (8장)
한 방에 10만 명이 있다고 가정합니다. 방을 K개의 서브채널로 샤딩해 Redis 단일 채널 병목을 줄이는 `ShardedRoomBus` 를 구현하고, `loadtest.ts` 를 확장해 팬아웃 지연을 비교하세요.

### E9 카오스 테스트 (9장)
`toxiproxy`(또는 직접 만든 TCP 프록시)를 클라이언트와 서버 사이에 두고 **지연 500ms, 패킷 5% 유실, 연결 리셋**을 주입했을 때 `WsClient` 의 재연결·resume 이 정확히 동작하는지 자동화 테스트로 만들어 보세요.
