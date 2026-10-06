/**
 * server.ts — 1~8장에서 배운 것을 조립한 "실무형 WebSocket 서버"
 *
 *  ┌ HTTP 서버 ──────────────────────────────────────────────────────────────┐
 *  │  GET /healthz /readyz /metrics        (운영 필수 엔드포인트)               │
 *  │  Upgrade: websocket                                                     │
 *  │     1. 경로 확인  2. 종료 중인지  3. 최대 연결 수  4. Origin 검사(CSWSH)     │
 *  │     5. 인증(authenticate)  ── 여기까지 통과해야 101 Switching Protocols ──  │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *       ▼
 *  Connection (연결당 1개)  ── 하트비트 / 속도 제한 / 송신 백프레셔
 *       ▼
 *  메시지 → 파싱·검증(zod) → 핸들러 라우팅(type) → Hub(방/presence) → Bus(다른 노드)
 *
 * ★ "noServer 모드"를 쓰는 이유
 *   `new WebSocketServer({ port })` 는 편하지만 업그레이드 요청을 가로채서 검사할 방법이 제한적입니다.
 *   `noServer: true` 로 만들고 HTTP 서버의 'upgrade' 이벤트를 직접 받으면
 *   "인증/Origin 검사에 실패한 요청에 101 대신 401/403 을 돌려주는" 제어가 가능합니다.
 *   (연결을 일단 맺고 나서 끊는 방식보다 훨씬 저렴하고 안전합니다)
 */
import { randomUUID } from 'node:crypto';
import { type IncomingMessage, type Server as HttpServer, createServer } from 'node:http';
import type { Duplex } from 'node:stream';
import { type RawData, WebSocketServer, type WebSocket } from 'ws';
import { z } from 'zod';
import { AuthError, CloseCode, WsError } from './errors';
import { Hub } from './hub';
import { type Logger, silentLogger } from './logger';
import { Metrics } from './metrics';
import { type Bus, MemoryBusNetwork } from './bus';
import { Connection, type AuthUser, type SendLimits } from './connection';
import { MemoryPresence, type Presence } from './presence';
import { isOriginAllowed } from './auth';
import { type Envelope, PROTOCOL_VERSION, makeEnvelope, parseEnvelope } from './protocol';

export interface WsServerOptions {
  /** 이미 만든 HTTP 서버에 붙이려면 전달. 없으면 직접 만들고 `port` 로 listen */
  server?: HttpServer;
  port?: number;
  host?: string;
  /** 업그레이드를 받을 경로 (기본 /ws) */
  path?: string;

  // ── 보안 ──
  allowedOrigins?: readonly string[] | '*';
  /** Origin 헤더가 없는 비브라우저 클라이언트 허용 여부 */
  allowNoOrigin?: boolean;
  /** 업그레이드 시점 인증. AuthError 를 던지면 401/403 으로 거절 */
  authenticate?: (req: IncomingMessage, url: URL) => Promise<AuthUser> | AuthUser;
  authTimeoutMs?: number;
  /** 메시지 한 건의 최대 크기(bytes). 초과 시 ws 가 1009 로 연결을 닫는다 */
  maxPayload?: number;
  maxConnections?: number;

  // ── 안정성 ──
  heartbeat?: { intervalMs: number } | false;
  rateLimit?: { capacity: number; refillPerSec: number } | false;
  /** 연속 N회 속도 제한 위반 시 연결 종료 */
  maxRateViolations?: number;
  sendLimits?: SendLimits;

  // ── 분산 ──
  bus?: Bus;
  presence?: Presence;
  nodeId?: string;
  presenceRefreshMs?: number;

  builtinHandlers?: boolean;
  logger?: Logger;
}

export interface Context {
  conn: Connection;
  msg: Envelope;
  server: WsServer;
  hub: Hub;
  /** 요청(msg.id)에 대한 성공 응답 */
  reply(payload?: unknown): void;
  /** 요청에 대한 에러 응답 */
  fail(code: string, message: string): void;
}
export type Handler = (ctx: Context) => void | Promise<void>;

/** 핸들러에서 payload 를 zod 로 검증. 실패하면 클라이언트에 `bad_payload` 에러로 전달된다 */
export function parsePayload<S extends z.ZodTypeAny>(schema: S, payload: unknown): z.infer<S> {
  const r = schema.safeParse(payload);
  if (!r.success) {
    const i = r.error.issues[0];
    throw new WsError('bad_payload', `payload.${i?.path.join('.') ?? ''} ${i?.message ?? 'invalid'}`);
  }
  return r.data;
}

