/**
 * 09장 실습: 서버가 재시작해서 1000명이 동시에 끊겼다. 다시 붙는 시점은 어떻게 분포할까?
 *   npm run lab:09
 */
import { backoffDelay } from '../../web/sdk/src/backoff.ts';

const CLIENTS = 1000;
const BUCKET = 500; // ms
const HORIZON = 16_000;

/**
 * 서버가 0~4초 동안 죽어 있다가 4초에 살아난다. 각 클라이언트의 "살아난 뒤 첫 시도" 시각을 모은다.
 * 이 순간에 몰리는 수가 곧 "막 살아난 서버가 한꺼번에 받는 부하"다.
 */
function simulate(name: string, delayOf: (attempt: number) => number) {
  const RECOVER = 4000;
  const hits = new Array(HORIZON / BUCKET).fill(0) as number[];
  let wasted = 0; // 죽어 있는 서버를 두드린 헛시도
  for (let c = 0; c < CLIENTS; c++) {
    let t = 0;
    for (let attempt = 0; ; attempt++) {
      t += delayOf(attempt);
      if (t < RECOVER) {
        wasted++;
        continue;
      }
      if (t < HORIZON) hits[Math.floor(t / BUCKET)]!++;
      break;
    }
  }
  console.log(`\n■ ${name}  — 서버가 살아난 뒤(4s~) 접속 분포, 한 구간 최대 ${Math.max(...hits)}명 / 헛시도 ${wasted}회`);
  hits.forEach((n, i) => {
    if (n > 0) console.log(`  ${String((i * BUCKET) / 1000).padStart(4)}s ${'█'.repeat(Math.ceil(n / 20))} ${n}`);
  });
}

simulate('고정 1초 간격', () => 1000);
simulate('지수 백오프 (jitter 없음)', (a) => Math.min(15_000, 500 * 2 ** a));
simulate('지수 백오프 + full jitter', (a) => backoffDelay(a));

console.log(`
관찰
  - 고정 간격: 서버가 살아난 바로 그 순간 1000명이 동시에 들어온다(막대 하나가 1000). 이 폭주가 막 살아난 서버를 다시 죽인다.
  - 지수 백오프만: 장애가 길수록 헛시도가 줄지만(이 예는 4초라 차이가 작다), 모두 "같은 시각"(7.5s)에 몰리는 건 그대로다.
  - full jitter: 접속이 여러 구간으로 흩어져 한 구간 최대치가 크게 낮아진다. 대신 일부는 조금 더 늦게 붙는다(트레이드오프).

heartbeat 협상 (STOMP 1.2):
  클라이언트 CONNECT heart-beat:cx,cy   (cx: 내가 보낼 수 있는 주기, cy: 상대에게 원하는 주기)
  서버      CONNECTED heart-beat:sx,sy
  클라이언트→서버 실제 주기 = max(cx, sy)   (둘 중 하나라도 0 이면 안 보냄)
  서버→클라이언트 실제 주기 = max(sx, cy)
  예) 클라이언트 10000,10000 / 서버 10000,10000 → 양방향 10초. 보통 2~3배 시간 동안 아무것도 안 오면 끊긴 것으로 본다.
`);
