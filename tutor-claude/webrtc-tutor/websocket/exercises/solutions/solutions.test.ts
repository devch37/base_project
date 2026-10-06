/** 연습 해답 검증: npm test -w @tutor/ws-kit 에 포함된다. */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { WsServer, issueTicket, verifyTicket } from '@tutor/ws-kit';
import { TestClient, sleep, startRedis, type RedisHandle } from '../../test/helpers';
import { RedisTicketStore } from './redis-ticket-store';
import { installTypingIndicator } from './typing-indicator';

describe('E1 RedisTicketStore', () => {
  let redis: RedisHandle | null = null;
  before(async () => void (redis = await startRedis()));
  after(async () => void (await redis?.stop()));

  it('두 서버(= 두 스토어 인스턴스)가 같은 ticket 을 각각 소비하려 해도 한 번만 성공한다', async (t) => {
    if (!redis) return t.skip('redis-server 없음');
    const serverA = new RedisTicketStore(redis.url);
    const serverB = new RedisTicketStore(redis.url);
    const ticket = verifyTicket(issueTicket({ sub: 'alice' }, 's'), 's');
    const results = await Promise.all([serverA.consume(ticket.jti, 5000), serverB.consume(ticket.jti, 5000)]);
    assert.deepEqual(results.sort(), [false, true]); // 정확히 한쪽만 성공 (원자성)
    assert.equal(await serverA.consume(ticket.jti, 5000), false);
    await serverA.close();
    await serverB.close();
  });

  it('TTL 이 지나면 같은 키를 다시 소비할 수 있다 (메모리 누수 방지용 만료)', async (t) => {
    if (!redis) return t.skip('redis-server 없음');
    const s = new RedisTicketStore(redis.url);
    assert.equal(await s.consume('exp-1', 50), true);
    await sleep(120);
    assert.equal(await s.consume('exp-1', 50), true);
    await s.close();
  });
});

describe('E2 typing indicator', () => {
  it('throttle + 종료는 즉시 + 방 밖은 거절', async () => {
    const server = new WsServer({ heartbeat: false, rateLimit: false });
    installTypingIndicator(server, 200);
    const url = `ws://127.0.0.1:${await server.start()}/ws`;
    const a = await new TestClient(url).opened();
    const b = await new TestClient(url).opened();
    await a.request('room.join', { room: 'r' });
    await b.request('room.join', { room: 'r' });
    await a.nextType('room.peer-joined').catch(() => {});
    b.inbox.length = a.inbox.length = 0;

    for (let i = 0; i < 10; i++) a.send('typing', { room: 'r', typing: true }); // 10번 연타
    await sleep(100);
    assert.equal(b.inbox.filter((m) => m.type === 'typing').length, 1); // throttle 로 1번만 전파

    a.send('typing', { room: 'r', typing: false }); // 종료는 throttle 없이 즉시
    await sleep(50);
    assert.equal(b.inbox.filter((m) => m.type === 'typing').length, 2);
    assert.equal((b.inbox.filter((m) => m.type === 'typing')[1]!.payload as { typing: boolean }).typing, false);

    const bad = await a.request('typing', { room: 'other', typing: true });
    assert.equal(bad.error?.code, 'not_in_room');
    a.close();
    b.close();
    await server.close({ graceMs: 100 });
  });
});
