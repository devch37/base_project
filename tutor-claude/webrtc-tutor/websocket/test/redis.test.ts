/** Redis 구현 전용 테스트: Pub/Sub(일반/Sharded), Presence TTL, 노드 크래시 후 유령 정리 (redis-server 필요, 없으면 skip) */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { RedisBus, RedisPresence, WsServer } from '../src/index';
import { type RedisHandle, TestClient, sleep, startRedis, waitFor } from './helpers';

describe('Redis', () => {
  let redis: RedisHandle | null = null;
  before(async () => {
    redis = await startRedis();
  });
  after(async () => {
    await redis?.stop();
  });

  for (const sharded of [false, true]) {
    it(`RedisBus pub/sub (${sharded ? 'sharded' : 'classic'})`, async (t) => {
      if (!redis) return t.skip('redis-server 없음');
      const a = new RedisBus(redis.url, { sharded });
      const b = new RedisBus(redis.url, { sharded });
      const got: unknown[] = [];
      const handler = (d: unknown) => got.push(d);
      await b.subscribe('ch:1', handler);
      await a.publish('ch:1', { hello: 'world' });
      await waitFor(() => got.length === 1);
      assert.deepEqual(got[0], { hello: 'world' });

      // 구독 해제 후 발행한 메시지는 영영 받지 못한다 (Pub/Sub = at-most-once)
      await b.unsubscribe('ch:1', handler);
      await a.publish('ch:1', { lost: true });
      await b.subscribe('ch:1', handler);
      await sleep(100);
      assert.equal(got.length, 1);
      await a.close();
      await b.close();
    });
  }

  it('Presence: TTL 이 지나면 사라지고, refresh 하면 유지된다', async (t) => {
    if (!redis) return t.skip('redis-server 없음');
    const p = new RedisPresence(redis.url, 300, `ttl${Date.now()}`);
    const peer = { peerId: 'p1', userId: 'u1', nodeId: 'n1' };
    await p.registerConn('p1', 'n1');
    await p.join('r', peer);
    assert.equal((await p.members('r')).length, 1);
    assert.equal(await p.locate('p1'), 'n1');

    await sleep(200);
    await p.refresh([{ room: 'r', peer }], ['p1'], 'n1'); // 갱신
    await sleep(200); // 처음 등록 후 400ms 지남 > TTL(300) 이지만 갱신했으므로 유지
    assert.equal((await p.members('r')).length, 1);
    assert.equal(await p.locate('p1'), 'n1');

    await sleep(400); // 갱신 없이 TTL 경과
    assert.equal((await p.members('r')).length, 0);
    assert.equal(await p.locate('p1'), null);
    await p.close();
  });

  it('노드가 크래시하면(정리 코드 없이) 그 노드의 유령 접속자는 TTL 후 사라지고 다른 노드의 멤버는 유지된다', async (t) => {
    if (!redis) return t.skip('redis-server 없음');
    const prefix = `crash${Date.now()}`;
    const mk = (id: string) => new WsServer({ nodeId: id, bus: new RedisBus(redis!.url), presence: new RedisPresence(redis!.url, 400, prefix), heartbeat: false, presenceRefreshMs: 100 });
    const a = mk('A');
    const b = mk('B');
    const urlA = `ws://127.0.0.1:${await a.start()}/ws`;
    const urlB = `ws://127.0.0.1:${await b.start()}/ws`;
    const alice = await new TestClient(urlA).opened();
    const bob = await new TestClient(urlB).opened();
    await alice.request('room.join', { room: 'r' });
    await bob.request('room.join', { room: 'r' });
    assert.equal((await a.presence.members('r')).length, 2);

    b.simulateCrash(); // B 가 정리 없이 죽는다
    await sleep(100);
    assert.equal((await a.presence.members('r')).length, 2, '크래시 직후엔 B 의 유령이 아직 남아 있다');
    assert.equal(await a.presence.locate(bob.peerId), 'B');

    await waitFor(async () => (await a.presence.members('r')).length === 1, 3000); // TTL 경과 후 자동 정리
    assert.equal(await a.presence.locate(bob.peerId), null);
    assert.equal((await a.presence.members('r'))[0]!.nodeId, 'A'); // A 의 alice 는 refresh 로 계속 유지

    alice.close();
    await a.close({ graceMs: 100 });
    // 크래시한 노드는 스스로 정리하지 못했으니, 테스트가 대신 Redis 연결을 닫는다 (프로세스가 안 끝나는 것 방지)
    await b.bus.close();
    await b.presence.close();
  });
});
