/** npm run ws:04 — 하트비트로 좀비 연결 정리 / 재연결 백오프 / 지터 시뮬레이션 */
import { createServer } from 'node:net';
import WebSocket from 'ws';
import { say, sleep, until } from '../../tools/narrate';
import { ReconnectingSocket } from './reconnecting-socket';
import { simulate } from './jitter-simulation';
import { startHeartbeatServer } from './server';

async function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as { port: number }).port;
      s.close(() => resolve(p));
    });
  });
}

say.title('4. 하트비트와 재연결');

// ── ① 하트비트 ────────────────────────────────────────────────────────────────
say.step('① 하트비트: 정상 클라이언트는 유지되고, 응답 없는 "좀비" 클라이언트는 정리된다');
{
  const server = await startHeartbeatServer({ intervalMs: 300 });
  const url = `ws://localhost:${server.port}`;
  const healthy = new WebSocket(url); // ws 클라이언트는 ping 에 자동으로 pong 한다
  // autoPong:false → ping 을 받아도 pong 을 보내지 않는다 = 와이파이가 끊겨 응답 못 하는 기기 흉내
  const zombie = new WebSocket(url, { autoPong: false } as WebSocket.ClientOptions);
  await Promise.all([new Promise((r) => healthy.once('open', r)), new Promise((r) => zombie.once('open', r))]);
  say.server(`접속자 ${server.wss.clients.size}명 (정상 1 + 좀비 1)`);

  await until(() => server.terminated() >= 1, 3000, '좀비 정리');
  await sleep(50);
  say.ok(`좀비만 정리됨. 남은 접속자 ${server.wss.clients.size}명 (정상 클라이언트 readyState=${healthy.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED'})`);
  healthy.close();
  await server.close();
}

// ── ② 하트비트가 없다면? ──────────────────────────────────────────────────────
say.step('② 비교: 하트비트를 끄면 좀비가 영원히 남는다');
{
  const server = await startHeartbeatServer({ intervalMs: 300, heartbeat: false });
  const zombie = new WebSocket(`ws://localhost:${server.port}`, { autoPong: false } as WebSocket.ClientOptions);
  await new Promise((r) => zombie.once('open', r));
  await sleep(1200);
  say.warn(`1.2초가 지나도 서버는 여전히 접속자 ${server.wss.clients.size}명으로 알고 있다 (실제로는 죽은 연결). 실서비스에선 이런 유령이 쌓인다`);
  zombie.terminate();
  await server.close();
}

// ── ③ 재연결 ─────────────────────────────────────────────────────────────────
say.step('③ 재연결: 서버가 꺼져 있으면 백오프(지수 + Full Jitter)로 재시도, 켜지면 접속');
{
  const port = await freePort();
  const sock = new ReconnectingSocket(`ws://localhost:${port}`, { baseMs: 100, maxMs: 800, factor: 2, jitter: 'full' });
  sock.onRetry = (attempt, delay) => say.client('client', `연결 실패 → ${attempt}번째 재시도를 ${delay}ms 뒤에 (상한 ${Math.min(800, 100 * 2 ** (attempt - 1))}ms)`);
  let opened = false;
  sock.onOpen = () => ((opened = true), say.client('client', '✔ 연결 성공! (백오프 카운터 초기화)'));
  sock.start();

  await sleep(1500);
  say.server('서버 시작');
  const server = await startHeartbeatServer({ port });
  await until(() => opened, 5000, '재연결');

  say.step('   서버가 갑자기 죽으면? 다시 백오프로 재시도');
  opened = false;
  await server.close();
  await sleep(600);
  sock.stop();
}

// ── ④ 지터 ───────────────────────────────────────────────────────────────────
say.step('④ 지터가 필요한 이유: 서버 재시작 직후 10,000 클라이언트의 재접속 시도 분포');
const none = simulate('none');
const full = simulate('full');
say.note(`지터 없음 → 가장 몰린 구간 ${none.peak}건 / Full Jitter → ${full.peak}건  (${(none.peak / full.peak).toFixed(1)}배 완화)`);
say.note('자세한 히스토그램: npx tsx websocket/2-intermediate/04-heartbeat-reconnect/jitter-simulation.ts');

say.ok('4장 데모 끝');
