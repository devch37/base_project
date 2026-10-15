# 19. 메시지 순서 · 중복 · 손실과 화면 재동기화

## 이 장의 목표
- 메시지가 **뒤바뀌고, 두 번 오고, 사라지는** 원인을 이 시스템 안에서 구체적으로 짚을 수 있다.
- epoch + seq 로 순서·중복·공백을 판단하는 수신기를 설명할 수 있다.
- "빠진 것을 다시 달라" 대신 **"처음부터 다시(재동기화)"** 를 고른 이유를 말할 수 있다.
- ★ Spring 이 기본적으로 한 연결의 메시지를 **병렬 처리**한다는 사실과 그 해결책을 안다 (실측).

## 프로젝트에서 이 장의 자리
변경분(mutation)은 "직전 상태"를 전제로 한다. 하나라도 빠지거나 순서가 바뀌면 이후 연산이 **엉뚱한 노드**를 가리킨다.
`sequencer.ts` 의 `OrderedReceiver` 와 서버의 순서 보존 설정이 이 장의 코드다.

---

## 1. 이 시스템에서 순서가 바뀌는 곳 (실제로 찾은 것들)

| 위치 | 원인 | 해결 |
|---|---|---|
| 고객 SDK 송신 | 압축이 비동기 → 작은 프레임이 큰 스냅샷보다 먼저 끝남 | `sendChain` 으로 한 줄 세우기 (03장) |
| **Spring 서버 수신** | **clientInboundChannel 스레드 풀이 한 연결의 메시지도 병렬 처리** | `setPreserveReceiveOrder(true)` |
| Spring 서버 송신 | clientOutboundChannel 도 병렬 | `setPreservePublishOrder(true)` |
| 서버 간 (Hazelcast Topic) | 노드별 발행 순서는 보존되지만, 고객이 다른 노드로 재연결하면 섞일 수 있다 | 재연결 = 새 epoch (24장) |
| 상담사 SDK 수신 | 해독(gunzip)이 비동기 → 작은 프레임이 먼저 해독 완료 | `decodeChain` + 수신기의 "이른 프레임" 보관 |

### ★ 실측: `OrderingTest`
고객이 2000개 프레임을 빠르게 보내고 상담사가 받은 순서를 센다.
```
순서 보존 설정 없이 (Spring 기본)  → 순서 뒤바뀜 447 / 2000
setPreserveReceiveOrder + setPreservePublishOrder → 0 / 2000
```
대가: 한 연결 안에서는 병렬성이 없어진다(연결이 많으면 전체 처리량 영향은 작다).

> ⚠ 그리고 부작용: 순서 보존 모드에서는 인터셉터 예외가 ERROR 프레임으로 가지 않는다(실측) →
> 인터셉터가 소켓을 직접 닫도록 바꿨다 (12장, `cobrowse-server` `StompAuthInterceptor`).
> 설정 하나가 다른 동작을 바꾼다 — **바꾼 뒤 기존 테스트를 다시 돌려야 하는 이유**.

## 2. 중복은 어디서 오나
- 재연결 직후 history·실시간이 겹침 (09장)
- 같은 조각 재수신 (18장)
- 서버 2대가 같은 메시지를 각자 로컬에도 보내고 Topic 으로도 보내는 버그 (23장 — 그래서 `HazelcastMessageRelay` 는 로컬로 따로 보내지 않는다. `ClusterTest` 가 "두 번 오지 않음"을 확인)

## 3. 손실은 어디서 오나
- 연결이 끊긴 동안 보낸 것 (고객 SDK 는 끊긴 동안 프레임을 **버린다** — 재연결 시 스냅샷을 보내므로)
- 조각 유실·조립 타임아웃 (18장)
- Hazelcast ITopic 은 최대 1회 전달 — 노드 장애·과부하 시 유실 가능 (23장)
- 느린 클라이언트의 송신 버퍼 초과로 서버가 연결을 끊음 (`setSendBufferSizeLimit`)

## 4. 수신기 (`OrderedReceiver`)

보내는 쪽(`FrameSequencer`): 스냅샷마다 새 **epoch**, 그 안에서 **seq** 1, 2, 3…
```
받은 프레임
 ├ snapshot ─ 같은 epoch 중복이거나 이미 지나간 epoch? ─예─▶ 무시 (화면이 과거로 돌아가지 않게)
 │            └아니오─▶ 새 epoch 시작, 기다리던 이른 프레임 살리기
 ├ epoch 가 다름 ─▶ "이른 프레임"으로 보관 (스냅샷이 해독 중일 수 있다). 스냅샷이 아예 없으면 요청
 ├ seq < 기대값 ─▶ 중복, 버림
 ├ seq > 기대값 ─▶ 버퍼에 보관, 공백 타이머 시작 (2초)
 └ seq = 기대값 ─▶ 적용 → 버퍼에서 이어지는 번호들도 적용

공백 타이머 만료 / 버퍼 넘침 / 버전 불일치 ─▶ 재동기화 요청 (한 번만, 스냅샷이 올 때까지 또 안 보냄)
```

