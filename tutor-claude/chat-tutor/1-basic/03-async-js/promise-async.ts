/**
 * 03장 실습: Promise · async/await · 병렬 · 타임아웃 · 취소.  npm run lab:03:promise
 */
const sleep = (ms: number, value: string, fail = false) =>
  new Promise<string>((resolve, reject) => setTimeout(() => (fail ? reject(new Error(`${value} 실패`)) : resolve(value)), ms));

async function main() {
  // 1) 순차: 300 + 300 = 약 600ms
  let t = Date.now();
  await sleep(300, 'A');
  await sleep(300, 'B');
  console.log(`순차 await: ${Date.now() - t}ms`);

  // 2) 병렬: 동시에 시작하고 둘 다 기다림 → 약 300ms
  t = Date.now();
  await Promise.all([sleep(300, 'A'), sleep(300, 'B')]);
  console.log(`Promise.all: ${Date.now() - t}ms`);

  // 3) all 은 하나라도 실패하면 즉시 실패. allSettled 는 전부 결과를 모은다
  try {
    await Promise.all([sleep(100, 'ok'), sleep(50, 'bad', true)]);
  } catch (e) {
    console.log(`Promise.all 하나 실패 → 전체 실패: ${(e as Error).message}`);
  }
  const settled = await Promise.allSettled([sleep(100, 'ok'), sleep(50, 'bad', true)]);
  console.log('allSettled:', settled.map((s) => s.status).join(', '));

  // 4) 타임아웃: 가장 먼저 끝나는 것 (race). 06장 서버 간 호출의 핵심
  const withTimeout = <T>(p: Promise<T>, ms: number) =>
    Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${ms}ms 타임아웃`)), ms))]);
  try {
    await withTimeout(sleep(1000, 'slow'), 200);
  } catch (e) {
    console.log(`race 타임아웃: ${(e as Error).message}  (주의: 느린 작업 자체는 계속 돌고 있다!)`);
  }

  // 5) 진짜 취소: AbortController — fetch 는 signal 을 받아 실제로 요청을 중단한다
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 100);
  try {
    await fetch('http://10.255.255.1/', { signal: ctrl.signal }); // 응답 없는 주소
  } catch (e) {
    console.log(`AbortController 로 취소: ${(e as Error).name}`);
  }
  // 더 짧게: AbortSignal.timeout(ms) — web/tenant-backend/server.ts 가 이렇게 쓴다
  try {
    await fetch('http://10.255.255.1/', { signal: AbortSignal.timeout(150) });
  } catch (e) {
    console.log(`AbortSignal.timeout: ${(e as Error).name}`);
  }

  // 6) 흔한 실수: await 를 빼먹으면 오류가 try/catch 를 빠져나간다
  try {
    void sleep(10, 'x', true).catch((e: Error) => console.log(`await 없이 던진 오류는 여기(catch 콜백)서만 잡힌다: ${e.message}`));
  } catch {
    console.log('여기는 실행되지 않는다');
  }
  await sleep(20, 'wait');
}

void main();
