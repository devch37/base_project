/**
 * logger.ts — 아주 작은 로거 인터페이스
 *
 * 라이브러리 코드는 특정 로깅 라이브러리(pino, winston)에 묶이지 않도록
 * "이 모양이면 된다"는 인터페이스만 정의하고, 실제 구현은 주입받습니다 (의존성 주입).
 * 테스트에서는 `silentLogger` 를 넣어 출력을 끕니다.
 */
export interface Logger {
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
}

export const silentLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

/** 개발용: 사람이 읽기 좋은 한 줄 로그 */
export function consoleLogger(prefix = 'ws', level: 'debug' | 'info' | 'warn' | 'error' = 'info'): Logger {
  const order = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const emit = (lv: keyof typeof order, msg: string, meta?: Record<string, unknown>) => {
    if (order[lv] < order[level]) return;
    const m = meta && Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    // 실무에서는 JSON 한 줄 로그(구조화 로그)를 stdout으로 내보내 로그 수집기가 파싱하게 한다.
    console.log(`[${prefix}] ${lv.toUpperCase().padEnd(5)} ${msg}${m}`);
  };
  return {
    debug: (m, x) => emit('debug', m, x),
    info: (m, x) => emit('info', m, x),
    warn: (m, x) => emit('warn', m, x),
    error: (m, x) => emit('error', m, x),
  };
}
