/**
 * presence.ts — "누가 어느 방에, 어느 서버에 접속해 있는가"
 *
 * 분산 환경에서는 "Bob 에게 직접 메시지를 보내려면 Bob 이 붙어 있는 서버를 알아야" 합니다.
 * 이 정보를 모든 노드가 공유하는 저장소가 Presence 입니다.
 *
 *   conn  테이블 :  peerId  →  nodeId             (이 연결은 어느 서버에 있나?)
 *   room  테이블 :  roomId  →  { peerId, userId, nodeId, meta }[]   (방 멤버 목록)
 *
 * ── 장애 내성: TTL(만료)이 핵심 ───────────────────────────────────────────────
 *  서버 프로세스가 `kill -9` 로 죽으면 정리 코드(close 핸들러)가 실행되지 않습니다.
 *  그러면 Presence 에 "유령 접속자"가 영원히 남죠.
 *  해결: 모든 항목에 만료 시각을 두고, 살아 있는 서버가 주기적으로 **갱신(refresh)** 한다.
 *        서버가 죽으면 갱신이 멈추고 → 항목은 TTL 후 자동으로 사라진다.
 *
 *  Redis 구현에서는
 *   - conn : `STRING` + PX(TTL)
 *   - room : `ZSET` (member = 멤버 JSON, score = 만료 시각 epoch ms)
 *            → 조회할 때 score > now 인 것만 읽으면 TTL 이 지난 항목은 자동 제외된다.
 *   (Redis 의 HASH 필드는 개별 TTL 이 없어서(7.4 미만) ZSET 패턴이 널리 쓰인다)
 */
import { Redis } from 'ioredis';

export interface PeerInfo {
  /** 연결 단위 ID (같은 사용자가 탭을 2개 열면 peerId 는 2개) */
  peerId: string;
  userId: string;
  /** 이 연결이 붙어 있는 서버 */
  nodeId: string;
  meta?: Record<string, unknown>;
}

export interface Presence {
  registerConn(peerId: string, nodeId: string): Promise<void>;
  unregisterConn(peerId: string): Promise<void>;
  /** peerId 가 붙어 있는 nodeId. 없으면(접속 종료/만료) null */
  locate(peerId: string): Promise<string | null>;

  join(room: string, peer: PeerInfo): Promise<void>;
  leave(room: string, peerId: string): Promise<void>;
  members(room: string): Promise<PeerInfo[]>;

  /** 살아 있는 서버가 자기 연결들의 TTL 을 연장 */
  refresh(items: { room: string; peer: PeerInfo }[], peerIds: string[], nodeId: string): Promise<void>;
  close(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
export class MemoryPresence implements Presence {
  private readonly conns = new Map<string, string>();
  private readonly rooms = new Map<string, Map<string, PeerInfo>>();

  async registerConn(peerId: string, nodeId: string): Promise<void> {
    this.conns.set(peerId, nodeId);
  }
  async unregisterConn(peerId: string): Promise<void> {
    this.conns.delete(peerId);
  }
  async locate(peerId: string): Promise<string | null> {
    return this.conns.get(peerId) ?? null;
  }
  async join(room: string, peer: PeerInfo): Promise<void> {
    let m = this.rooms.get(room);
    if (!m) this.rooms.set(room, (m = new Map()));
    m.set(peer.peerId, peer);
  }
  async leave(room: string, peerId: string): Promise<void> {
    const m = this.rooms.get(room);
    m?.delete(peerId);
    if (m && m.size === 0) this.rooms.delete(room);
  }
  async members(room: string): Promise<PeerInfo[]> {
    return [...(this.rooms.get(room)?.values() ?? [])];
  }
  async refresh(): Promise<void> {
    /* 메모리 구현은 만료가 없으므로 할 일 없음 */
  }
  async close(): Promise<void> {}
}

// ─────────────────────────────────────────────────────────────────────────────
export class RedisPresence implements Presence {
  private readonly redis: Redis;

  constructor(
    url: string,
    private readonly ttlMs = 30_000,
    private readonly prefix = 'ws',
  ) {
    this.redis = new Redis(url, { maxRetriesPerRequest: null });
  }

  private connKey = (peerId: string) => `${this.prefix}:conn:${peerId}`;
  private roomKey = (room: string) => `${this.prefix}:room:${room}`;

  async registerConn(peerId: string, nodeId: string): Promise<void> {
    await this.redis.set(this.connKey(peerId), nodeId, 'PX', this.ttlMs);
  }

  async unregisterConn(peerId: string): Promise<void> {
    await this.redis.del(this.connKey(peerId));
  }

  async locate(peerId: string): Promise<string | null> {
    return this.redis.get(this.connKey(peerId));
  }

  async join(room: string, peer: PeerInfo): Promise<void> {
    const key = this.roomKey(room);
    await this.redis
      .multi()
      .zadd(key, Date.now() + this.ttlMs, JSON.stringify(peer))
      .pexpire(key, this.ttlMs * 4) // 방 전체가 방치되어도 키가 영원히 남지 않도록 안전장치
      .exec();
  }

  async leave(room: string, peerId: string): Promise<void> {
    // member 가 JSON 문자열이라 peerId 만으로는 못 지운다 → 방 멤버를 읽어서 해당 peerId 를 찾아 제거
    const key = this.roomKey(room);
    const raw = await this.redis.zrange(key, 0, -1);
    const targets = raw.filter((r: string) => {
      try {
        return (JSON.parse(r) as PeerInfo).peerId === peerId;
      } catch {
        return false;
      }
    });
    if (targets.length) await this.redis.zrem(key, ...targets);
  }

  async members(room: string): Promise<PeerInfo[]> {
    const key = this.roomKey(room);
    const now = Date.now();
    // 만료된 유령 항목을 이 기회에 청소(lazy cleanup) + 유효한 것만 조회
    const [, raw] = (await this.redis
      .multi()
      .zremrangebyscore(key, '-inf', now)
      .zrangebyscore(key, now, '+inf')
      .exec()) as [unknown, [Error | null, string[]]];
    return (raw[1] ?? []).map((r) => JSON.parse(r) as PeerInfo);
  }

  async refresh(items: { room: string; peer: PeerInfo }[], peerIds: string[], nodeId: string): Promise<void> {
    if (items.length === 0 && peerIds.length === 0) return;
    const p = this.redis.pipeline();
    const exp = Date.now() + this.ttlMs;
    for (const id of peerIds) p.set(this.connKey(id), nodeId, 'PX', this.ttlMs);
    for (const { room, peer } of items) {
      // XX: 이미 있는 member 만 점수 갱신 (이미 사라진 멤버를 되살리지 않는다)
      p.zadd(this.roomKey(room), 'XX', exp, JSON.stringify(peer));
    }
    await p.exec();
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}
