/** npm run ws:06 — 느린 소비자 / 백프레셔 전략 / 속도 제한 */
import { TokenBucket } from '@tutor/ws-kit';
import { WebSocketServer, type WebSocket } from 'ws';
import WebSocket_ from 'ws';
import { say, sleep, until } from '../../tools/narrate';
import { ConflatingSender, guardedSend, streamWithBackpressure } from './backpressure';

const mb = (n: number) => (n / 1024 / 1024).toFixed(1) + 'MB';
const rssMb = () => process.memoryUsage().rss;

/** 서버 하나를 띄우고, "첫 연결"의 서버측 소켓을 돌려주는 도우미 */
async function setup(): Promise<{ wss: WebSocketServer; serverSide: Promise<WebSocket>; url: string }> {
  const wss = new WebSocketServer({ port: 0 });
  await new Promise((r) => wss.once('listening', r));
  const serverSide = new Promise<WebSocket>((resolve) => wss.once('connection', (ws) => (ws.on('error', () => {}), resolve(ws))));
  return { wss, serverSide, url: `ws://127.0.0.1:${(wss.address() as { port: number }).port}` };
}

/** 클라이언트가 소켓 읽기를 멈춘다 = 화면이 얼었거나 네트워크가 매우 느린 상황 */
function pauseReading(ws: WebSocket_): void {
  (ws as unknown as { _socket: { pause(): void } })._socket.pause();
}
function resumeReading(ws: WebSocket_): void {
  (ws as unknown as { _socket: { resume(): void } })._socket.resume();
}

say.title('6. 백프레셔와 속도 제한');

// ── ① 무방비: 느린 소비자 한 명이 서버 메모리를 부풀린다 ───────────────────────────
say.step('① 무방비 서버: 클라이언트가 읽지 않는데 서버가 계속 send() 하면?');
{
  const { wss, serverSide, url } = await setup();
  const client = new WebSocket_(url);
  await new Promise((r) => client.once('open', r));
  pauseReading(client);
  const ws = await serverSide;

  const before = rssMb();
  // 실제 서비스처럼 메시지마다 "서로 다른" 64KB 버퍼 (같은 버퍼를 재사용하면 메모리를 공유해서 증가가 안 보인다)
  for (let i = 0; i < 1000; i++) ws.send(Buffer.alloc(64 * 1024, i % 256), () => {}); // 64MB 를 "한 번에" 밀어 넣는다. send 는 즉시 리턴한다!
  say.server(`1000번 send() 호출이 즉시 끝남. ws.bufferedAmount = ${mb(ws.bufferedAmount)}  /  RSS 증가 ≈ ${mb(rssMb() - before)}`);
  say.warn('느린 클라이언트 1명이 서버 메모리를 이만큼 붙잡고 있다. 1000명이면? → OOM 으로 서버 전체가 죽는다');
  client.terminate();
  ws.terminate();
  await new Promise((r) => wss.close(r));
}

// ── ② 한계선으로 방어 ────────────────────────────────────────────────────────
say.step('② guardedSend: soft 1MB 초과 시 lossy 는 버리고, hard 4MB 초과 시 연결을 끊는다');
{
  const { wss, serverSide, url } = await setup();
  const client = new WebSocket_(url);
  await new Promise((r) => client.once('open', r));
  pauseReading(client);
  const ws = await serverSide;

  const limits = { softBytes: 1024 * 1024, hardBytes: 4 * 1024 * 1024 };
  const chunk = Buffer.alloc(64 * 1024, 1);
  let sent = 0;
  let dropped = 0;
  let outcome = '';
  let maxBuf = 0;
  for (let i = 0; i < 1000; i++) {
    const r = guardedSend(ws, chunk, limits, { lossy: i % 2 === 0 }); // 짝수 번째는 버려도 되는 메시지라고 가정
    maxBuf = Math.max(maxBuf, ws.bufferedAmount);
    if (r === 'sent') sent++;
    else if (r === 'dropped') dropped++;
    else {
      outcome = r;
      break;
    }
  }
  say.server(`전송 ${sent}건 / 버림 ${dropped}건 / 마지막 결과: ${outcome}  /  관측된 최대 버퍼 = ${mb(maxBuf)} (hard 한계 ${mb(limits.hardBytes)} 근처에서 차단)`);
  say.ok('메모리가 한계선에서 멈췄다. 한 명의 느린 소비자가 서버를 죽일 수 없다');
  client.terminate();
  await new Promise((r) => wss.close(r));
}

