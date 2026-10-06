/**
 * hub.ts — 방(Room) 관리 + 노드 간 라우팅
 *
 * Hub 가 책임지는 것
 *   1) 이 서버(노드)에 붙은 연결들의 방 소속 관리         → local 맵
 *   2) 방 브로드캐스트: 로컬 멤버에게 직접 + 다른 노드에게는 Bus 로
 *   3) 특정 peer 에게 직접 전송: 로컬이면 바로, 다른 노드면 Presence 로 위치 찾아 Bus 로
 *
 * ── Bus 채널 설계 ────────────────────────────────────────────────────────────
 *   `room:<roomId>`   방 브로드캐스트용.  그 방의 멤버가 "이 노드에 1명이라도 있을 때만" 구독한다.
 *   `node:<nodeId>`   노드 개인 우편함. 특정 peer 로 가는 직접 메시지를 그 peer 가 있는 노드로 전달.
 *
 *  → 방에 아무도 없는 노드는 그 방 트래픽을 전혀 받지 않는다. (노드 수가 늘어도 비용이 선형으로만 증가)
 *
 * ── 중복 전달 방지 ───────────────────────────────────────────────────────────
 *  브로드캐스트 시 로컬 멤버에게는 직접 보내고, 같은 메시지를 Bus 에도 발행한다.
 *  Bus 가 내 노드에게도 되돌려주므로(Redis 는 구독자 모두에게 전달) `origin === 내 nodeId` 인 것은 무시한다.
 */
import type { Bus, BusHandler } from './bus';
import type { Connection } from './connection';
import type { Logger } from './logger';
import type { Metrics } from './metrics';
import type { PeerInfo, Presence } from './presence';
import { type Envelope, encode } from './protocol';

interface RoomBusMessage {
  origin: string;
  except?: string;
  lossy?: boolean;
  json: string;
}
interface NodeBusMessage {
  to: string;
  lossy?: boolean;
  json: string;
}

export interface HubOptions {
  nodeId: string;
  bus: Bus;
  presence: Presence;
  log: Logger;
  metrics: Metrics;
}

export class Hub {
  /** room → 이 노드에 있는 멤버 연결들 */
  private readonly local = new Map<string, Set<Connection>>();
  /** peerId → 이 노드의 연결 */
  private readonly conns = new Map<string, Connection>();
  /** room → 이 노드가 Bus 에 등록한 핸들러 (구독 해제 시 필요) */
  private readonly roomHandlers = new Map<string, BusHandler>();
  private readonly nodeChannel: string;
  private readonly onNodeMessage: BusHandler;

  constructor(private readonly o: HubOptions) {
    this.nodeChannel = `node:${o.nodeId}`;
    this.onNodeMessage = (data) => {
      const m = data as NodeBusMessage;
      o.metrics.busReceived++;
      this.conns.get(m.to)?.sendRaw(m.json, { lossy: m.lossy });
    };
  }

  async start(): Promise<void> {
    await this.o.bus.subscribe(this.nodeChannel, this.onNodeMessage);
  }

  async stop(): Promise<void> {
    await this.o.bus.unsubscribe(this.nodeChannel, this.onNodeMessage);
    for (const [room, h] of this.roomHandlers) await this.o.bus.unsubscribe(`room:${room}`, h);
    this.roomHandlers.clear();
  }

  // ── 연결 등록 ──────────────────────────────────────────────────────────────
  async attach(conn: Connection): Promise<void> {
    this.conns.set(conn.id, conn);
    await this.o.presence.registerConn(conn.id, this.o.nodeId);
  }

  async detach(conn: Connection): Promise<void> {
    await this.leaveAll(conn);
    this.conns.delete(conn.id);
    await this.o.presence.unregisterConn(conn.id);
  }

  getConnection(peerId: string): Connection | undefined {
    return this.conns.get(peerId);
  }

  get connectionCount(): number {
    return this.conns.size;
  }

  /** 이 노드가 보유한 모든 연결 (종료 알림 등에 사용) */
  allConnections(): IterableIterator<Connection> {
    return this.conns.values();
  }

  localRoomSize(room: string): number {
    return this.local.get(room)?.size ?? 0;
  }

  /** TTL 갱신용: 이 노드가 가진 모든 (방, peer) 와 peerId 목록 */
  snapshot(): { items: { room: string; peer: PeerInfo }[]; peerIds: string[] } {
    const items: { room: string; peer: PeerInfo }[] = [];
    for (const c of this.conns.values()) for (const [room, peer] of c.rooms) items.push({ room, peer });
    return { items, peerIds: [...this.conns.keys()] };
  }

