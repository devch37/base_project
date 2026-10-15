# 03. 비동기 JavaScript — 동기·비동기 · Promise · async/await · ★이벤트 루프

## 이 장의 목표
- "기다리는 동안 다른 일을 한다"는 비동기의 의미를 설명할 수 있다.
- Promise 와 async/await 로 순차·병렬·타임아웃·취소를 구현할 수 있다.
- ★ **이벤트 루프**에서 마이크로태스크와 매크로태스크의 실행 순서를 예측할 수 있다.

## 프로젝트에서 이 장의 자리
SDK 는 거의 전부 비동기다.
- 토큰 받기(`await getToken()`), 압축(`await gzip()`), WebSocket 메시지 수신(콜백) …
- `MutationObserver` 콜백이 **마이크로태스크**라서 DOM 변경이 "묶여서" 온다 (15장).
- 압축이 비동기라서 **작은 프레임이 큰 프레임을 추월**할 수 있다 → 전송을 한 줄로 세우는 이유 (`customer.ts` 의 `sendChain`, 19장).

---

## 1. 동기 vs 비동기

```ts
const data = readFileSync('big.json');         // 동기: 다 읽을 때까지 아무것도 못 함
const data = await readFile('big.json');       // 비동기: 읽는 동안 다른 일을 하다가, 끝나면 이어서
```

JavaScript 는 **스레드 하나**로 돈다. 동기 코드가 오래 걸리면 그동안 **아무것도** 못 한다:
화면이 얼고, 클릭이 안 먹고, WebSocket heartbeat 도 못 보낸다(→ 서버가 연결을 끊는다, 09장).

## 2. ★ 이벤트 루프

```
┌─────────────── 콜 스택 (지금 실행 중인 동기 코드) ───────────────┐
└──────────────────────────────────────────────────────────────┘
           ▲ 비면 꺼내 온다
┌─────── 마이크로태스크 큐 ───────┐   ← Promise.then, await 뒤, queueMicrotask, MutationObserver
│  (전부 비울 때까지 계속 실행)     │
└───────────────────────────────┘
           ▲ 그다음
┌─────── 매크로태스크 큐 ─────────┐   ← setTimeout, 네트워크 이벤트(WebSocket onmessage), 사용자 클릭
│  (하나 꺼내 실행 → 다시 마이크로) │
└───────────────────────────────┘
```

규칙: **동기 전부 → 마이크로태스크 전부 → 매크로태스크 하나 → 마이크로태스크 전부 → …**

## 3. Promise 와 async/await

```ts
// Promise: "나중에 값이 생길 것"을 나타내는 객체
fetch(url).then((res) => res.json()).then((data) => use(data)).catch(handle);

// async/await: 같은 일을 동기 코드처럼 읽히게
try {
  const res = await fetch(url);
  const data = await res.json();
  use(data);
} catch (e) { handle(e); }
```

| 하고 싶은 것 | 방법 |
|---|---|
| 차례로 | `await a(); await b();` |
| 동시에, 모두 성공해야 | `await Promise.all([a(), b()])` |
| 동시에, 결과를 다 모으기 | `await Promise.allSettled([...])` |
| 먼저 끝난 것 | `Promise.race([...])` — 타임아웃 구현에 |
| ★ 진짜 취소 | `AbortController` / `AbortSignal.timeout(ms)` |

**race 타임아웃의 함정**: `Promise.race` 로 "기다리기"를 그만둬도, 느린 작업 자체는 **계속 돈다**.
`fetch` 처럼 `signal` 을 받는 API 는 AbortController 로 **실제로 중단**할 수 있다.
고객사 백엔드(`web/tenant-backend/server.ts`)가 채팅 서버를 부를 때 `AbortSignal.timeout(3000)` 을 쓰는 이유.

## 4. 순서를 지켜야 할 때: Promise 체인으로 "한 줄 세우기"

```ts
// customer.ts — 프레임 순서를 지키는 실제 코드 (요약)
private sendChain = Promise.resolve();
send(frame) {
  const env = this.sequencer.wrap(frame);          // 번호는 지금(동기로) 붙이고
  this.sendChain = this.sendChain.then(async () => {
    for (const part of await encode(env)) publish(part);   // 압축·전송은 앞의 것이 끝난 뒤에
  });
}
```
그냥 `encode(env).then(publish)` 로 쓰면, 큰 스냅샷 압축(수십 ms)이 끝나기 전에 작은 변경분 압축(1ms)이 먼저 끝나서
**변경분이 스냅샷보다 먼저** 나간다. 상담사 쪽은 "기준 화면이 없는 변경분"을 받게 된다.

---

## 코드 읽기
- `1-basic/03-async-js/event-loop.ts` — 출력 순서 퀴즈 + 블로킹 실험
- `1-basic/03-async-js/promise-async.ts` — 순차/병렬/allSettled/race/AbortController
- `web/sdk/src/customer.ts` 의 `send()` / `web/sdk/src/agent.ts` 의 `onWire()` — 실전 "한 줄 세우기"

## 직접 해 보기
```bash
npm run lab:03            # 실행 전에 1~7 의 출력 순서를 종이에 적어 보자
npm run lab:03:promise
```
1. `event-loop.ts` 의 7번: 100ms 타이머가 왜 500ms 뒤에 실행되는가?
2. `promise-async.ts` 의 마지막 부분: `await` 를 빼먹으면 오류가 어디로 가는가?
3. (도전) `event-loop.ts` 에 `setTimeout(() => console.log('X'), 0)` 를 `Promise.then` 안에 넣으면 X 는 언제 찍힐까?

## 자주 하는 실수
- `forEach` 안에서 `await` → 기다려 주지 않는다. `for...of` 를 쓴다.
- `async` 함수를 호출만 하고 `await`/`.catch` 를 안 붙인다 → 실패가 조용히 사라진다(Unhandled rejection).
- 무거운 계산을 메인 스레드에서 오래 돌린다 → heartbeat 누락으로 연결이 끊긴다.

## 확인 질문
1. `MutationObserver` 콜백은 DOM 을 바꾸는 즉시 실행되나?
2. `Promise.race([fetch(url), timeout(1000)])` 에서 타임아웃이 이기면 네트워크 요청은 멈추나?
3. WebSocket 의 `onmessage` 로 메시지 A, B 가 들어왔고, A 처리 함수 안에 `await` 가 있다. B 는 A 처리가 끝난 뒤에 시작되나?

<details><summary>답</summary>

1. 아니다. 현재 동기 코드가 끝난 뒤 마이크로태스크로 "묶여서" 한 번에 온다.
2. 안 멈춘다. 기다리기만 그만둔 것이다. 멈추려면 AbortController.
3. 아니다! A 가 `await` 에서 멈추는 순간 이벤트 루프는 B 를 처리하기 시작한다. 순서가 중요하면 직접 줄을 세워야 한다 (`agent.ts` 의 `decodeChain`).
</details>

다음 → [04. 실행 환경과 빌드 도구](../04-runtime-build-tools/)
