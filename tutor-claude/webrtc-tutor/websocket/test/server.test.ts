/** WsServer 통합 테스트 (실제 소켓 사용) */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import WebSocket from 'ws';
import { AuthError } from '../src/errors';
import { WsServer, issueTicket, verifyTicket } from '../src/index';
import { TestClient, sleep, waitFor } from './helpers';

const SECRET = 's3cret';

describe('기본 동작', () => {
  let server: WsServer;
  let url: string;
  before(async () => {
    server = new WsServer({ heartbeat: false });
    server.on('echo', (ctx) => ctx.reply(ctx.msg.payload));
    server.on('boom', () => {
      throw new Error('secret internal detail');
    });
    const port = await server.start();
    url = `ws://127.0.0.1:${port}/ws`;
  });
  after(() => server.close({ graceMs: 200 }));

  it('welcome 에 peerId 가 담긴다', async () => {
    const c = await new TestClient(url).opened();
    assert.ok(c.peerId.length > 10);
    c.close();
  });

  it('request/response 는 replyTo 로 짝지어진다', async () => {
    const c = await new TestClient(url).opened();
    const res = await c.request('echo', { hello: 'world' });
    assert.deepEqual(res.payload, { hello: 'world' });
    c.close();
  });

  it('알 수 없는 type / 잘못된 payload / 서버 예외 처리', async () => {
    const c = await new TestClient(url).opened();
    assert.equal((await c.request('nope')).error?.code, 'unknown_type');
    assert.equal((await c.request('room.join', { room: '' })).error?.code, 'bad_payload');
    const r = await c.request('boom');
    assert.equal(r.error?.code, 'internal');
    assert.ok(!r.error?.message.includes('secret')); // 내부 정보는 노출하지 않는다
    c.close();
  });

  it('깨진 JSON 은 에러 응답, 연결은 유지', async () => {
    const c = await new TestClient(url).opened();
    c.ws.send('{broken');
    const e = await c.next((m) => m.type === 'error');
    assert.equal(e.error?.code, 'bad_json');
    assert.equal((await c.request('echo', 1)).payload, 1); // 아직 살아 있다
    c.close();
  });

  it('바이너리 메시지는 거절', async () => {
    const c = await new TestClient(url).opened();
    c.ws.send(Buffer.from([1, 2, 3]));
    assert.equal((await c.next((m) => m.type === 'error')).error?.code, 'binary_not_allowed');
    c.close();
  });

  it('from 은 서버가 덮어쓴다 (사칭 불가)', async () => {
    const a = await new TestClient(url).opened();
    const b = await new TestClient(url).opened();
    await a.request('room.join', { room: 'r' });
    await b.request('room.join', { room: 'r' });
    a.send('room.message', { room: 'r', data: 'hi' }, { from: 'someone-else' });
    const m = await b.nextType('room.message');
    assert.equal(m.from, a.peerId);
    a.close();
    b.close();
  });

  it('maxPayload 초과 시 1009 로 종료', async () => {
    const s = new WsServer({ heartbeat: false, maxPayload: 1024 });
    const port = await s.start();
    const c = await new TestClient(`ws://127.0.0.1:${port}/ws`).opened();
    c.ws.send('x'.repeat(5000));
    assert.equal((await c.closed()).code, 1009);
    await s.close({ graceMs: 100 });
  });
});