const joinSchema = z.object({ room: z.string().min(1).max(128), meta: z.record(z.unknown()).optional() });
const roomSchema = z.object({ room: z.string().min(1).max(128) });
const messageSchema = z.object({ room: z.string().min(1).max(128), data: z.unknown(), echo: z.boolean().optional() });
const directSchema = z.object({ room: z.string().min(1).max(128), to: z.string().min(1).max(128), data: z.unknown() });

function reject(socket: Duplex, status: number, text: string, headers: Record<string, string> = {}): void {
  const extra = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}\r\n`)
    .join('');
  // 아직 WebSocket 이 아니라 평범한 HTTP 요청이므로 HTTP 응답을 직접 써 주고 소켓을 닫는다
  socket.write(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n${extra}\r\n`);
  socket.destroy();
}

function rawToString(data: RawData): string {
  if (Buffer.isBuffer(data)) return data.toString('utf8');
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  return Buffer.from(data).toString('utf8');
}

export class WsServer {
  readonly nodeId: string;
  readonly metrics = new Metrics();
  readonly hub: Hub;
  readonly bus: Bus;
  readonly presence: Presence;

  private readonly log: Logger;
  private readonly http: HttpServer;
  private readonly ownsHttp: boolean;
  private readonly wss: WebSocketServer;
  private readonly handlers = new Map<string, Handler>();
  private readonly path: string;
  private readonly sendLimits: SendLimits;
  private readonly rate: { capacity: number; refillPerSec: number } | null;
  private hbTimer?: NodeJS.Timeout;
  private presenceTimer?: NodeJS.Timeout;
  private draining = false;
  private crashed = false;
  private started = false;

  constructor(private readonly opts: WsServerOptions = {}) {
    this.nodeId = opts.nodeId ?? `node-${randomUUID().slice(0, 8)}`;
    this.log = opts.logger ?? silentLogger;
    this.path = opts.path ?? '/ws';
    this.bus = opts.bus ?? new MemoryBusNetwork().connect();
    this.presence = opts.presence ?? new MemoryPresence();
    this.sendLimits = opts.sendLimits ?? { softLimitBytes: 1024 * 1024, hardLimitBytes: 4 * 1024 * 1024 };
    this.rate = opts.rateLimit === false ? null : (opts.rateLimit ?? { capacity: 50, refillPerSec: 25 });

    this.hub = new Hub({ nodeId: this.nodeId, bus: this.bus, presence: this.presence, log: this.log, metrics: this.metrics });

    // permessage-deflate(압축)는 기본 OFF. 연결마다 zlib 컨텍스트(수십~수백 KB)를 잡아먹고 CPU 도 쓴다.
    // 작은 JSON 메시지가 대부분이면 압축 이득보다 비용이 크다. (1장 README 참고)
    this.wss = new WebSocketServer({ noServer: true, maxPayload: opts.maxPayload ?? 64 * 1024, perMessageDeflate: false });

    if (opts.server) {
      this.http = opts.server;
      this.ownsHttp = false;
    } else {
      this.ownsHttp = true;
      this.http = createServer((req, res) => this.onHttp(req, res));
    }

    if (opts.builtinHandlers !== false) this.registerBuiltins();
  }

  /** 메시지 타입별 핸들러 등록 */
  on(type: string, handler: Handler): this {
    this.handlers.set(type, handler);
    return this;
  }

  async start(): Promise<number> {
    if (this.started) throw new Error('already started');
    this.started = true;
    await this.hub.start();

    this.http.on('upgrade', (req, socket, head) => {
      void this.handleUpgrade(req, socket, head);
    });

    if (this.opts.heartbeat !== false) {
      const interval = this.opts.heartbeat?.intervalMs ?? 30_000;
      this.hbTimer = setInterval(() => this.heartbeatTick(), interval);
      this.hbTimer.unref();
    }

    const refresh = this.opts.presenceRefreshMs ?? 10_000;
    this.presenceTimer = setInterval(() => {
      const { items, peerIds } = this.hub.snapshot();
      this.presence.refresh(items, peerIds, this.nodeId).catch((e: Error) => this.log.error('presence refresh 실패', { err: e.message }));
    }, refresh);
    this.presenceTimer.unref();

    if (this.ownsHttp) {
      await new Promise<void>((resolve) => this.http.listen(this.opts.port ?? 0, this.opts.host, resolve));
    }
    const addr = this.http.address();
    const port = typeof addr === 'object' && addr ? addr.port : (this.opts.port ?? 0);
    this.log.info('ws server started', { nodeId: this.nodeId, port, path: this.path });
    return port;
  }

