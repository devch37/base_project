/**
 * bus.ts — 서버(노드) 간 메시지 버스
 *
 * ── 왜 필요한가? (분산 환경의 핵심 문제) ───────────────────────────────────────
 *  WebSocket 연결은 "특정 서버 프로세스 한 개"의 메모리 안에 존재합니다.
 *
 *     [Alice] ──ws──▶ [서버 A]          [서버 B] ◀──ws── [Bob]
 *
 *  Alice 가 방 "lobby" 에 메시지를 보내도, 서버 A 는 Bob 의 소켓을 갖고 있지 않으므로
 *  전달할 수 없습니다. 해결: 서버들이 **공용 메시지 버스**를 통해 서로에게 알려 준다.
 *
 *     Alice ─▶ 서버 A ──publish("room:lobby")──▶ [Redis] ──▶ 서버 B ──▶ Bob
 *
 *  Bus 는 그 "공용 버스"를 추상화한 인터페이스입니다.
 *   - InMemoryBus : 한 프로세스 안에서 여러 "가상 노드"를 시뮬레이션 (테스트/학습용)
 *   - RedisBus    : Redis Pub/Sub 사용 (실무)
 *
 * ── Redis Pub/Sub 의 성격 (반드시 알아 둘 것) ─────────────────────────────────
 *  - fire-and-forget: 구독자가 없거나 순간 끊겨 있으면 메시지는 사라진다 (at-most-once)
 *  - 저장하지 않는다 → 재전송/재생이 필요하면 Redis Streams / Kafka 등을 써야 한다 (7·8장 참고)
 *  - 채널 수가 많아도 비교적 가볍다 → "방마다 채널" 전략이 흔하다
 */
import { Redis } from 'ioredis';
import type { Logger } from './logger';
import { silentLogger } from './logger';

export type BusHandler = (data: unknown) => void;

