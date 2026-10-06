/**
 * main.ts — 운영용 서버 진입점 (Production entrypoint)
 *
 * 라이브러리(`WsServer`)와 "운영 가능한 프로세스" 사이의 간극을 메우는 파일이다.
 *   ✔ 설정은 환경변수로 (12-factor): 코드 수정/재빌드 없이 환경별로 다르게
 *   ✔ 구조화(JSON) 로그: 로그 수집기(Loki, ELK, CloudWatch)가 파싱하기 쉽게
 *   ✔ SIGTERM/SIGINT → 우아한 종료 (컨테이너 오케스트레이터가 종료할 때 보내는 신호)
 *   ✔ 처리되지 않은 예외/거절 로깅 (조용히 죽거나 조용히 멈추는 것을 방지)
 *   ✔ /healthz /readyz /metrics (LB·쿠버네티스·Prometheus 연동)
 *
 * 실행 예
 *   PORT=8080 NODE_ID=a npx tsx websocket/3-advanced/09-production/main.ts
 *   REDIS_URL=redis://localhost:6379 PORT=8081 NODE_ID=b ...        # 다중 노드
 *
 * 환경변수
 *   PORT(8080) NODE_ID(host-pid) REDIS_URL(없으면 단일 노드)
 *   ALLOWED_ORIGINS(쉼표 구분, 기본 '*' — 운영에서는 반드시 지정!)
 *   TICKET_SECRET(지정 시 ticket 인증 활성화)  MAX_CONNECTIONS(기본 무제한)
 *   HEARTBEAT_MS(30000)  SHUTDOWN_GRACE_MS(10000)  SHUTDOWN_JITTER_MS(5000)
 */
import { hostname } from 'node:os';
import { type Logger, RedisBus, RedisPresence, WsServer, verifyTicket } from '@tutor/ws-kit';

/** 한 줄 JSON 로그. 운영에서는 pino 같은 라이브러리를 쓰지만 원리는 같다. */
function jsonLogger(base: Record<string, unknown>): Logger {
  const emit = (level: string, msg: string, meta?: Record<string, unknown>) => {
    process.stdout.write(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...base, ...meta }) + '\n');
  };
  return {
    debug: (m, x) => process.env.DEBUG && emit('debug', m, x),
    info: (m, x) => emit('info', m, x),
    warn: (m, x) => emit('warn', m, x),
    error: (m, x) => emit('error', m, x),
  };
}

const env = process.env;
const nodeId = env.NODE_ID ?? `${hostname()}-${process.pid}`;
const log = jsonLogger({ node: nodeId });

const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()) : '*';
if (allowedOrigins === '*') log.warn('ALLOWED_ORIGINS 가 설정되지 않았습니다. 운영에서는 반드시 Origin 허용 목록을 지정하세요.');

const redisUrl = env.REDIS_URL;
const server = new WsServer({
  nodeId,
  port: Number(env.PORT ?? 8080),
  logger: log,
  allowedOrigins,
  allowNoOrigin: allowedOrigins === '*',
  maxConnections: env.MAX_CONNECTIONS ? Number(env.MAX_CONNECTIONS) : undefined,
  heartbeat: { intervalMs: Number(env.HEARTBEAT_MS ?? 30_000) },
  ...(redisUrl ? { bus: new RedisBus(redisUrl, { log }), presence: new RedisPresence(redisUrl) } : {}),
  ...(env.TICKET_SECRET
    ? {
        authenticate: (_req, url) => {
          const claims = verifyTicket(url.searchParams.get('ticket'), env.TICKET_SECRET!);
          return { userId: claims.sub };
        },
      }
    : {}),
});

const port = await server.start();
log.info('서버 시작', { port, redis: Boolean(redisUrl), auth: Boolean(env.TICKET_SECRET), pid: process.pid });

// ── 우아한 종료 ───────────────────────────────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info('종료 신호 수신 — drain 시작', { signal, connections: server.connectionCount });
  const started = Date.now();
  await server.close({ graceMs: Number(env.SHUTDOWN_GRACE_MS ?? 10_000), reconnectJitterMs: Number(env.SHUTDOWN_JITTER_MS ?? 5000) });
  log.info('종료 완료', { tookMs: Date.now() - started });
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// ── 안전망 ───────────────────────────────────────────────────────────────────
// 처리되지 않은 예외는 "프로세스 상태를 신뢰할 수 없다"는 뜻이다. 로그를 남기고 종료해 오케스트레이터가 새로 띄우게 하는 것이 정석.
process.on('uncaughtException', (e) => {
  log.error('uncaughtException', { err: e.stack });
  process.exit(1);
});
process.on('unhandledRejection', (e) => {
  log.error('unhandledRejection', { err: e instanceof Error ? e.stack : String(e) });
});
