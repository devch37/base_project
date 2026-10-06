# 09. 운영 — "만드는 것의 절반은 안 죽게 하고, 안전하게 배포하는 것"

> **한 줄 요약**: 라이브러리와 *운영 가능한 서비스* 사이에는 **우아한 종료 · 헬스체크 · 메트릭 · 구조화 로그 · FD/메모리 한도 · 배포 전략 · 부하 테스트**가 있습니다.

| 파일 | 내용 |
|---|---|
| [`main.ts`](./main.ts) | 운영 진입점: 환경변수 설정, JSON 로그, SIGTERM 우아한 종료, 안전망 |
| [`demo.ts`](./demo.ts) | `npm run ws:09` — 롤링 배포 시 재연결 쓰나미 (그냥 죽이기 vs 우아한 종료) |
| [`loadtest.ts`](./loadtest.ts) | `npm run ws:09:load -- 5000` — 연결 수립 지연, **연결당 메모리**, 팬아웃 지연 측정 |
| 인프라 예시 | [`../../../infra/`](../../../infra) (Dockerfile, nginx, docker-compose, k8s) |

---

## 1. 우아한 종료 (Graceful Shutdown) — 배포마다 일어나는 사건

HTTP 서버는 요청이 수 ms 면 끝나서 종료가 쉽지만, **WebSocket 서버는 연결이 몇 시간씩** 살아 있습니다.
재배포 = 모든 연결을 어떻게 옮길 것인가의 문제입니다.

```
SIGTERM 수신
  ① /readyz 를 503 으로 (더 이상 새 연결을 받지 않는다) → LB 가 이 노드를 풀에서 제외
  ② 새 업그레이드 요청 거절 (503 + Retry-After)
  ③ 기존 연결에 `server.shutdown {reconnectAfterMs: random(0~J)}` 알림 + close(1012 Service Restart)
  ④ 최대 graceMs 동안 연결이 스스로 나가길 대기
  ⑤ 남은 연결은 terminate, bus/presence 정리, 프로세스 종료(exit 0)
```

### 데모 결과 (`npm run ws:09`, 클라이언트 300명)
```
(a) 그냥 죽이기:   0.00s │████████████████████████████████████████ 300       ← 한 구간에 300건 (쓰나미)
(b) 우아한 종료:   0.00s │█████████████████████████ 33   0.25s │███████████████ 47   … 고르게 분산 (최대 47건/250ms)
```
핵심은 ③: **서버가 클라이언트마다 다른 "N ms 뒤에 오라"** 를 알려 재접속을 시간축에 퍼뜨립니다. 클라이언트 지터(4장)는 *크래시* 때를 위한 안전망, 서버 힌트는 *계획된 배포*를 위한 정밀 제어입니다.

### 롤링 배포에서 알아 둘 것
* **`terminationGracePeriodSeconds`** (쿠버네티스)는 `graceMs + 여유`보다 길어야 합니다. 안 그러면 SIGKILL 이 먼저 옵니다.
* **`preStop` hook** 으로 `sleep 5~10` — LB/Endpoint 에서 제거가 전파될 시간을 번 뒤 SIGTERM 이 처리되게 합니다(그렇지 않으면 종료 중인 노드로 새 연결이 계속 들어옴).
* **한 번에 교체하는 노드 수(`maxUnavailable`)**: 한 노드가 가진 연결이 한꺼번에 나머지로 몰리므로 *1대씩* 교체하고, 남은 노드가 그 부하를 감당할 **N+1 여유**가 있어야 합니다.
* 버전 호환: 배포 중에는 구/신 서버와 구/신 클라이언트가 공존 → 프로토콜 `v` 필드(2장), 하위 호환 변경.
* **카나리**: 새 버전 1대에 소수 트래픽 → 연결 수·에러율·재연결율 확인 후 확대.

---

## 2. 헬스체크 3종

| 엔드포인트 | 의미 | 실패하면? |
|---|---|---|
| `/healthz` (liveness) | 프로세스가 살아 있고 이벤트 루프가 돈다 | 오케스트레이터가 **재시작** |
| `/readyz` (readiness) | 새 연결을 받아도 된다 | LB 가 **트래픽에서 제외**(재시작 아님). drain 중엔 503 |
| `/metrics` | Prometheus 지표 | — |

> **liveness 에 의존성(Redis) 확인을 넣지 마세요.** Redis 가 잠깐 죽었다고 모든 노드를 재시작하면 연결이 전부 끊기는 *연쇄 장애*가 됩니다. 의존성 상태는 readiness 나 지표로.

---

## 3. 관측성: 무엇을 보고 무엇에 경보를 걸까

