/**
 * [연습 E1 해답] RedisTicketStore — 다중 서버에서도 ticket 을 "한 번만" 쓰게 하기
 *
 * MemoryTicketStore 는 서버 한 대의 메모리에만 기록한다. 서버가 2대면 같은 ticket 을
 * 서버 A 에서 한 번, 서버 B 에서 한 번 쓸 수 있다 → 1회용 보장이 깨진다.
 *
 * Redis 의 `SET key value NX PX ttl` 은 "없을 때만 쓰기 + 만료"를 **원자적으로** 수행한다.
 *   - 성공(OK)  → 처음 소비한 것
 *   - null      → 이미 누가 소비했다
 * (SETNX 후 EXPIRE 를 따로 호출하면 그 사이 크래시 시 키가 영원히 남는다 → 반드시 한 명령으로)
 */
import { Redis } from 'ioredis';
import type { TicketStore } from '@tutor/ws-kit';

export class RedisTicketStore implements TicketStore {
  private readonly redis: Redis;

  constructor(url: string, private readonly prefix = 'ticket') {
    this.redis = new Redis(url, { maxRetriesPerRequest: null });
  }

  async consume(jti: string, ttlMs: number): Promise<boolean> {
    const res = await this.redis.set(`${this.prefix}:${jti}`, '1', 'PX', ttlMs, 'NX');
    return res === 'OK';
  }

  close(): Promise<'OK'> {
    return this.redis.quit();
  }
}
