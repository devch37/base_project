/**
 * npm run ws:08 — 서버 3대 + Redis + 로드밸런서
 *   · 서로 다른 노드의 사용자끼리 채팅 / 1:1 메시지
 *   · Redis 채널 구독이 "그 방에 사람이 있는 노드"에만 생기는 것 관찰
 *   · 노드 크래시 → 클라이언트 자동 장애 조치(failover) + 유령 접속자 TTL 정리
 *   · Pub/Sub 의 한계(at-most-once) 확인
 *
 * Redis 가 필요합니다. (REDIS_URL 이 없으면 로컬 redis-server 를 임시로 띄웁니다)
 */
import { Redis } from 'ioredis';
import { RedisBus } from '@tutor/ws-kit';
import { WsClient } from '@tutor/ws-kit/client';
import WebSocket from 'ws';
import { ensureRedis } from '../../tools/redis';
import { say, sleep, until } from '../../tools/narrate';
import { startLb } from './lb';
import { type Node, startNode } from './node';

const redis = await ensureRedis();
say.title(`8. 스케일 아웃: 서버 3대 + Redis (${redis.spawned ? '임시 redis-server' : redis.url})`);
const inspector = new Redis(redis.url); // Redis 안을 들여다보는 관찰자

const prefix = `demo${Date.now()}`;
const nodes: Node[] = [];
for (const id of ['A', 'B', 'C']) {
  nodes.push(await startNode({ id, redisUrl: redis.url, presenceTtlMs: 1200, presenceRefreshMs: 300, keyPrefix: prefix }));
}
const liveNodes = () => nodes.filter((n) => !crashed.has(n.id)).map((n) => n.port);
const crashed = new Set<string>();
const lb = await startLb(liveNodes, 'round-robin');
say.server(`노드 A:${nodes[0]!.port}  B:${nodes[1]!.port}  C:${nodes[2]!.port}   로드밸런서(L4 round-robin): :${lb.port}`);

const chatLog: string[] = [];
function makeClient(name: string): WsClient {
  const c = new WsClient({ url: `ws://127.0.0.1:${lb.port}/ws`, WebSocket: WebSocket as never, backoff: { baseMs: 30, maxMs: 200, factor: 2 }, pingIntervalMs: 0 });
  c.on('message', (e) => {
    if (e.type === 'room.message') chatLog.push(`${name} ← ${(e.payload as { data: string }).data}`);
    if (e.type === 'room.direct') chatLog.push(`${name} ← (1:1) ${JSON.stringify((e.payload as { data: unknown }).data)}`);
  });
  return c;
}

// ── ① LB 가 사용자를 노드에 분산 ──────────────────────────────────────────────
say.step('① 6명의 사용자가 로드밸런서로 접속 → 3개 노드에 분산된다');
const names = ['alice', 'bob', 'carol', 'dave', 'erin', 'frank'];
const clients = new Map<string, WsClient>();
for (const n of names) {
  const c = makeClient(n);
  await c.connect();
  clients.set(n, c);
}
say.note(names.map((n) => `${n}→노드${clients.get(n)!.nodeId}`).join('  '));
say.note(`LB 가 백엔드별로 배정한 연결 수: ${JSON.stringify(Object.fromEntries(nodes.map((n) => [n.id, lb.connectionsPerBackend()[n.port] ?? 0])))}`);

// ── ② Redis 구독은 "그 방에 사람이 있는 노드"에만 ─────────────────────────────
say.step('② 방 "lobby" 에 alice(노드 A쪽), bob(B쪽) 만 입장 → Redis 채널 구독 관찰');
const nodeOf = (n: string) => clients.get(n)!.nodeId;
await clients.get('alice')!.joinRoom('lobby', { name: 'alice' });
await clients.get('bob')!.joinRoom('lobby', { name: 'bob' });
const subs = await inspector.pubsub('CHANNELS', 'room:*');
say.note(`현재 Redis 에 열려 있는 방 채널: ${JSON.stringify(subs)}`);
say.note(`alice 노드=${nodeOf('alice')}, bob 노드=${nodeOf('bob')} — 이 두 노드만 room:lobby 를 구독 중. 나머지 노드는 lobby 트래픽을 받지 않는다`);
const numsub = await inspector.pubsub('NUMSUB', 'room:lobby');
say.note(`room:lobby 구독자 수 = ${numsub[1]} (노드 수준. 연결 수가 아니다 — 방 인원이 수만 명이어도 Redis 입장에서 구독자는 노드 수다)`);