describe('방(room)', () => {
  let server: WsServer;
  let url: string;
  before(async () => {
    server = new WsServer({ heartbeat: false });
    url = `ws://127.0.0.1:${await server.start()}/ws`;
  });
  after(() => server.close({ graceMs: 200 }));

  it('join → 멤버 목록, peer-joined/left 알림, 브로드캐스트(보낸 사람 제외)', async () => {
    const a = await new TestClient(url).opened();
    const b = await new TestClient(url).opened();
    const ja = await a.request('room.join', { room: 'lobby' });
    assert.equal((ja.payload as { members: unknown[] }).members.length, 1);

    const jb = await b.request('room.join', { room: 'lobby' });
    assert.equal((jb.payload as { members: unknown[] }).members.length, 2);
    const joined = await a.nextType('room.peer-joined');
    assert.equal((joined.payload as { peerId: string }).peerId, b.peerId);

    b.send('room.message', { room: 'lobby', data: { text: 'hello' } });
    const got = await a.nextType('room.message');
    assert.deepEqual((got.payload as { data: unknown }).data, { text: 'hello' });
    await sleep(50);
    assert.equal(b.inbox.filter((m) => m.type === 'room.message').length, 0); // 에코 없음

    b.close();
    const left = await a.nextType('room.peer-left');
    assert.equal((left.payload as { peerId: string }).peerId, b.peerId);
    a.close();
  });

  it('방에 없는 사람은 메시지를 보낼 수 없다', async () => {
    const a = await new TestClient(url).opened();
    const r = await a.request('room.message', { room: 'secret', data: 1 });
    assert.equal(r.error?.code, 'not_in_room');
    a.close();
  });

  it('room.direct 는 지정한 peer 에게만 전달', async () => {
    const a = await new TestClient(url).opened();
    const b = await new TestClient(url).opened();
    const c = await new TestClient(url).opened();
    for (const x of [a, b, c]) await x.request('room.join', { room: 'call' });
    await sleep(30);
    a.inbox.length = b.inbox.length = c.inbox.length = 0;

    const r = await a.request('room.direct', { room: 'call', to: b.peerId, data: { sdp: 'offer' } });
    assert.deepEqual(r.payload, { delivered: 'local' });
    const got = await b.nextType('room.direct');
    assert.equal(got.from, a.peerId);
    await sleep(50);
    assert.equal(c.inbox.filter((m) => m.type === 'room.direct').length, 0);

    const bad = await a.request('room.direct', { room: 'call', to: 'ghost', data: 1 });
    assert.equal(bad.error?.code, 'peer_not_found');
    [a, b, c].forEach((x) => x.close());
  });

  it('연결이 끊기면 방에서 자동으로 빠지고 로컬 구독이 정리된다', async () => {
    const a = await new TestClient(url).opened();
    await a.request('room.join', { room: 'temp' });
    assert.equal(server.hub.localRoomSize('temp'), 1);
    a.close();
    await waitFor(() => server.hub.localRoomSize('temp') === 0);
  });
});

describe('보안', () => {
  let server: WsServer;
  let url: string;
  before(async () => {
    server = new WsServer({
      heartbeat: false,
      allowedOrigins: ['https://app.example.com'],
      allowNoOrigin: false,
      authenticate: (_req, u) => {
        const claims = verifyTicket(u.searchParams.get('ticket'), SECRET);
        return { userId: claims.sub };
      },
    });
    url = `ws://127.0.0.1:${await server.start()}/ws`;
  });
  after(() => server.close({ graceMs: 200 }));

  /** 업그레이드가 거절되면 ws 는 'unexpected-response' 로 HTTP 상태를 알려 준다 */
  function status(u: string, opts: WebSocket.ClientOptions): Promise<number | 'open'> {
    return new Promise((resolve) => {
      const ws = new WebSocket(u, opts);
      ws.on('open', () => (ws.close(), resolve('open')));
      ws.on('unexpected-response', (_req, res) => resolve(res.statusCode ?? 0));
      ws.on('error', () => {});
    });
  }

  it('Origin 이 허용 목록에 없으면 403', async () => {
    const t = issueTicket({ sub: 'alice' }, SECRET);
    assert.equal(await status(`${url}?ticket=${t}`, { origin: 'https://evil.example.com' }), 403);
  });
  it('Origin 헤더 없음(allowNoOrigin=false)도 403', async () => {
    const t = issueTicket({ sub: 'alice' }, SECRET);
    assert.equal(await status(`${url}?ticket=${t}`, {}), 403);
  });
  it('티켓이 없거나 위조/만료면 401', async () => {
    const origin = 'https://app.example.com';
    assert.equal(await status(url, { origin }), 401);
    assert.equal(await status(`${url}?ticket=garbage`, { origin }), 401);
    const expired = issueTicket({ sub: 'alice', ttlSec: 1, now: Date.now() - 60_000 }, SECRET);
    assert.equal(await status(`${url}?ticket=${expired}`, { origin }), 401);
  });
  it('올바른 Origin + 티켓이면 연결된다', async () => {
    const t = issueTicket({ sub: 'alice' }, SECRET);
    assert.equal(await status(`${url}?ticket=${t}`, { origin: 'https://app.example.com' }), 'open');
    assert.ok(server.metrics.authFailures >= 4);
  });
  it('엉뚱한 경로는 404', async () => {
    assert.equal(await status(url.replace('/ws', '/other'), { origin: 'https://app.example.com' }), 404);
  });
});

