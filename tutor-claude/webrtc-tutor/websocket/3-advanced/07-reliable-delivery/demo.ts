/** npm run ws:07 — seq + resume / 중복 제거 / 버퍼 초과(gap) / 멱등성 키 */
import { RequestError } from '@tutor/ws-kit/client';
import { say, sleep, until } from '../../tools/narrate';
import { ReliableStreamClient } from './client';
import { startReliableServer } from './server';

say.title('7. 신뢰성 있는 전달: seq · resume · 멱등성');

/** 연속된 정수 [1..n] 인지 */
const contiguous = (a: number[]) => a.every((v, i) => v === i + 1);

// ── ① resume ──────────────────────────────────────────────────────────────────
say.step('① 연결이 끊긴 사이 발행된 이벤트를, 재연결 후 resume 으로 빠짐없이 복구');
{
  const { server, port, publish } = await startReliableServer({ replayCapacity: 1000 });
  const realUrl = `ws://127.0.0.1:${port}/ws`;

  // "단절 구간"을 정확히 통제하기 위한 문(gate): 문이 닫혀 있으면 클라이언트는 재연결을 못 한다 (url 함수가 대기)
  let openGate: () => void = () => {};
  let gate: Promise<void> = Promise.resolve();
  const closeGate = () => (gate = new Promise<void>((r) => (openGate = r)));
  const gatedUrl = async () => (await gate, realUrl);

  const reliable = new ReliableStreamClient(gatedUrl);
  await reliable.connect();
  await until(() => reliable.stats.resumes.length >= 1, 2000, '첫 구독');

  // 비교용: seq/resume 없이 "그냥 방에만 들어간" 순진한 클라이언트
  const { WsClient } = await import('@tutor/ws-kit/client');
  const WS = (await import('ws')).default;
  const naive = new WsClient({ url: gatedUrl, WebSocket: WS as never, backoff: { baseMs: 20, maxMs: 100, factor: 2 }, pingIntervalMs: 0 });
  const naiveGot: number[] = [];
  naive.on('message', (e) => e.seq !== undefined && naiveGot.push(e.seq));
  await naive.connect();
  await naive.joinRoom('stream:events'); // 재연결하면 방에는 다시 들어가지만, 놓친 이벤트는 모른다

  say.step('   이벤트 1~10 을 발행');
  for (let i = 1; i <= 10; i++) await publish({ n: i });
  await until(() => reliable.stats.delivered.length === 10 && naiveGot.length === 10, 2000, '10개 수신');

  say.step('   네트워크 단절: 서버가 두 연결을 강제로 끊고(재연결 불가 상태), 그 사이 11~20 발행');
  closeGate();
  for (const id of [reliable.ws.peerId, naive.peerId]) server.hub.getConnection(id)?.ws.terminate();
  await until(() => reliable.ws.state === 'reconnecting' && naive.state === 'reconnecting', 2000, '단절 감지');
  for (let i = 11; i <= 20; i++) await publish({ n: i });
  say.note('11~20 은 두 클라이언트 모두 연결이 없던 사이에 발행되었다 (실시간 전달 불가)');

  say.step('   네트워크 복구: 재연결 허용');
  openGate();
  await until(() => reliable.ws.state === 'open' && naive.state === 'open', 3000, '재연결');
  await sleep(100);
  for (let i = 21; i <= 25; i++) await publish({ n: i }); // 재연결 이후의 정상 이벤트
  await until(() => reliable.stats.delivered.length === 25 && naiveGot.length === 15, 2000, '최종 수신');

  say.client('reliable', `수신 seq: ${reliable.stats.delivered.join(',')}`);
  say.client('reliable', `연속(1..${reliable.stats.delivered.length})? ${contiguous(reliable.stats.delivered) ? '✔ 빠짐없이' : '✖ 누락'} / 중복 ${reliable.stats.duplicates}건 걸러냄 / resume 기록 ${JSON.stringify(reliable.stats.resumes)}`);
  say.client('naive', `수신 seq: ${naiveGot.join(',')}   ← 11~20 을 영영 못 받았다`);

  reliable.close();
  naive.close();
  await server.close({ graceMs: 100 });
}

