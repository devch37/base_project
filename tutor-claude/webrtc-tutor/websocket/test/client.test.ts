/** WsClient(재연결 클라이언트) 테스트 */
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { describe, it } from 'node:test';
import WebSocket from 'ws';
import { type ClientOptions, RequestError, WsClient } from '../src/client';
import { CloseCode, WsServer } from '../src/index';
import { sleep, waitFor } from './helpers';

async function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as { port: number }).port;
      s.close(() => resolve(p));
    });
  });
}

const fast: Partial<ClientOptions> = { WebSocket: WebSocket as never, backoff: { baseMs: 10, maxMs: 80, factor: 2 }, pingIntervalMs: 0 };

describe('WsClient', () => {
  it('연결 → request/응답 → 방 입장', async () => {
    const server = new WsServer({ heartbeat: false });
    server.on('echo', (ctx) => ctx.reply(ctx.msg.payload));
    const port = await server.start();
    const c = new WsClient({ url: `ws://127.0.0.1:${port}/ws`, ...fast });
    await c.connect();
    assert.equal(c.state, 'open');
    assert.ok(c.peerId);
    assert.deepEqual((await c.request('echo', { n: 1 })).payload, { n: 1 });
    const j = await c.joinRoom('lobby');
    assert.equal(j.members.length, 1);
    await assert.rejects(c.request('nope'), (e) => e instanceof RequestError && e.code === 'unknown_type');
    c.close();
    await server.close({ graceMs: 100 });
  });

  it('서버가 재시작되면 자동 재연결 + 방 자동 재입장', async () => {
    const port = await freePort();
    let server = new WsServer({ port, heartbeat: false });
    await server.start();
    const c = new WsClient({ url: `ws://127.0.0.1:${port}/ws`, ...fast });
    const events: string[] = [];
    c.on('close', (e) => events.push(`close:${e.code}:${e.willReconnect}`));
    c.on('reconnecting', (e) => events.push(`reconnecting:${e.attempt}`));
    c.on('open', (e) => events.push(`open:${e.reconnected}`));
    await c.connect();
    await c.joinRoom('lobby');

    await server.close({ graceMs: 100, reconnectJitterMs: 1 }); // 1012 로 종료
    server = new WsServer({ port, heartbeat: false });
    await server.start();

    await waitFor(() => events.includes('open:true'), 3000);
    await waitFor(() => server.hub.localRoomSize('lobby') === 1, 2000); // autoRejoin
    assert.ok(events.includes(`close:${CloseCode.SERVICE_RESTART}:true`));
    assert.ok(events.some((e) => e.startsWith('reconnecting:')));
    c.close();
    await server.close({ graceMs: 100 });
  });

  it('재연결하면 안 되는 close code(4001)면 멈춘다', async () => {
    const server = new WsServer({ heartbeat: false });
    server.on('kickme', (ctx) => ctx.conn.close(CloseCode.AUTH_FAILED, 'bye'));
    const port = await server.start();
    const c = new WsClient({ url: `ws://127.0.0.1:${port}/ws`, ...fast });
    await c.connect();
    c.send('kickme');
    await waitFor(() => c.state === 'closed');
    await sleep(100);
    assert.equal(c.state, 'closed'); // 재연결 시도 없음
    assert.equal(server.metrics.totalConnections, 1);
    await server.close({ graceMs: 100 });
  });

  it('연결이 끊기면 진행 중인 request 는 reject', async () => {
    const server = new WsServer({ heartbeat: false });
    server.on('slow', () => new Promise(() => {})); // 영원히 응답 안 함
    const port = await server.start();
    const c = new WsClient({ url: `ws://127.0.0.1:${port}/ws`, ...fast, reconnect: false });
    await c.connect();
    // reject 가 먼저 일어나도 "처리되지 않은 rejection" 이 되지 않도록, 서버를 닫기 전에 검증 핸들러를 먼저 단다
    const rejected = assert.rejects(c.request('slow', undefined, { timeoutMs: 5000 }), (e) => e instanceof RequestError && e.code === 'connection_lost');
    await sleep(30);
    await server.close({ graceMs: 50 });
    await rejected;
    c.close();
  });

  it('요청 타임아웃', async () => {
    const server = new WsServer({ heartbeat: false });
    server.on('slow', () => new Promise(() => {}));
    const port = await server.start();
    const c = new WsClient({ url: `ws://127.0.0.1:${port}/ws`, ...fast });
    await c.connect();
    await assert.rejects(c.request('slow', undefined, { timeoutMs: 60 }), (e) => e instanceof RequestError && e.code === 'timeout');
    c.close();
    await server.close({ graceMs: 100 });
  });

  it('앱 레벨 ping 에 pong 이 안 오면 죽은 연결로 판단하고 재연결', async () => {
    const server = new WsServer({ heartbeat: false });
    let pings = 0;
    server.on('ping', () => {
      pings++; // 응답하지 않는다 → 조용히 죽은 연결을 흉내
    });
    const port = await server.start();
    const c = new WsClient({ url: `ws://127.0.0.1:${port}/ws`, ...fast, pingIntervalMs: 40, pingTimeoutMs: 40 });
    const closes: number[] = [];
    c.on('close', (e) => closes.push(e.code));
    await c.connect();
    await waitFor(() => closes.includes(4010), 2000);
    await waitFor(() => server.metrics.totalConnections >= 2, 2000); // 새로 연결했다
    assert.ok(pings >= 1);
    c.close();
    await server.close({ graceMs: 100 });
  });

  it('오프라인 중 보낸 메시지는 큐에 쌓였다가 재연결 후 전송된다', async () => {
    const port = await freePort();
    let server = new WsServer({ port, heartbeat: false });
    const received: unknown[] = [];
    const register = (s: WsServer) => s.on('note', (ctx) => void received.push(ctx.msg.payload));
    register(server);
    await server.start();
    const c = new WsClient({ url: `ws://127.0.0.1:${port}/ws`, ...fast });
    await c.connect();
    await server.close({ graceMs: 50, reconnectJitterMs: 1 });
    await waitFor(() => c.state === 'reconnecting', 1000);
    assert.equal(c.send('note', 'queued-1'), 'queued');
    server = new WsServer({ port, heartbeat: false });
    register(server);
    await server.start();
    await waitFor(() => received.length === 1, 3000);
    assert.deepEqual(received, ['queued-1']);
    c.close();
    await server.close({ graceMs: 100 });
  });

  it('url 함수는 재연결할 때마다 다시 호출된다 (매번 새 ticket 을 받는 용도)', async () => {
    const port = await freePort();
    let server = new WsServer({ port, heartbeat: false });
    await server.start();
    let calls = 0;
    const c = new WsClient({ url: () => `ws://127.0.0.1:${port}/ws?n=${++calls}`, ...fast });
    await c.connect();
    await server.close({ graceMs: 50, reconnectJitterMs: 1 });
    server = new WsServer({ port, heartbeat: false });
    await server.start();
    await waitFor(() => c.state === 'open' && calls >= 2, 3000);
    assert.ok(calls >= 2);
    c.close();
    await server.close({ graceMs: 100 });
  });
});