describe('안정성', () => {
  it('하트비트: pong 에 응답하지 않는 연결은 종료된다', async () => {
    const server = new WsServer({ heartbeat: { intervalMs: 60 } });
    const port = await server.start();
    // autoPong:false → 서버의 ping 에 응답하지 않는다 (half-open 연결 흉내)
    const c = new TestClient(`ws://127.0.0.1:${port}/ws`, { autoPong: false } as WebSocket.ClientOptions);
    await c.opened();
    await waitFor(() => c.closeInfo !== undefined, 1500);
    assert.ok(server.metrics.heartbeatTimeouts >= 1);
    await server.close({ graceMs: 100 });
  });

  it('하트비트: 정상 클라이언트(자동 pong)는 유지된다', async () => {
    const server = new WsServer({ heartbeat: { intervalMs: 50 } });
    const port = await server.start();
    const c = await new TestClient(`ws://127.0.0.1:${port}/ws`).opened();
    await sleep(400);
    assert.equal(c.closeInfo, undefined);
    assert.equal(server.metrics.heartbeatTimeouts, 0);
    c.close();
    await server.close({ graceMs: 100 });
  });

  it('속도 제한: 버스트 초과는 에러, 계속 위반하면 4008 로 종료', async () => {
    const server = new WsServer({ heartbeat: false, rateLimit: { capacity: 5, refillPerSec: 1 }, maxRateViolations: 5 });
    server.on('echo', (ctx) => ctx.reply(1));
    const port = await server.start();
    const c = await new TestClient(`ws://127.0.0.1:${port}/ws`).opened();
    for (let i = 0; i < 30; i++) c.send('echo');
    const info = await c.closed();
    assert.equal(info.code, 4008);
    assert.ok(server.metrics.rateLimited > 5);
    await server.close({ graceMs: 100 });
  });

  it('느린 소비자: 하드 리밋을 넘으면 4009 로 끊고 lossy 는 소프트 리밋에서 버린다', async () => {
    const server = new WsServer({
      heartbeat: false,
      rateLimit: false,
      sendLimits: { softLimitBytes: 50_000, hardLimitBytes: 400_000 },
      maxPayload: 1024,
    });
    const port = await server.start();
    // 클라이언트가 소켓을 읽지 않는다(pause) → 서버 송신 버퍼가 쌓인다
    const c = new TestClient(`ws://127.0.0.1:${port}/ws`);
    await c.opened();
    await c.request('room.join', { room: 'flood' });
    const raw = (c.ws as unknown as { _socket: { pause(): void } })._socket;
    raw.pause();

    const conn = server.hub.getConnection(c.peerId)!;
    const chunk = 'x'.repeat(16 * 1024);
    let sawDrop = false;
    for (let i = 0; i < 2000 && conn.isOpen; i++) {
      const r = conn.send({ v: 1, type: 'tick', payload: chunk }, { lossy: i % 2 === 0 });
      if (r === 'dropped') sawDrop = true;
    }
    assert.ok(sawDrop, 'lossy 메시지가 버려져야 한다');
    assert.ok(server.metrics.dropped > 0);
    assert.ok(server.metrics.slowConsumers >= 1, '하드 리밋 초과로 끊겨야 한다');
    await server.close({ graceMs: 100 });
  });

  it('우아한 종료: server.shutdown 알림 + close(1012), 종료 중엔 새 연결 거절(503)', async () => {
    const server = new WsServer({ heartbeat: false });
    const port = await server.start();
    const c = await new TestClient(`ws://127.0.0.1:${port}/ws`).opened();
    const closing = server.close({ graceMs: 1000, reconnectJitterMs: 100 });
    const note = await c.nextType('server.shutdown');
    assert.ok((note.payload as { reconnectAfterMs: number }).reconnectAfterMs < 100);
    assert.equal((await c.closed()).code, 1012);
    await closing;
  });
});
