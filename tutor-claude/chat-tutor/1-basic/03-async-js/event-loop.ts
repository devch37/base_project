/**
 * 03장 실습: 출력 순서를 "먼저 예측"하고 실행해 보자.  npm run lab:03
 *
 * 규칙: 동기 코드 전부 → 마이크로태스크(Promise.then, queueMicrotask) 전부 → 매크로태스크(setTimeout) 하나 → 다시 마이크로태스크...
 */
console.log('1. 동기: 스크립트 시작');

setTimeout(() => console.log('6. 매크로태스크: setTimeout 0ms'), 0);

Promise.resolve().then(() => console.log('3. 마이크로태스크: Promise.then'));
queueMicrotask(() => console.log('4. 마이크로태스크: queueMicrotask'));

(async () => {
  console.log('2. 동기: async 함수의 첫 await 전까지는 동기로 실행된다');
  await null;
  console.log('5. 마이크로태스크: await 뒤의 코드');
})();

console.log('2-1. 동기: 스크립트 끝');

// 왜 중요한가? (15장) MutationObserver 콜백도 마이크로태스크다.
// DOM 을 여러 번 바꿔도 "현재 동기 코드가 끝난 뒤" 한 번에 묶여서 콜백이 온다.

// 블로킹 실험: 동기 코드가 오래 걸리면 타이머도, 네트워크 메시지 처리도, 화면 그리기도 전부 멈춘다.
setTimeout(() => {
  const start = Date.now();
  const timer = setTimeout(() => console.log(`\n7. 100ms 타이머가 실제로는 ${Date.now() - start}ms 뒤에 실행됨 (블로킹 때문)`), 100);
  void timer;
  while (Date.now() - start < 500) {
    /* 0.5초 동안 CPU 를 붙잡는다 — 브라우저라면 화면이 얼고, WebSocket heartbeat 도 못 보낸다 */
  }
}, 10);