  // ── 방 입장/퇴장 ────────────────────────────────────────────────────────────
  /** 방에 입장하고, 입장 직후의 전체 멤버 목록(나 포함)을 돌려준다 */
  async join(conn: Connection, room: string, meta?: Record<string, unknown>): Promise<PeerInfo[]> {
    if (conn.rooms.has(room)) return this.o.presence.members(room); // 멱등: 두 번 join 해도 안전

    const info: PeerInfo = { peerId: conn.id, userId: conn.user.userId, nodeId: this.o.nodeId, ...(meta ? { meta } : {}) };
    conn.rooms.set(room, info);

    let set = this.local.get(room);
    if (!set) {
      this.local.set(room, (set = new Set()));
      // 이 노드의 "첫 멤버"가 들어올 때만 Bus 구독. (presence.join 보다 먼저 → 입장 직후 이벤트를 놓치지 않는다)
      const handler: BusHandler = (data) => this.onRoomMessage(room, data as RoomBusMessage);
      this.roomHandlers.set(room, handler);
      await this.o.bus.subscribe(`room:${room}`, handler);
    }
    set.add(conn);

    await this.o.presence.join(room, info);
    const members = await this.o.presence.members(room);

    await this.broadcast(room, { v: 1, type: 'room.peer-joined', room, payload: info }, { except: conn.id });
    return members;
  }

  async leave(conn: Connection, room: string): Promise<void> {
    const info = conn.rooms.get(room);
    if (!info) return;
    conn.rooms.delete(room);

    const set = this.local.get(room);
    set?.delete(conn);
    await this.o.presence.leave(room, conn.id);

    // 남아 있는 사람들에게 알림 (나는 이미 set 에서 빠졌으므로 로컬 전달에서 자동 제외)
    await this.broadcast(room, { v: 1, type: 'room.peer-left', room, payload: info });

    if (set && set.size === 0) {
      this.local.delete(room);
      const h = this.roomHandlers.get(room);
      if (h) {
        this.roomHandlers.delete(room);
        await this.o.bus.unsubscribe(`room:${room}`, h); // 이 노드엔 더 이상 그 방 사람이 없다 → 구독 해제
      }
    }
  }

  async leaveAll(conn: Connection): Promise<void> {
    for (const room of [...conn.rooms.keys()]) await this.leave(conn, room);
  }

  // ── 전송 ───────────────────────────────────────────────────────────────────
  /** 방 전체에게 전송. `except` 로 보낸 사람 제외 가능. `lossy` 면 느린 소비자에겐 건너뜀 */
  async broadcast(room: string, env: Envelope, opts: { except?: string; lossy?: boolean } = {}): Promise<void> {
    const json = encode(env); // 직렬화는 한 번만
    this.deliverLocal(room, json, opts.except, opts.lossy);

    this.o.metrics.busPublished++;
    const msg: RoomBusMessage = { origin: this.o.nodeId, json, ...(opts.except ? { except: opts.except } : {}), ...(opts.lossy ? { lossy: true } : {}) };
    await this.o.bus.publish(`room:${room}`, msg);
  }

  /** 특정 peer 한 명에게 전송. 반환: 어디로 보냈는지 */
  async sendToPeer(peerId: string, env: Envelope, opts: { lossy?: boolean } = {}): Promise<'local' | 'remote' | 'unknown'> {
    const local = this.conns.get(peerId);
    if (local) {
      local.send(env, opts);
      return 'local';
    }
    const nodeId = await this.o.presence.locate(peerId);
    if (!nodeId || nodeId === this.o.nodeId) return 'unknown'; // 접속 종료됐거나 만료
    this.o.metrics.busPublished++;
    const msg: NodeBusMessage = { to: peerId, json: encode(env), ...(opts.lossy ? { lossy: true } : {}) };
    await this.o.bus.publish(`node:${nodeId}`, msg);
    return 'remote';
  }

  // ── 내부 ───────────────────────────────────────────────────────────────────
  private onRoomMessage(room: string, m: RoomBusMessage): void {
    this.o.metrics.busReceived++;
    if (m.origin === this.o.nodeId) return; // 내가 발행한 것 — 이미 로컬 전달 완료
    this.deliverLocal(room, m.json, m.except, m.lossy);
  }

  private deliverLocal(room: string, json: string, except?: string, lossy?: boolean): void {
    const set = this.local.get(room);
    if (!set) return;
    for (const c of set) {
      if (c.id === except) continue;
      c.sendRaw(json, { lossy });
    }
  }
}
