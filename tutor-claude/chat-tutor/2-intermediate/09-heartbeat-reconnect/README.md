# 09. heartbeat · 연결 종료 · 재연결

## 이 장의 목표
- STOMP heartbeat 가 어떻게 **협상**되고, 무엇을 감지하는지 설명할 수 있다.
- 연결이 끊기는 여러 경로(정상 종료, 탭 닫힘, 네트워크 단절, 서버 종료)를 구분하고 서버가 각각을 어떻게 알게 되는지 안다.
- **지수 백오프 + jitter** 재연결, **재구독**, **놓친 메시지 복구**를 구현할 수 있다.

## 프로젝트에서 이 장의 자리
상담 중 고객 와이파이가 잠깐 끊겨도 상담은 이어져야 한다. 서버 배포로 서버가 재시작돼도 마찬가지다.
SDK 의 `StompTransport`(`web/sdk/src/transport.ts`)가 이 장의 내용을 전부 구현한다.

---

## 1. STOMP heartbeat 협상

```
클라이언트 CONNECT    heart-beat:cx,cy     cx = 내가 보낼 수 있는 주기, cy = 너에게 바라는 주기 (ms, 0=안 함)
서버      CONNECTED  heart-beat:sx,sy

클라이언트 → 서버 실제 주기 = max(cx, sy)   (cx 나 sy 가 0 이면 안 보냄)
서버 → 클라이언트 실제 주기 = max(sx, cy)
```
- heartbeat 는 프레임이 아니라 **줄바꿈 한 글자**(`\n`)다.
- 받는 쪽은 "주기의 몇 배 동안 아무것도(데이터든 heartbeat 든) 안 오면" 연결이 죽었다고 본다.
- 07장의 ping/pong 과 목적은 같다. 차이: 브라우저 JS 는 ping 을 보낼 수 없어서 STOMP 계층에서 따로 정의.
- Spring simple broker 는 heartbeat 에 **TaskScheduler** 가 필요하다 (`StompConfig.heartbeatScheduler`).

| 감지하는 것 | 못 하는 것 |
|---|---|
| 조용히 사라진 상대(네트워크 단절) | 메시지가 처리됐는지 (그건 RECEIPT·ack) |
| 프록시가 조용한 연결을 끊는 것 **방지**(주기적 트래픽) | 서버 공유 저장소의 낡은 데이터 정리 (그건 TTL, 23장) |

## 2. 연결이 끝나는 경로

| 상황 | 서버가 아는 방법 | close code (브라우저) |
|---|---|---|
| 클라이언트가 DISCONNECT 프레임 | 즉시 | 1000 |
| 탭 닫기·페이지 이동 | WebSocket close | 1001 |
| 네트워크 단절·노트북 덮개 | **heartbeat 타임아웃** 뒤에야 | 1006 (클라이언트 측) |
| 서버 정상 종료 (graceful) | — | 1001 |
| 서버 강제 종료(kill -9) | — | 1006 |
| 서버가 정책상 끊음 | — | 4001/4003/1008 등 (12장) |

`PresenceTracker.onDisconnect` 는 이 모든 경우에 호출된다. heartbeat 가 없으면 3번째 경우의 "유령 참가자"가 영원히 남는다.

## 3. 재연결 — 지수 백오프 + jitter

```ts
// web/sdk/src/backoff.ts
delay = random(0, min(maxMs, baseMs × 2^attempt))      // full jitter
```
- **지수**: 서버가 아픈데 1초마다 두드리면 회복을 방해한다. 실패할수록 오래 기다린다.
- **jitter**: 서버가 재시작하면 수천 명이 **동시에** 끊긴다. 모두 같은 간격으로 재시도하면 같은 순간에 몰린다(thundering herd).
- 성공하면 attempt 를 0 으로 리셋.

`npm run lab:09` 의 실제 출력(1000명, 서버가 4초간 죽어 있다가 복구):
```
고정 1초 간격             4s 에 1000명 동시 접속
지수 백오프(jitter 없음)   7.5s 에 1000명 동시 접속
지수 백오프 + full jitter  0.5초 구간 최대 161명으로 흩어짐
```

## 4. 재연결 후 해야 할 일