  get port(): number {
    const a = this.http.address();
    return typeof a === 'object' && a ? a.port : 0;
  }

  get connectionCount(): number {
    return this.hub.connectionCount;
  }

  get isDraining(): boolean {
    return this.draining;
  }

  // ── HTTP (운영 엔드포인트) ────────────────────────────────────────────────────
  private onHttp(req: IncomingMessage, res: import('node:http').ServerResponse): void {
    const url = req.url ?? '/';
    if (url === '/healthz') {
      // liveness: 프로세스가 살아 있나. 종료 중이어도 200 (재시작은 쿠버네티스가 판단)
      res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
    } else if (url === '/readyz') {
      // readiness: 새 연결을 받아도 되나. 종료(drain) 중이면 503 → LB 가 트래픽을 빼 준다
      res.writeHead(this.draining ? 503 : 200, { 'content-type': 'text/plain' }).end(this.draining ? 'draining' : 'ready');
    } else if (url === '/metrics') {
      res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4' }).end(this.metrics.render('ws'));
    } else {
      res.writeHead(404).end();
    }
  }

  // ── 업그레이드(핸드셰이크) ───────────────────────────────────────────────────
  private async handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
    // 인증이 비동기로 진행되는 동안 클라이언트가 끊으면 'error' 가 발생한다. 처리기가 없으면 프로세스가 죽는다!
    socket.on('error', () => {});

    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== this.path) return reject(socket, 404, 'Not Found');
    if (this.draining) return reject(socket, 503, 'Service Unavailable', { 'Retry-After': '5' });
    if (this.hub.connectionCount >= (this.opts.maxConnections ?? Number.POSITIVE_INFINITY)) {
      return reject(socket, 503, 'Too Many Connections', { 'Retry-After': '5' }); // 로드 셰딩: 받을 수 없으면 빨리 거절
    }
    if (!isOriginAllowed(req.headers.origin, this.opts.allowedOrigins ?? '*', this.opts.allowNoOrigin ?? true)) {
      this.metrics.authFailures++;
      this.log.warn('Origin 거절', { origin: req.headers.origin });
      return reject(socket, 403, 'Forbidden');
    }

    let user: AuthUser;
    try {
      user = await this.withTimeout(
        Promise.resolve(this.opts.authenticate ? this.opts.authenticate(req, url) : { userId: `guest-${randomUUID().slice(0, 6)}` }),
        this.opts.authTimeoutMs ?? 5000,
      );
    } catch (e) {
      this.metrics.authFailures++;
      if (e instanceof AuthError) {
        this.log.warn('인증 거절', { code: e.code });
        return reject(socket, e.httpStatus, e.httpStatus === 403 ? 'Forbidden' : 'Unauthorized');
      }
      this.log.error('인증 중 예외', { err: (e as Error).message });
      return reject(socket, 500, 'Internal Server Error');
    }

    if (socket.destroyed) return; // 인증하는 사이 클라이언트가 포기함
    this.wss.handleUpgrade(req, socket, head, (ws) => {
      void this.onConnection(ws, user);
    });
  }

  private withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new AuthError('auth_timeout', '인증 시간 초과', 401)), ms);
      p.then(
        (v) => (clearTimeout(t), resolve(v)),
        (e) => (clearTimeout(t), reject(e)),
      );
    });
  }

  // ── 연결 수명주기 ───────────────────────────────────────────────────────────
  private async onConnection(ws: WebSocket, user: AuthUser): Promise<void> {
    const conn = new Connection(randomUUID(), ws, user, this.sendLimits, this.metrics, this.rate);
    this.metrics.connections++;
    this.metrics.totalConnections++;

    ws.on('pong', () => {
      conn.isAlive = true;
    });
    ws.on('message', (data, isBinary) => {
      // 같은 연결의 메시지는 "도착한 순서대로" 하나씩 처리한다 (비동기 핸들러끼리 뒤섞이는 것 방지)
      conn.queue = conn.queue.then(() => this.onMessage(conn, data, isBinary)).catch((e: Error) => this.log.error('onMessage 실패', { err: e.message }));
    });
    ws.on('close', (code) => {
      this.metrics.connections--;
      this.log.debug('연결 종료', { peerId: conn.id, code });
      if (this.crashed) return; // 크래시 시뮬레이션: 정리 코드를 실행하지 못하고 죽은 프로세스처럼 행동
      this.hub.detach(conn).catch((e: Error) => this.log.error('detach 실패', { err: e.message }));
    });
    ws.on('error', (e) => this.log.warn('socket error', { peerId: conn.id, err: e.message }));

    await this.hub.attach(conn);
    conn.send(
      makeEnvelope('welcome', {
        peerId: conn.id,
        userId: user.userId,
        nodeId: this.nodeId,
        serverTime: Date.now(),
        heartbeatIntervalMs: this.opts.heartbeat === false ? 0 : (this.opts.heartbeat?.intervalMs ?? 30_000),
      }),
    );
  }

  private async onMessage(conn: Connection, data: RawData, isBinary: boolean): Promise<void> {
    this.metrics.messagesIn++;
    conn.isAlive = true; // 데이터가 오고 있다 = 살아 있다

    if (isBinary) {
      this.metrics.badMessages++;
      conn.send(this.errorEnv(undefined, 'error', 'binary_not_allowed', '바이너리 메시지는 지원하지 않습니다'));
      return;
    }

    if (conn.bucket) {
      if (!conn.bucket.tryTake()) {
        this.metrics.rateLimited++;
        conn.rateViolations++;
        if (conn.rateViolations > (this.opts.maxRateViolations ?? 20)) {
          conn.close(CloseCode.RATE_LIMITED, 'rate limited');
        } else {
          conn.send(this.errorEnv(undefined, 'error', 'rate_limited', '요청이 너무 많습니다'));
        }
        return;
      }
      conn.rateViolations = 0;
    }

    const parsed = parseEnvelope(rawToString(data));
    if (!parsed.ok) {
      this.metrics.badMessages++;
      conn.send(this.errorEnv(undefined, 'error', parsed.code, parsed.message));
      return;
    }

    // 클라이언트가 보낸 from/seq/ts 는 신뢰하지 않고 서버가 덮어쓴다 (사칭 방지)
    const { seq: _ignored, ...rest } = parsed.env;
    const msg: Envelope = { ...rest, from: conn.id, ts: Date.now() };

    const handler = this.handlers.get(msg.type);
    if (!handler) {
      conn.send(this.errorEnv(msg.id, msg.type, 'unknown_type', `알 수 없는 메시지 타입: ${msg.type}`));
      return;
    }

    const ctx: Context = {
      conn,
      msg,
      server: this,
      hub: this.hub,
      reply: (payload) => {
        // 요청자가 id 를 붙였을 때(= 응답을 기다릴 때)만 응답한다. id 없는 메시지는 fire-and-forget.
        // (에러 응답 fail() 은 id 가 없어도 보낸다 — 실패는 알려 줘야 하므로)
        if (!msg.id) return;
        conn.send({ v: PROTOCOL_VERSION, type: msg.type, replyTo: msg.id, ...(payload !== undefined ? { payload } : {}) });
      },
      fail: (code, message) => {
        conn.send(this.errorEnv(msg.id, msg.type, code, message));
      },
    };

    try {
      await handler(ctx);
    } catch (e) {
      if (e instanceof WsError) {
        ctx.fail(e.code, e.message);
      } else {
        // 예상 못 한 에러: 내부 메시지를 클라이언트에 노출하지 않는다(정보 유출 방지). 로그에만 남긴다.
        this.log.error('핸들러 예외', { type: msg.type, err: (e as Error).stack });
        ctx.fail('internal', '서버 내부 오류');
      }
    }
  }

  private errorEnv(replyTo: string | undefined, type: string, code: string, message: string): Envelope {
    return { v: PROTOCOL_VERSION, type, ...(replyTo ? { replyTo } : {}), error: { code, message } };
  }

  // ── 하트비트 ────────────────────────────────────────────────────────────────
  private heartbeatTick(): void {
    for (const conn of this.hub.allConnections()) {
      if (!conn.isAlive) {
        // 지난 주기에 보낸 ping 에 pong 이 없었다 → 반쯤 끊긴 연결(half-open). 정리한다.
        this.metrics.heartbeatTimeouts++;
        this.log.warn('heartbeat timeout', { peerId: conn.id });
        conn.ws.terminate(); // close 핸드셰이크를 기다리지 않고 소켓을 즉시 파괴
        continue;
      }
      conn.isAlive = false;
      conn.ws.ping();
    }
  }

  // ── 기본 핸들러 ─────────────────────────────────────────────────────────────
  private registerBuiltins(): void {
    // 앱 레벨 ping: 브라우저의 JS 는 프로토콜 ping 프레임을 직접 보낼 수 없어서 필요하다
    this.on('ping', (ctx) => {
      ctx.conn.send({ v: PROTOCOL_VERSION, type: 'pong', ...(ctx.msg.id ? { replyTo: ctx.msg.id } : {}), payload: ctx.msg.payload });
    });

    this.on('room.join', async (ctx) => {
      const { room, meta } = parsePayload(joinSchema, ctx.msg.payload);
      const members = await ctx.hub.join(ctx.conn, room, meta);
      ctx.reply({ room, you: ctx.conn.id, members });
    });

    this.on('room.leave', async (ctx) => {
      const { room } = parsePayload(roomSchema, ctx.msg.payload);
      await ctx.hub.leave(ctx.conn, room);
      ctx.reply({ room });
    });

    this.on('room.message', async (ctx) => {
      const { room, data, echo } = parsePayload(messageSchema, ctx.msg.payload);
      if (!ctx.conn.rooms.has(room)) throw new WsError('not_in_room', '먼저 방에 입장해야 합니다');
      await ctx.hub.broadcast(
        room,
        { v: PROTOCOL_VERSION, type: 'room.message', room, from: ctx.conn.id, ts: ctx.msg.ts, payload: { data } },
        echo ? {} : { except: ctx.conn.id },
      );
      ctx.reply({ ok: true });
    });

    // 방 안의 특정 peer 에게 1:1 전달 — WebRTC 시그널링이 이것을 쓴다 (offer/answer/candidate)
    this.on('room.direct', async (ctx) => {
      const { room, to, data } = parsePayload(directSchema, ctx.msg.payload);
      if (!ctx.conn.rooms.has(room)) throw new WsError('not_in_room', '먼저 방에 입장해야 합니다');
      const where = await ctx.hub.sendToPeer(to, { v: PROTOCOL_VERSION, type: 'room.direct', room, from: ctx.conn.id, ts: ctx.msg.ts, payload: { data } });
      if (where === 'unknown') throw new WsError('peer_not_found', '상대가 접속 중이 아닙니다');
      ctx.reply({ delivered: where });
    });
  }

  // ── 종료 ────────────────────────────────────────────────────────────────────
  /**
   * 장애 시뮬레이션용: `kill -9` 처럼 정리 코드(presence 해제, bus 구독 해제) 없이 즉시 죽는다.
   * 공유 저장소(Redis)에 "유령 접속자"가 남고, TTL 이 지나야 사라지는 것을 관찰하기 위한 것이다.
   */
  simulateCrash(): void {
    this.crashed = true;
    if (this.hbTimer) clearInterval(this.hbTimer);
    if (this.presenceTimer) clearInterval(this.presenceTimer);
    for (const c of [...this.hub.allConnections()]) c.ws.terminate();
    this.wss.close();
    if (this.ownsHttp) {
      this.http.close();
      this.http.closeAllConnections?.();
    }
  }

  /**
   * 우아한 종료 (Graceful shutdown)
   *  1) 새 연결 거절 시작(/readyz 가 503) → LB 가 이 노드를 풀에서 뺀다
   *  2) 기존 연결에 "곧 재시작합니다" 알림 + close(1012)
   *  3) 클라이언트가 스스로 나가길 graceMs 동안 기다림
   *  4) 남은 연결은 강제 종료
   *
   * 클라이언트들이 동시에 재연결하면 새 서버에 폭주(thundering herd)가 생기므로
   * 알림에 `reconnectAfterMs`(랜덤 지터)를 실어 보내 분산시킨다.
   */
  async close(opts: { graceMs?: number; reconnectJitterMs?: number; closeBus?: boolean } = {}): Promise<void> {
    const graceMs = opts.graceMs ?? 5000;
    const jitter = opts.reconnectJitterMs ?? 3000;
    this.draining = true;
    if (this.hbTimer) clearInterval(this.hbTimer);
    if (this.presenceTimer) clearInterval(this.presenceTimer);

    for (const conn of [...this.hub.allConnections()]) {
      conn.send(makeEnvelope('server.shutdown', { reconnectAfterMs: Math.floor(Math.random() * jitter) }));
      conn.close(CloseCode.SERVICE_RESTART, 'service restart');
    }

    const deadline = Date.now() + graceMs;
    while (this.hub.connectionCount > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 25));
    }
    for (const conn of [...this.hub.allConnections()]) conn.ws.terminate(); // 시간 초과: 강제

    await this.hub.stop();
    this.wss.close();
    if (this.ownsHttp) {
      await new Promise<void>((resolve) => {
        this.http.close(() => resolve());
        this.http.closeAllConnections?.();
      });
    }
    if (opts.closeBus !== false) {
      await this.bus.close();
      await this.presence.close();
    }
  }
}
