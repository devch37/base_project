/**
 * 분산(멀티 노드) 테스트: 서로 다른 서버에 붙은 클라이언트끼리 통신되는가?
 * 같은 시나리오를 InMemoryBus(가짜 네트워크)와 RedisBus(진짜 Redis) 두 가지로 돌린다.
 * redis-server 가 없으면 Redis 쪽은 skip 한다.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Bus, MemoryBusNetwork, MemoryPresence, type Presence, RedisBus, RedisPresence, WsServer } from '../src/index';
import { type RedisHandle, TestClient, sleep, startRedis, waitFor } from './helpers';

interface Env {
  makeBus(): Bus;
  presence(): Presence;
  stop?(): Promise<void>;
}

function runClusterSuite(name: string, setup: () => Promise<Env | null>) {
  describe(`분산 ${name}`, () => {
    let env: Env | null = null;
    let a: WsServer;
    let b: WsServer;
    let urlA: string;
    let urlB: string;
    let skip = false;

    before(async () => {
      env = await setup();
      if (!env) {
        skip = true;
        return;
      }
      // 두 노드는 같은 버스 네트워크(=Redis)와 같은 Presence 저장소를 공유한다.
      a = new WsServer({ nodeId: 'A', bus: env.makeBus(), presence: env.presence(), heartbeat: false });
      b = new WsServer({ nodeId: 'B', bus: env.makeBus(), presence: env.presence(), heartbeat: false });
      urlA = `ws://127.0.0.1:${await a.start()}/ws`;
      urlB = `ws://127.0.0.1:${await b.start()}/ws`;
    });

    after(async () => {
      if (skip) return;
      await a.close({ graceMs: 100 });
      await b.close({ graceMs: 100, closeBus: true });
      await env?.stop?.();
    });

    it('다른 노드에 붙은 두 사람이 같은 방에서 대화한다', async (t) => {
      if (skip) return t.skip('redis-server 없음');
      const alice = await new TestClient(urlA).opened(); // 노드 A
      const bob = await new TestClient(urlB).opened(); // 노드 B
      await alice.request('room.join', { room: 'lobby' });
      const jb = await bob.request('room.join', { room: 'lobby' });
      // bob 의 입장 응답 멤버 목록에 노드가 다른 alice 가 보인다 (Presence 공유)
      const members = (jb.payload as { members: { peerId: string; nodeId: string }[] }).members;
      assert.deepEqual(members.map((m) => m.nodeId).sort(), ['A', 'B']);

      // alice(A)가 입장한 뒤 bob(B)이 들어오면, A 의 alice 는 B 에서 발생한 peer-joined 를 받는다
      const joined = await alice.nextType('room.peer-joined');
      assert.equal((joined.payload as { peerId: string }).peerId, bob.peerId);

      // 브로드캐스트: A → B
      alice.send('room.message', { room: 'lobby', data: 'from-A' });
      assert.equal(((await bob.nextType('room.message')).payload as { data: string }).data, 'from-A');
      // 브로드캐스트: B → A
      bob.send('room.message', { room: 'lobby', data: 'from-B' });
      assert.equal(((await alice.nextType('room.message')).payload as { data: string }).data, 'from-B');

      alice.close();
      bob.close();
    });

    it('room.direct 는 다른 노드의 peer 에게도 전달된다 (Presence 로 위치 조회)', async (t) => {
      if (skip) return t.skip('redis-server 없음');
      const alice = await new TestClient(urlA).opened();
      const bob = await new TestClient(urlB).opened();
      await alice.request('room.join', { room: 'call' });
      await bob.request('room.join', { room: 'call' });
      const r = await alice.request('room.direct', { room: 'call', to: bob.peerId, data: { sdp: 'x' } });
      assert.deepEqual(r.payload, { delivered: 'remote' });
      const got = await bob.nextType('room.direct');
      assert.equal(got.from, alice.peerId);
      assert.deepEqual((got.payload as { data: unknown }).data, { sdp: 'x' });
      alice.close();
      bob.close();
    });

    it('방에 사람이 없는 노드는 그 방의 버스 구독을 하지 않는다', async (t) => {
      if (skip) return t.skip('redis-server 없음');
      const alice = await new TestClient(urlA).opened();
      await alice.request('room.join', { room: 'only-a' });
      assert.equal(a.hub.localRoomSize('only-a'), 1);
      assert.equal(b.hub.localRoomSize('only-a'), 0); // B 는 이 방 트래픽을 받지 않는다
      alice.close();
      await waitFor(() => a.hub.localRoomSize('only-a') === 0);
    });

    it('연결이 끊기면 다른 노드에도 peer-left 가 전달된다', async (t) => {
      if (skip) return t.skip('redis-server 없음');
      const alice = await new TestClient(urlA).opened();
      const bob = await new TestClient(urlB).opened();
      await alice.request('room.join', { room: 'leave-test' });
      await bob.request('room.join', { room: 'leave-test' });
      await alice.nextType('room.peer-joined');
      bob.close();
      const left = await alice.nextType('room.peer-left');
      assert.equal((left.payload as { peerId: string }).peerId, bob.peerId);
      await sleep(30);
      alice.close();
    });
  });
}

runClusterSuite('(InMemoryBus)', async () => {
  const net = new MemoryBusNetwork();
  return { makeBus: () => net.connect(), presence: (() => { const p = new MemoryPresence(); return () => p; })() };
});

let redis: RedisHandle | null = null;
runClusterSuite('(Redis)', async () => {
  redis = await startRedis();
  if (!redis) return null;
  const url = redis.url;
  const prefix = `t${Math.random().toString(36).slice(2, 6)}`; // 두 노드가 같은 키 공간을 보도록 한 번만 생성
  return {
    makeBus: () => new RedisBus(url),
    presence: () => new RedisPresence(url, 5000, prefix),
    stop: () => redis!.stop(),
  };
});