1. **새 토큰** — 끊긴 이유가 토큰 만료(4001)면 새로 받아서 (12장)
2. **재구독** — 구독은 연결에 묶여 있어서 연결과 함께 사라진다. `transport.ts` 는 구독 목록을 기억했다가 `onConnect` 에서 다시 SUBSCRIBE.
3. **놓친 것 채우기** — 끊긴 동안의 메시지는 브로커가 보관하지 않는다(simple broker 는 저장하지 않는다).
   - 채팅: 마지막으로 받은 `seq` 를 기억 → `SUBSCRIBE /app/rooms/r1/history` + `after-seq` 헤더 (실습 페이지 08)
   - 화면: 놓친 변경분을 메우기보다 **새 스냅샷**을 받는다 (`customer.ts` 의 `onConnected: () => this.resnapshot()`, 19장)
4. **중복 걸러내기** — history 와 실시간 메시지가 겹칠 수 있다 → `seq` 나 `id` 로 (`customer.ts` 의 `seenChat`)

## 5. 끊긴 이유에 따라 다르게 (`transport.ts` 의 `onClosed`)

| close code | 행동 |
|---|---|
| 4001 토큰 만료 | 새 토큰 받아 **즉시** 재연결 |
| 4401 인증 실패 | 새 토큰 받아 백오프 후 |
| 4003 강제 퇴장 / 1008 정책 위반 | **재연결하지 않음** (또 거부될 뿐) |
| 그 외 (1006, 1001 …) | 백오프 후, **다음 서버 주소**로 (24장) |

---

## 코드 읽기
- `server/stomp-chat/.../StompConfig` — `setHeartbeatValue`, `setTaskScheduler`
- `server/stomp-chat/.../PresenceTracker` — DISCONNECT 이벤트로 퇴장 처리
- `web/sdk/src/backoff.ts`, `web/sdk/src/transport.ts` — 재연결·재구독·close code 분기
- `web/labs/08-stomp-chat/main.ts` — 실습용 간단 재연결 + `after-seq` 로 놓친 메시지 복구
- 테스트: `StompChatTest.heartbeat는_CONNECT와_CONNECTED에서_협상된다`, `연결이_끊기면_퇴장이_방송된다`

## 직접 해 보기
```bash
npm run lab:09                              # 재연결 분포 시뮬레이션
./gradlew :server:stomp-chat:bootRun        # 그리고 npm run dev → labs/08
```
1. heartbeat 10000 으로 연결 → WS Messages 탭에서 약 10초마다 오가는 1바이트 프레임 확인.
2. 탭 두 개로 대화 중 **서버를 Ctrl+C** → 로그의 "연결 끊김 … ms 뒤 재연결 시도 #n" 간격이 매번 다른 것(jitter) 확인.
   다른 탭에서 몇 마디 보낸 뒤(서버가 꺼져 있으니 실패) → 서버 재시작 → 재연결 후 **history** 로 놓친 메시지가 채워지는가?
   (주의: simple broker·ChatHistory 는 메모리라서 서버 재시작 시 기록도 사라진다 → 다중 서버·영속화가 필요한 이유, 23장)
3. 개발자도구 Network 탭의 "Offline" 으로 네트워크 단절 흉내 → 몇 초 뒤 끊김 감지?

## 자주 하는 실수
- 재연결 후 재구독을 안 해서 "연결은 됐는데 아무것도 안 온다".
- 재시도 간격이 고정 → 서버 재시작 때마다 폭주.
- 끊긴 이유를 구분하지 않고 무조건 재연결 → 강제 퇴장당한 사용자가 서버를 계속 두드림.
- heartbeat 주기를 프록시 idle timeout 보다 길게 → 프록시가 먼저 끊는다 (21장).

## 확인 질문
1. 클라이언트 `heart-beat:5000,5000`, 서버 `10000,10000`. 양방향 실제 주기는?
2. heartbeat 만 있고 history 가 없다면 재연결한 상담사는 무엇을 잃나?
3. 재연결이 성공할 때 attempt 를 0 으로 리셋하지 않으면?

<details><summary>답</summary>

1. 클라이언트→서버 max(5000, 10000)=10초, 서버→클라이언트 max(10000, 5000)=10초.
2. 끊긴 동안의 메시지. 연결이 살아났다고 데이터가 복구되지는 않는다.
3. 다음 끊김 때 처음부터 최대 대기 시간으로 기다린다.
</details>

다음 → [10. 인증과 인가](../10-authn-authz/)
