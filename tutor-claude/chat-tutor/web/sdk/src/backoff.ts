/**
 * 재연결 대기 시간 계산: 지수 백오프 + full jitter (09장).
 *
 * 왜 지수? 서버가 아픈데 1초마다 두드리면 회복을 방해한다. 실패할수록 더 오래 기다린다.
 * 왜 jitter(무작위)? 서버가 재시작하면 수천 명이 "동시에" 끊긴다. 모두 같은 간격으로 재시도하면
 *   1초 뒤, 2초 뒤, 4초 뒤에 수천 명이 한꺼번에 몰린다(thundering herd). 무작위로 흩뜨려야 한다.
 *
 * full jitter: delay = random(0, min(max, base × 2^attempt))
 */
export interface BackoffOptions {
  baseMs: number;
  maxMs: number;
}

export const DEFAULT_BACKOFF: BackoffOptions = { baseMs: 500, maxMs: 15_000 };

export function backoffDelay(attempt: number, opts: BackoffOptions = DEFAULT_BACKOFF, random: () => number = Math.random): number {
  const ceiling = Math.min(opts.maxMs, opts.baseMs * 2 ** Math.max(0, attempt));
  return Math.floor(random() * ceiling);
}
