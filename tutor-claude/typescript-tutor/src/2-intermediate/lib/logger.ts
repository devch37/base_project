/**
 * lib/logger.ts — 기본 export(default export) 예시 모듈
 * ----------------------------------------------------------------------------
 * 모듈당 default 는 최대 1개. import 하는 쪽에서 이름을 자유롭게 붙일 수 있습니다.
 * (그래서 팀에 따라 default export 를 금지하기도 합니다 — 일관성 문제)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  constructor(private context: string) {}

  private write(level: LogLevel, message: string): void {
    console.log(`[${level.toUpperCase()}] (${this.context}) ${message}`);
  }

  debug(msg: string) { this.write('debug', msg); }
  info(msg: string) { this.write('info', msg); }
  warn(msg: string) { this.write('warn', msg); }
  error(msg: string) { this.write('error', msg); }
}

// default export
export default Logger;
