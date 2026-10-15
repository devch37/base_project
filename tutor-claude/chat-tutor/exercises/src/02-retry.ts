/**
 * 연습 02 (06장) — 서버 간 호출 재시도
 *
 * retry(fn, opts): fn 을 최대 opts.attempts 번 시도한다.
 *  - 성공하면 그 값을 돌려준다
 *  - 실패한 오류가 opts.isRetryable(err) 이 false 면 즉시 그 오류를 던진다 (예: 4xx)
 *  - 재시도 전에는 opts.delayMs(시도번호: 1부터) 만큼 기다린다 (opts.sleep 을 써서 — 테스트가 시간을 조작한다)
 *  - 모두 실패하면 마지막 오류를 던진다
 */
export interface RetryOptions {
  attempts: number;
  isRetryable: (err: unknown) => boolean;
  delayMs: (attempt: number) => number;
  sleep?: (ms: number) => Promise<void>;
}

export async function retry<T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions): Promise<T> {
  throw new Error('TODO: retry');
}
