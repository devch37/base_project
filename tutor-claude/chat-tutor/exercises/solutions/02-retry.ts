/** 연습 02 해답 */
export interface RetryOptions {
  attempts: number;
  isRetryable: (err: unknown) => boolean;
  delayMs: (attempt: number) => number;
  sleep?: (ms: number) => Promise<void>;
}

export async function retry<T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions): Promise<T> {
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let last: unknown;
  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn(attempt); // await 가 없으면 실패가 catch 로 안 들어온다!
    } catch (e) {
      last = e;
      if (!opts.isRetryable(e) || attempt === opts.attempts) throw e;
      await sleep(opts.delayMs(attempt));
    }
  }
  throw last;
}