> 실제로 찾은 버그: 처음 구현은 **중복된 스냅샷**을 다시 적용했다(`lab:19` 출력이 `1,1,2,…`).
> 늦게 도착한 중복 스냅샷은 그동안 적용한 변경분을 지우고 화면을 과거로 되돌린다. → "같은/지난 epoch 스냅샷 무시" 추가 + 테스트.

## 5. 왜 재전송이 아니라 재동기화인가

| | 재전송 (빠진 seq 만 다시) | 재동기화 (새 스냅샷) |
|---|---|---|
| 보내는 쪽 부담 | 보낸 프레임을 **보관**해야 함 (얼마나? 메모리) | 보관 불필요 |
| 프로토콜 | NACK, 보관 기간, 보관 초과 시 결국 스냅샷 | 단순 |
| 비용 | 작음 | 스냅샷 크기 (압축하면 수 KB~수십 KB) |
| 확실성 | 보관 기간 밖이면 실패 | 항상 회복 |

화면 공유는 "**지금 화면**"만 중요하고 중간 과정은 필요 없다 → 재동기화가 맞다.
(반대로 채팅은 중간 메시지가 전부 중요하다 → seq + history 로 **빠진 것을 채운다**, 09장)

## 6. 재동기화가 일어나는 모든 경우
상담사 입장(viewer-joined) · 고객 (재)연결 · 공백 타임아웃 · 조각 조립 실패 · 수신 버퍼 넘침 · 프로토콜 버전 불일치 · 복제본 적용 오류(`Mirror.onError`) · 상담사의 "화면 다시 받기" 버튼.
고객 SDK 는 짧은 시간의 여러 요청을 **한 번의 스냅샷**으로 합친다 (`customer.ts` `resnapshot` 의 50ms 타이머).

---

## 코드 읽기
- `web/sdk/src/sequencer.ts` — `FrameSequencer`, `OrderedReceiver`(early, pastEpochs, gap timer, askedForSnapshot)
- `web/sdk/src/customer.ts` — `sendChain`, `resnapshot`, 끊긴 동안 버리기
- `web/sdk/src/agent.ts` — `decodeChain`, `requestResync`, 5초 뒤 재요청 허용
- `server/cobrowse-server/.../config/StompConfig` — `setPreserveReceiveOrder`, `setPreservePublishOrder`
- 테스트: `web/sdk/test/sequencer.test.ts`, `server/cobrowse-server/src/test/.../OrderingTest`

## 직접 해 보기
```bash
npm run lab:19
./gradlew :server:cobrowse-server:test --tests '*OrderingTest*' -i | grep OrderingTest
# 순서 보존을 끄고 다시: application.yml 의 chat.preserve-order: false 로 바꾸고 같은 명령 → 실패 + 뒤바뀜 횟수 출력 (그다음 원복!)
```
labs/15: "순서 뒤섞기" 체크 → 통계의 "순서 뒤바뀜"은 오르지만 복제본은 정상. "손실률" 20% → 재동기화.

## 자주 하는 실수
- "TCP 는 순서를 보장하니까 괜찮다" — TCP 는 **한 연결 안의 바이트** 순서만 보장한다. 서버 내부 스레드, 비동기 처리, 서버 간 전달은 별개.
- 재동기화 요청을 공백마다 계속 보냄 → 고객이 스냅샷 폭탄을 맞음 (`askedForSnapshot`).
- 중복 스냅샷을 그대로 적용.

## 확인 질문
1. `OrderingTest` 결과를 보고 "Spring 이 버그"라고 할 수 있나?
2. seq 를 서버가 아니라 **고객 SDK** 가 붙이는 이유는? (서버 여러 대를 떠올리며)
3. 채팅은 재동기화가 아니라 history 로 채우는 이유는?

<details><summary>답</summary>

1. 아니다. 처리량을 위한 의도된 기본값이고, 순서가 필요한 경우를 위해 옵션을 제공한다. "기본값이 내 요구와 맞는지"를 확인하는 게 우리 몫.
2. 한 방의 화면 프레임은 고객 한 명만 만든다 → 그 고객이 붙이면 분산 카운터가 필요 없다. 서버가 붙이면 서버 2대가 같은 방의 번호를 나눠 써야 한다.
3. 채팅은 과거 메시지 하나하나가 의미 있다. 화면은 "지금 상태"만 의미 있다.
</details>

## 연습
- `exercises/src/07-seq-buffer.ts`

다음 단계 → [4단계: 20. SDK 로 만들기](../../4-practical/20-sdk-and-tooling/)