| 지표 (`src/metrics.ts`) | 이상 신호 |
|---|---|
| `ws_connections` (gauge) | 급감 = 장애/배포, 급증 = 재연결 쓰나미/공격. **오토스케일 기준** |
| `ws_connections_total` rate | 초당 신규 연결. 급증 = 쓰나미 |
| `ws_messages_in/out_total` rate | 트래픽량. 팬아웃 비율(out/in)이 갑자기 오르면 큰 방 |
| `ws_dropped_total`, `ws_slow_consumers_total` | 느린 소비자 방어 작동 (6장) |
| `ws_rate_limited_total` | 속도 제한 작동 — 버그 클라이언트/공격 |
| `ws_auth_failures_total` | 인증/Origin 거절 — 공격 또는 배포 실수(Origin 설정 누락) |
| `ws_heartbeat_timeouts_total` | 좀비 정리 — 네트워크 불안정 지표 |
| Node: event loop lag, RSS, heap, GC pause | **이벤트 루프 지연 > 100ms** 가 가장 중요한 건강 신호(팬아웃 CPU 포화) |
| 시스템: FD 사용률, 연결 상태별 소켓 수(`ss -s`), 네트워크 대역폭 | FD 80% 경보 |

**로그**: 연결마다 `peerId`, `userId`, `nodeId`, `traceId` 를 붙인 JSON 한 줄 로그. 메시지 *내용*(개인정보)은 로그에 남기지 않습니다. 접속/종료 로그에 `closeCode` 를 남기면 장애 분석이 쉬워집니다(1006 급증 = 네트워크/프록시 문제).

---

## 4. 용량: FD, 메모리, 커널 파라미터

### 파일 디스크립터
소켓 1개 = FD 1개. 기본 한도(`ulimit -n`: Linux 1024, macOS 256)는 **수백 연결**에서 `EMFILE: too many open files` 로 서버가 접속을 못 받습니다.
* systemd: `LimitNOFILE=1048576` / Docker: `--ulimit nofile=1048576:1048576` / 쿠버네티스: 컨테이너 런타임 설정
* 확인: `cat /proc/<pid>/limits`, `ls /proc/<pid>/fd | wc -l`

### 메모리
`loadtest.ts` 로 **직접 측정**하세요(데모 결과 ≈ 11KB/연결 *유휴*). 실제는 애플리케이션 상태(방 멤버십, 사용자 객체)와 송신 버퍼, TLS 세션(연결당 수십 KB 추가)이 더해집니다. 기준: 연결당 평균 × 목표 연결 수 × 1.5 안전계수.
* Node 힙 기본 상한(~2~4GB)에 주의: `--max-old-space-size`. 컨테이너 메모리 한도보다 낮게.
* **GC 정지**: 연결당 객체가 많으면 힙이 커져 Major GC 가 길어지고 → 하트비트 지연 → 오탐 종료. 메시지 객체를 오래 붙잡지 마세요.

### 리눅스 커널 (대규모 연결 노드)
```
net.core.somaxconn = 4096          # accept 큐(backlog) 크기. 접속이 몰릴 때 SYN 드롭 방지
net.ipv4.ip_local_port_range = 10000 65535   # LB→백엔드(또는 프록시→앱) 구간의 임시 포트 확장
net.ipv4.tcp_max_syn_backlog = 4096
fs.file-max = 2097152
```
* LB/프록시가 **한 IP:Port 로** 백엔드에 연결하면 임시 포트 6만 개가 상한 → 연결 6만 개 근처에서 `EADDRNOTAVAIL`. 백엔드 IP/포트를 여러 개 쓰거나 프록시 IP 를 늘립니다.

### 성능 병목 순서 (경험칙)
1. FD 한도 → 2. 메모리 → 3. **팬아웃 CPU/이벤트 루프** (큰 방) → 4. 대역폭 → 5. Redis 단일 스레드 → 6. LB 연결 수 한도
Node 는 단일 스레드이므로 **코어당 프로세스 1개**(클러스터링/컨테이너 여러 개)로 CPU 를 쓰고, 노드 간 통신은 8장의 Bus 로.

---

## 5. 배포 구성 예시 (`infra/`)

```yaml
# kubernetes (발췌)
spec:
  terminationGracePeriodSeconds: 40
  containers:
    - name: ws
      readinessProbe: { httpGet: { path: /readyz, port: 8080 }, periodSeconds: 3, failureThreshold: 1 }
      livenessProbe:  { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 10 }
      lifecycle: { preStop: { exec: { command: ["sleep", "8"] } } }      # LB 에서 빠질 시간
      env:
        - { name: SHUTDOWN_GRACE_MS,  value: "25000" }
        - { name: SHUTDOWN_JITTER_MS, value: "15000" }
      resources: { requests: { cpu: "500m", memory: "512Mi" }, limits: { memory: "1Gi" } }
```
Ingress(Nginx): `nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"`, `proxy-send-timeout: "3600"`. ALB: idle timeout 을 올리고(최대 4000초) 앱 하트비트를 그보다 짧게.

---

## 6. 테스트 전략