// ── ② gap ────────────────────────────────────────────────────────────────────
say.step('② 너무 오래 끊겨서 버퍼(5개)를 벗어나면? → "gap" 응답 → 스냅샷으로 전체 재동기화');
{
  const { server, port, publish } = await startReliableServer({ replayCapacity: 5 });
  let openGate: () => void = () => {};
  let gate: Promise<void> = Promise.resolve();
  const url = `ws://127.0.0.1:${port}/ws`;
  const reliable = new ReliableStreamClient(async () => (await gate, url));
  let resynced: unknown = null;
  reliable.onFullResync = (s) => (resynced = s);
  await reliable.connect();
  await until(() => reliable.stats.resumes.length >= 1, 2000, '첫 구독');
  for (let i = 1; i <= 3; i++) await publish({ n: i });
  await until(() => reliable.stats.delivered.length === 3, 2000, '3개');

  gate = new Promise<void>((r) => (openGate = r)); // 재연결을 막고
  server.hub.getConnection(reliable.ws.peerId)?.ws.terminate();
  await until(() => reliable.ws.state === 'reconnecting', 2000, '단절 감지');
  for (let i = 4; i <= 30; i++) await publish({ n: i }); // 27개 놓침. 버퍼는 최근 5개만 보관
  openGate();
  await until(() => reliable.stats.resumes.some((r) => r.mode === 'gap'), 3000, 'gap');
  await sleep(50);
  say.client('client', `resume 응답: ${JSON.stringify(reliable.stats.resumes)}`);
  say.client('client', `스냅샷으로 전체 재동기화: ${JSON.stringify(resynced)} → seq 를 ${reliable.tracker.last} 로 맞춤`);
  say.note('이 경우 앱은 "놓친 이벤트 재생" 대신 "현재 상태를 통째로 다시 그리기"를 해야 한다. 버퍼 크기는 "허용할 단절 시간 × 이벤트율"로 정한다.');
  reliable.close();
  await server.close({ graceMs: 100 });
}

// ── ③ 멱등성 ─────────────────────────────────────────────────────────────────
say.step('③ 응답이 유실되어 클라이언트가 재시도해도, 주문은 "한 번만" 생성된다 (멱등성 키)');
{
  const { server, port, orders } = await startReliableServer();
  const { WsClient } = await import('@tutor/ws-kit/client');
  const WS = (await import('ws')).default;
  const c = new WsClient({ url: `ws://127.0.0.1:${port}/ws`, WebSocket: WS as never, pingIntervalMs: 0, requestTimeoutMs: 200 });
  await c.connect();

  const idempotencyKey = 'order-2026-10-06-aaaa'; // 클라이언트가 "이 주문 시도"마다 한 번 생성 (UUID)
  await c.request('debug.drop-next-reply');

  say.step('   첫 시도: 서버는 주문을 만들었지만 응답이 유실됨 → 클라이언트 입장에선 실패인지 성공인지 알 수 없다');
  try {
    await c.request('order.create', { idempotencyKey, item: '키보드' });
  } catch (e) {
    say.warn(`클라이언트: ${(e as RequestError).code} — 서버가 처리했는지 모른다`);
  }
  say.server(`이 시점의 실제 주문 수 = ${orders.length}`);

  say.step('   안전하게 재시도 (같은 키)');
  const retry = await c.request<{ orderId: number; duplicate: boolean }>('order.create', { idempotencyKey, item: '키보드' });
  say.client('client', `재시도 응답: ${JSON.stringify(retry.payload)}  ← duplicate:true = 새로 만들지 않고 기존 결과를 돌려줌`);
  say.ok(`최종 주문 수 = ${orders.length} (키 없이 재시도했다면 2건 → 이중 결제!)`);
  c.close();
  await server.close({ graceMs: 100 });
}

say.ok('7장 데모 끝');