export interface Bus {
  readonly kind: 'memory' | 'redis';
  publish(channel: string, data: unknown): Promise<void>;
  /** 같은 (channel, handler) 를 중복 구독해도 한 번만 등록된다 */
  subscribe(channel: string, handler: BusHandler): Promise<void>;
  unsubscribe(channel: string, handler: BusHandler): Promise<void>;
  close(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// InMemoryBus — 한 프로세스 안의 "가짜 네트워크"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 여러 노드가 같은 네트워크(=Redis 역할)를 공유하도록 만드는 객체.
 *   const net = new MemoryBusNetwork();
 *   const busA = net.connect();  // 노드 A 가 쓸 Bus
 *   const busB = net.connect();  // 노드 B 가 쓸 Bus
 */
export class MemoryBusNetwork {
  private readonly subs = new Map<string, Set<BusHandler>>();

  connect(): Bus {
    return new InMemoryBus(this.subs);
  }
}

class InMemoryBus implements Bus {
  readonly kind = 'memory' as const;
  private readonly mine = new Set<{ channel: string; handler: BusHandler }>();
  private closed = false;

  constructor(private readonly subs: Map<string, Set<BusHandler>>) {}

  async publish(channel: string, data: unknown): Promise<void> {
    if (this.closed) return;
    // 실제 네트워크처럼 "비동기"로 전달한다. (동기 호출이면 재진입 버그가 테스트에서 가려진다)
    // 또 Redis 처럼 JSON 직렬화를 거쳐 객체 참조 공유로 인한 착시를 막는다.
    const wire = JSON.stringify(data);
    const handlers = this.subs.get(channel);
    if (!handlers) return;
    for (const h of [...handlers]) {
      queueMicrotask(() => h(JSON.parse(wire)));
    }
  }

  async subscribe(channel: string, handler: BusHandler): Promise<void> {
    let set = this.subs.get(channel);
    if (!set) this.subs.set(channel, (set = new Set()));
    set.add(handler);
    this.mine.add({ channel, handler });
  }

  async unsubscribe(channel: string, handler: BusHandler): Promise<void> {
    const set = this.subs.get(channel);
    set?.delete(handler);
    if (set && set.size === 0) this.subs.delete(channel);
    for (const m of this.mine) if (m.channel === channel && m.handler === handler) this.mine.delete(m);
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const m of [...this.mine]) await this.unsubscribe(m.channel, m.handler);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RedisBus — 실무용
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redis Pub/Sub 기반 버스.
 *
 * ★ Redis 클라이언트를 **2개** 쓰는 이유
 *   한 번 SUBSCRIBE 를 호출한 연결은 "구독 전용 모드"가 되어 PUBLISH/GET 같은 일반 명령을 못 씁니다.
 *   그래서 발행용(pub) 연결과 구독용(sub) 연결을 분리해야 합니다.
 */
export interface RedisBusOptions {
  log?: Logger;
  /**
   * Sharded Pub/Sub (Redis 7+: SPUBLISH / SSUBSCRIBE).
   * 일반 Pub/Sub 은 Redis Cluster 에서 메시지가 **모든 노드로 브로드캐스트**되어 클러스터를 키워도 처리량이 늘지 않는다.
   * Sharded 방식은 채널을 해시 슬롯에 매핑해 **해당 슬롯 담당 노드에서만** 전달하므로 클러스터 규모에 따라 확장된다.
   */
  sharded?: boolean;
}

export class RedisBus implements Bus {
  readonly kind = 'redis' as const;
  private readonly pub: Redis;
  private readonly sub: Redis;
  private readonly handlers = new Map<string, Set<BusHandler>>();
  private readonly log: Logger;
  private readonly sharded: boolean;

  constructor(url: string, opts: RedisBusOptions | Logger = {}) {
    // (하위 호환) 두 번째 인자로 Logger 를 직접 넘기는 형태도 허용
    const o: RedisBusOptions = 'info' in opts ? { log: opts as Logger } : (opts as RedisBusOptions);
    this.log = o.log ?? silentLogger;
    this.sharded = o.sharded ?? false;
    this.pub = new Redis(url, { maxRetriesPerRequest: null });
    this.sub = new Redis(url, { maxRetriesPerRequest: null });
    this.pub.on('error', (e: Error) => this.log.error('redis pub error', { err: e.message }));
    this.sub.on('error', (e: Error) => this.log.error('redis sub error', { err: e.message }));

    this.sub.on(this.sharded ? 'smessage' : 'message', (channel: string, raw: string) => {
      const set = this.handlers.get(channel);
      if (!set) return;
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        this.log.warn('bus: JSON 파싱 실패', { channel });
        return;
      }
      for (const h of [...set]) {
        try {
          h(data);
        } catch (e) {
          // 한 구독자의 예외가 다른 구독자 전달을 막으면 안 된다
          this.log.error('bus handler 예외', { channel, err: (e as Error).message });
        }
      }
    });
  }

  async publish(channel: string, data: unknown): Promise<void> {
    const wire = JSON.stringify(data);
    if (this.sharded) await this.pub.spublish(channel, wire);
    else await this.pub.publish(channel, wire);
  }

  async subscribe(channel: string, handler: BusHandler): Promise<void> {
    let set = this.handlers.get(channel);
    if (!set) {
      this.handlers.set(channel, (set = new Set()));
      if (this.sharded) await this.sub.ssubscribe(channel);
      else await this.sub.subscribe(channel); // 이 채널의 "첫 구독자"일 때만 Redis 에 SUBSCRIBE
    }
    set.add(handler);
  }

  async unsubscribe(channel: string, handler: BusHandler): Promise<void> {
    const set = this.handlers.get(channel);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      this.handlers.delete(channel);
      if (this.sharded) await this.sub.sunsubscribe(channel);
      else await this.sub.unsubscribe(channel); // 마지막 구독자가 나가면 Redis 구독도 해제 → 불필요한 트래픽 제거
    }
  }

  async close(): Promise<void> {
    this.handlers.clear();
    await Promise.allSettled([this.pub.quit(), this.sub.quit()]);
  }
}