// ── ③ 노드를 가로지르는 대화 ──────────────────────────────────────────────────
say.step('③ 다른 노드에 붙은 두 사람이 같은 방에서 대화, 그리고 1:1 메시지');
const members = await clients.get('carol')!.joinRoom('lobby', { name: 'carol' });
say.client('carol', `입장 직후 멤버 목록(Presence 공유): ${members.members.map((m) => `${(m.meta as { name: string }).name}@${m.nodeId}`).join(', ')}`);
clients.get('alice')!.send('room.message', { room: 'lobby', data: '안녕, 모두!' });
await sleep(100);
const bobPeer = clients.get('bob')!.peerId;
const direct = await clients.get('alice')!.request<{ delivered: string }>('room.direct', { room: 'lobby', to: bobPeer, data: { secret: 'only-for-bob' } });
await sleep(100);
chatLog.forEach((l) => say.client('chat', l));
say.note(`1:1 메시지 전달 경로 = ${direct.payload!.delivered} (remote = 다른 노드 → Presence 로 위치 조회 후 node:<id> 채널로 전달)`);

// ── ④ 노드 크래시와 failover ─────────────────────────────────────────────────
say.step('④ 노드 하나가 갑자기 죽는다(kill -9 흉내) → 그 노드의 사용자는 자동 재연결 + 방 자동 재입장');
const victim = nodes.find((n) => n.id === nodeOf('bob'))!;
const victims = names.filter((n) => nodeOf(n) === victim.id);
say.note(`죽일 노드: ${victim.id} (여기에 붙은 사용자: ${victims.join(', ')})`);
chatLog.length = 0;
crashed.add(victim.id);
victim.server.simulateCrash();
await until(() => victims.every((n) => clients.get(n)!.state === 'open' && clients.get(n)!.nodeId !== victim.id), 5000, 'failover');
say.ok(`재연결 완료: ${victims.map((n) => `${n}→노드${clients.get(n)!.nodeId}`).join('  ')} (WsClient 가 백오프 재연결 + joinRoom 자동 재입장)`);

const members2 = (await nodes.find((n) => !crashed.has(n.id))!.server.presence.members('lobby')).map((m) => `${(m.meta as { name: string }).name}@${m.nodeId}`);
say.note(`죽은 노드의 유령이 TTL(1.2초) 전까지 presence 에 섞여 있을 수 있다. 현재 lobby 멤버: ${members2.join(', ')}`);
await sleep(1600); // TTL 경과
const alivePresence = (await nodes.find((n) => !crashed.has(n.id))!.server.presence.members('lobby')).map((m) => `${(m.meta as { name: string }).name}@${m.nodeId}`);
say.ok(`TTL 경과 후 lobby 멤버: ${alivePresence.join(', ')}  ← 죽은 노드(${victim.id}) 항목은 자연 소멸, 재연결한 사용자는 새 노드로 등록`);

clients.get('alice')!.send('room.message', { room: 'lobby', data: '장애 이후에도 대화가 이어진다' });
await sleep(150);
chatLog.forEach((l) => say.client('chat', l));

// ── ⑤ Pub/Sub 한계 ──────────────────────────────────────────────────────────
say.step('⑤ Redis Pub/Sub 은 at-most-once: 구독하지 않은 순간의 메시지는 영영 사라진다');
{
  const pubBus = new RedisBus(redis.url);
  const subBus = new RedisBus(redis.url);
  const got: unknown[] = [];
  const h = (d: unknown) => got.push(d);
  await subBus.subscribe('demo:ch', h);
  await pubBus.publish('demo:ch', 'm1');
  await sleep(50);
  await subBus.unsubscribe('demo:ch', h); // 잠깐 끊김(재연결, 노드 재시작 흉내)
  await pubBus.publish('demo:ch', 'm2-lost');
  await subBus.subscribe('demo:ch', h);
  await pubBus.publish('demo:ch', 'm3');
  await sleep(100);
  say.note(`수신한 메시지: ${JSON.stringify(got)}  ← m2 는 구독자가 없던 순간이라 어디에도 남지 않았다`);
  say.note('→ "유실되면 안 되는" 이벤트는 Pub/Sub 이 아니라 Redis Streams / Kafka / DB(outbox) 로 (7장 + README)');
  await pubBus.close();
  await subBus.close();
}

// ── 정리 ────────────────────────────────────────────────────────────────────
for (const c of clients.values()) c.close();
for (const n of nodes) {
  if (crashed.has(n.id)) {
    await n.server.bus.close(); // 크래시한 노드의 Redis 연결은 데모가 대신 정리
    await n.server.presence.close();
  } else await n.server.close({ graceMs: 200 });
}
await lb.close();
await inspector.quit();
await redis.stop();
say.ok('8장 데모 끝');
