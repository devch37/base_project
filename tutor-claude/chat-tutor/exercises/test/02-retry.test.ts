import { describe, expect, it } from 'vitest';
import { retry } from '@ex/02-retry.ts';

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}
const retryable = (e: unknown) => e instanceof HttpError && e.status >= 500;

describe('연습 02 retry', () => {
  it('두 번 실패 후 성공', async () => {
    const waits: number[] = [];
    const result = await retry(async (n) => {
      if (n < 3) throw new HttpError(503);
      return 'ok';
    }, { attempts: 5, isRetryable: retryable, delayMs: (a) => a * 100, sleep: async (ms) => void waits.push(ms) });
    expect(result).toBe('ok');
    expect(waits).toEqual([100, 200]);
  });
  it('4xx 는 재시도하지 않는다', async () => {
    let calls = 0;
    await expect(retry(async () => {
      calls++;
      throw new HttpError(404);
    }, { attempts: 5, isRetryable: retryable, delayMs: () => 0, sleep: async () => {} })).rejects.toThrow('HTTP 404');
    expect(calls).toBe(1);
  });
  it('끝까지 실패하면 마지막 오류', async () => {
    let calls = 0;
    await expect(retry(async () => {
      calls++;
      throw new HttpError(500 + calls);
    }, { attempts: 3, isRetryable: retryable, delayMs: () => 0, sleep: async () => {} })).rejects.toThrow('HTTP 503');
    expect(calls).toBe(3);
  });
});