| 층 | 무엇을 | 이 프로젝트의 예 |
|---|---|---|
| 단위 | 순수 로직 (토큰 버킷, ticket, ReplayLog, 백오프) | `test/units.test.ts` |
| 통합 | 실제 소켓으로 서버 동작 (인증 거절, 하트비트, 백프레셔, 우아한 종료) | `test/server.test.ts` |
| 분산 | 멀티 노드 + 진짜 Redis, 노드 크래시 | `test/cluster.test.ts`, `test/redis.test.ts` |
| 클라이언트 | 재연결, 요청 타임아웃, 큐 | `test/client.test.ts` |
| 부하 | 연결 수, 메모리, 팬아웃 | `loadtest.ts` |
| **카오스** | 노드 kill, Redis 중단, 네트워크 지연/유실 (`tc netem`, toxiproxy) | `simulateCrash()`, 8장 데모 |

타이밍에 의존하는 테스트는 *불안정(flaky)* 해집니다. 이 프로젝트가 7장 데모에서 "재연결 문(gate)"을 둔 것처럼 **통제 가능한 지점**을 만들어 결정적으로 테스트하세요.

---

## 7. 운영 장애 플레이북

| 증상 | 의심 | 확인 |
|---|---|---|
| 접속이 안 되고 `EMFILE` | FD 한도 | `ulimit -n`, `/proc/<pid>/fd` 수 |
| 클라이언트에 close **1006** 이 일정 주기로 | LB/프록시 idle timeout | 주기가 60s? → `proxy_read_timeout`, ALB idle, 하트비트 간격 |
| 배포 때마다 접속 폭주·에러 급증 | 재연결 쓰나미 | 우아한 종료 + 지터 힌트(1절), 한 번에 교체 수 |
| 메모리가 계속 증가 | 느린 소비자 / 방·리스너 누수 | `bufferedAmount` 분포, `leaveAll` 정리 확인, 힙 스냅샷 |
| 이벤트 루프 지연·하트비트 오탐 | 큰 방 팬아웃, 동기 작업 | `--cpu-prof`, 팬아웃 시간 측정, 방 샤딩 |
| 노드 간 메시지 누락 | Redis Pub/Sub 유실 | 구독 끊김 로그, 7장 seq/resume, Streams |
| 일부 사용자만 오프라인으로 보임 | presence 유령/TTL | Redis `ZRANGE ws:room:*`, TTL·refresh 로그 |
| 같은 사용자가 두 번 접속 | 재연결 중복, 다중 탭 | peerId vs userId, 정책(KICKED) |

---

## 8. 출시 전 체크리스트

- [ ] `wss://` (TLS) 와 올바른 인증서/자동 갱신
- [ ] Origin 허용 목록 지정 (`ALLOWED_ORIGINS`), ticket 인증 + 짧은 만료
- [ ] `maxPayload`, 속도 제한, 최대 연결 수, 인증 타임아웃
- [ ] 하트비트 간격 < LB idle timeout, 프록시 timeout 상향
- [ ] 우아한 종료(SIGTERM) + `/readyz` + preStop + terminationGracePeriod
- [ ] 클라이언트: 백오프+지터, close code 별 정책, 재연결 후 상태 복구(방 재입장·resume)
- [ ] 메시지 프로토콜 버전(`v`), 스키마 검증, 서버가 `from/seq/ts` 덮어쓰기
- [ ] 느린 소비자 방어(soft/hard), 큰 방 팬아웃 계획
- [ ] FD/메모리 한도, 커널 파라미터, **부하 테스트로 목표 연결 수 검증**
- [ ] 메트릭·대시보드·경보, JSON 로그, 개인정보 마스킹
- [ ] 다중 노드: Redis HA, presence TTL, 노드 크래시/재연결 쓰나미 리허설
- [ ] 롤링 배포·카나리 절차, 롤백 계획, 프로토콜 호환성

---

## 9. 직접 해 보기

1. `npm run ws:09:load -- 10000` 으로 1만 연결을 시험하고 연결당 메모리를 구해 보세요. `ulimit -n 1024` 상태에서 실행하면 어떤 오류가 나나요?
2. `main.ts` 를 직접 띄우고(`PORT=8080 npx tsx …/main.ts`) `curl localhost:8080/metrics` 로 지표를 확인한 뒤, `kill -TERM <pid>` 로 종료 로그(`drain 시작` → `종료 완료`)를 관찰하세요.
3. `demo.ts` (b) 의 `jitterMs` 를 200 / 2000 / 20000 으로 바꿔 분포와 "전원 재연결까지 걸리는 시간"의 트레이드오프를 비교하세요.
4. 연결 수를 오토스케일 지표로 쓸 때, 노드를 **줄이는(scale-in)** 정책은 어떻게 설계해야 할까요? (힌트: drain 모드 노드는 신규 연결 0, 연결이 충분히 빠질 때까지 종료 대기)
5. 롤링 배포 중 구버전 서버와 신버전 서버가 같은 Redis 를 공유합니다. Bus 메시지 포맷을 바꿀 때 어떤 순서로 배포해야 안전할까요? (전방/후방 호환)
