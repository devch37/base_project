/**
 * jitter-simulation.ts — "왜 지터가 필요한가"를 숫자로 확인하는 시뮬레이션
 *
 * 시나리오: 서버가 재시작되어 10,000 클라이언트가 같은 순간 끊겼다.
 * 각 클라이언트는 백오프로 재연결을 시도한다. 시각별로 몇 명이 동시에 접속을 시도하는지 히스토그램으로 본다.
 *
 * 실행: npx tsx websocket/2-intermediate/04-heartbeat-reconnect/jitter-simulation.ts
 */
import { say } from '../../tools/narrate';
import { type BackoffOptions, backoffDelay } from './reconnecting-socket';

export function simulate(jitter: BackoffOptions['jitter'], clients = 10_000, seed = 42): { buckets: number[]; peak: number; bucketMs: number } {
  // 재현 가능한 난수 (mulberry32)
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const opts: BackoffOptions = { baseMs: 2000, maxMs: 30_000, factor: 2, jitter };
  const bucketMs = 250;
  const horizon = 10_000; // 처음 10초만 관찰
  const buckets = new Array<number>(horizon / bucketMs).fill(0);

  for (let c = 0; c < clients; c++) {
    // 서버가 계속 거절한다고 가정 (모든 시도가 실패) → 시도 시각을 누적
    let t = 0;
    for (let attempt = 0; attempt < 6; attempt++) {
      t += backoffDelay(attempt, opts, rand);
      if (t >= horizon) break;
      buckets[Math.floor(t / bucketMs)]!++;
    }
  }
  return { buckets, peak: Math.max(...buckets), bucketMs };
}

function render(title: string, r: ReturnType<typeof simulate>): void {
  say.step(title);
  const scale = 50 / r.peak;
  r.buckets.forEach((n, i) => {
    const bar = '█'.repeat(Math.round(n * scale));
    console.log(`  ${String((i * r.bucketMs) / 1000).padStart(4)}s │${bar} ${n}`);
  });
  say.note(`가장 몰린 250ms 구간의 동시 접속 시도: ${r.peak}건`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  say.title('지터가 없으면 재연결 쓰나미가 생긴다 (클라이언트 10,000명)');
  render('지터 없음: 모두가 2s, 6s, 14s … 에 "동시에"', simulate('none'));
  render('Full Jitter: 0 ~ 상한 사이에 고르게 분산', simulate('full'));
}
