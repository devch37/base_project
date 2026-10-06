/**
 * node.ts — 스케일 아웃된 "한 대의 서버(노드)"
 *
 * 노드가 하는 일은 단일 서버와 똑같다. 달라진 것은 딱 두 가지 부품뿐이다.
 *   bus      : MemoryBus  →  RedisBus      (다른 노드로 메시지를 전달하는 통로)
 *   presence : Memory     →  RedisPresence (누가 어느 노드에 있는지 공유하는 저장소)
 * 나머지(Hub, 핸들러, 인증, 백프레셔 …)는 코드를 한 줄도 바꾸지 않는다. 추상화(Bus/Presence)의 보상이다.
 */
import { RedisBus, RedisPresence, WsServer } from '@tutor/ws-kit';

export interface NodeOptions {
  id: string;
  redisUrl: string;
  port?: number;
  /** presence 항목 TTL(ms). 노드가 죽으면 이 시간 뒤에 유령이 사라진다 */
  presenceTtlMs?: number;
  presenceRefreshMs?: number;
  sharded?: boolean;
  keyPrefix?: string;
}

export async function startNode(o: NodeOptions) {
  const server = new WsServer({
    nodeId: o.id,
    port: o.port ?? 0,
    bus: new RedisBus(o.redisUrl, { sharded: o.sharded ?? false }),
    presence: new RedisPresence(o.redisUrl, o.presenceTtlMs ?? 30_000, o.keyPrefix ?? 'ws'),
    presenceRefreshMs: o.presenceRefreshMs ?? 10_000,
    heartbeat: false,
    rateLimit: false,
  });
  const port = await server.start();
  return { id: o.id, server, port };
}
export type Node = Awaited<ReturnType<typeof startNode>>;
