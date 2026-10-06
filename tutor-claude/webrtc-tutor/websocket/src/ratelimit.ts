/**
 * ratelimit.ts — 토큰 버킷(Token Bucket) 속도 제한
 *
 * 비유: 양동이에 토큰이 들어 있다. 요청 1개 = 토큰 1개 소비.
 *       토큰은 초당 `refillPerSec` 개씩 다시 채워지고, 양동이 크기(capacity)를 넘지 않는다.
 *
 *  - capacity    : 순간 "버스트"를 허용하는 크기.   예) 20 → 한꺼번에 20개까지는 OK
 *  - refillPerSec: 장기 평균 허용 속도.            예) 10 → 평균 초당 10개
 *
 * 왜 "초당 N개 카운터"가 아니라 토큰 버킷인가?
 *  → 고정 윈도우 카운터는 윈도우 경계에서 2배 버스트가 가능하고, 구현도 시간 계산이 번거롭다.
 *    토큰 버킷은 O(1) 메모리(숫자 2개)로 평균 속도 + 버스트를 동시에 표현한다.
 *
 * 시계(now)를 주입 가능하게 만들어 두면 테스트에서 시간을 "조작"할 수 있다.
 */
export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
    now: number = Date.now(),
  ) {
    this.tokens = capacity;
    this.last = now;
  }

  /** 토큰을 n개 소비 시도. 성공하면 true */
  tryTake(n = 1, now: number = Date.now()): boolean {
    this.refill(now);
    if (this.tokens >= n) {
      this.tokens -= n;
      return true;
    }
    return false;
  }

  /** 현재 남은 토큰(소수점 포함). 모니터링/테스트용 */
  available(now: number = Date.now()): number {
    this.refill(now);
    return this.tokens;
  }

  private refill(now: number): void {
    const elapsedSec = Math.max(0, now - this.last) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSec);
    this.last = now;
  }
}