// ── ③ 스트리밍은 백프레셔로 기다리며 보낸다 ───────────────────────────────────
say.step('③ streamWithBackpressure: 19MB 를 "빠짐없이" 보내되 서버 메모리는 제한 (소비자는 느리게 읽음)');
{
  const { wss, serverSide, url } = await setup();
  const client = new WebSocket_(url);
  await new Promise((r) => client.once('open', r));
  let received = 0;
  client.on('message', (d) => (received += (d as Buffer).length));
  const ws = await serverSide;

  // 소비자: 100ms 읽고 100ms 멈추기를 반복 → 처리량이 낮은 느린 클라이언트
  let paused = false;
  const pacer = setInterval(() => ((paused = !paused), paused ? pauseReading(client) : resumeReading(client)), 100);

  const chunks = Array.from({ length: 300 }, () => Buffer.alloc(64 * 1024, 7)); // 300 × 64KB = 18.75MB
  const max = await streamWithBackpressure(ws, chunks, 256 * 1024);
  clearInterval(pacer);
  resumeReading(client);
  await until(() => received >= 300 * 64 * 1024, 15000, '전체 수신');
  say.server(`스트리밍 중 최대 버퍼 ${mb(max)} (highWater 256KB 근처) — 19MB 를 보냈지만 서버 메모리는 거의 늘지 않았다`);
  say.ok(`클라이언트가 ${mb(received)} 를 하나도 빠짐없이 수신`);
  client.close();
  await new Promise((r) => wss.close(r));
}

// ── ④ Conflation ─────────────────────────────────────────────────────────────
say.step('④ ConflatingSender: 3개 키가 초당 수천 번 갱신되어도, 느린 클라이언트에는 "최신 값"만 전달');
{
  const { wss, serverSide, url } = await setup();
  const client = new WebSocket_(url);
  await new Promise((r) => client.once('open', r));
  const msgs: { batch: Record<string, number> }[] = [];
  client.on('message', (d) => msgs.push(JSON.parse(d.toString())));
  const ws = await serverSide;
  pauseReading(client); // 클라이언트가 멈춘 상태에서도 서버는 계속 갱신을 생산한다

  const sender = new ConflatingSender(ws, { sendWhenBufferedBelow: 1 }); // 이미 보낸 게 남아 있으면 더 보내지 않는다
  let produced = 0;
  const gen = setInterval(() => {
    for (let i = 0; i < 30; i++) {
      sender.set('btc', 60000 + produced);
      sender.set('eth', 3000 + produced);
      sender.set('sol', 150 + produced);
      produced += 3;
    }
  }, 5);
  await sleep(600);
  clearInterval(gen);
  sender.set('btc', 99999); // 마지막 값
  await sleep(100);
  resumeReading(client); // 클라이언트가 살아남
  await sleep(300);
  sender.stop();

  const last = msgs[msgs.length - 1]?.batch ?? {};
  say.server(`서버가 생산한 갱신 ≈ ${produced}건, 병합으로 덮어쓴 값 ${sender.conflated}건, 실제 전송 메시지 ${sender.sentMessages}건`);
  say.client('client', `수신한 메시지 ${msgs.length}건. 마지막 btc = ${last.btc} (최신 값이 정확히 도착)`);
  client.close();
  await new Promise((r) => wss.close(r));
}

// ── ⑤ 인바운드 속도 제한 ─────────────────────────────────────────────────────
say.step('⑤ 인바운드 속도 제한(토큰 버킷): 클라이언트가 초당 수천 개를 쏘면?');
{
  const wss = new WebSocketServer({ port: 0 });
  await new Promise((r) => wss.once('listening', r));
  let accepted = 0;
  let rejected = 0;
  wss.on('connection', (ws) => {
    const bucket = new TokenBucket(20, 10); // 버스트 20, 평균 초당 10
    ws.on('error', () => {});
    ws.on('message', () => (bucket.tryTake() ? accepted++ : rejected++));
  });
  const c = new WebSocket_(`ws://127.0.0.1:${(wss.address() as { port: number }).port}`);
  await new Promise((r) => c.once('open', r));
  for (let i = 0; i < 200; i++) c.send('spam');
  await sleep(200);
  say.server(`200건 폭주 → 처리 ${accepted}건 / 거절 ${rejected}건 (버스트 20 만 통과, 이후 초당 10 으로 제한)`);
  c.close();
  await new Promise((r) => wss.close(r));
}

say.ok('6장 데모 끝');
