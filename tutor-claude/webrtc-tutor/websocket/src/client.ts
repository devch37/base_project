/**
 * client.ts — 재연결 가능한 WebSocket 클라이언트 (브라우저 + Node 겸용)
 *
 * 브라우저의 `new WebSocket(url)` 은 "연결 한 번"만 책임집니다. 실무 클라이언트는 훨씬 많은 일을 합니다.
 *
 *   ✔ 끊기면 자동 재연결 (지수 백오프 + Full Jitter)          → 4장
 *   ✔ 서버가 close code 로 "재연결 말라"고 하면 멈춤           → errors.ts
 *   ✔ 앱 레벨 ping/pong 으로 "조용히 죽은 연결(half-open)" 감지 → 4장
 *   ✔ request()/응답 짝짓기 + 타임아웃                         → 2장
 *   ✔ 오프라인 동안 보낸 메시지를 (제한된 크기로) 큐잉          → 위험 주의! 아래 참고
 *   ✔ 재연결 후 방 자동 재입장                                  → 서버 상태는 연결과 함께 사라지므로
 *   ✔ 재연결할 때마다 새 ticket 을 받아 URL 을 만드는 훅         → 5장
 *
 * 의존성이 없는 순수 TS 라서 esbuild 로 번들해 브라우저에서 그대로 쓰고,
 * Node 에서는 `WebSocket` 옵션에 `ws` 의 클래스를 넘겨 쓸 수 있습니다.
 */
import { isRetryableClose } from './errors';
import type { Envelope } from './protocol';

// 브라우저 WebSocket 과 `ws` 라이브러리가 공통으로 만족하는 최소 인터페이스
export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: 'open', l: () => void): void;
  addEventListener(type: 'message', l: (ev: { data: unknown }) => void): void;
  addEventListener(type: 'close', l: (ev: { code: number; reason: string }) => void): void;
  addEventListener(type: 'error', l: (ev: unknown) => void): void;
}
export interface WebSocketCtor {
  new (url: string): WebSocketLike;
}

export type ClientState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface ClientOptions {
  /** 문자열, 또는 "연결할 때마다 호출되는 함수". 함수라면 매번 새 ticket 을 받아 붙일 수 있다 */
  url: string | (() => string | Promise<string>);
  WebSocket?: WebSocketCtor;
  reconnect?: boolean;
  backoff?: { baseMs?: number; maxMs?: number; factor?: number };
  /** 앱 레벨 ping 간격(ms). 0 이면 끔 */
  pingIntervalMs?: number;
  /** ping 후 pong 이 이 시간 안에 안 오면 연결이 죽은 것으로 판단 */
  pingTimeoutMs?: number;
  requestTimeoutMs?: number;
  /** 오프라인 중 큐에 쌓을 최대 메시지 수 (0 이면 큐잉 안 함) */
  maxOfflineQueue?: number;
  autoRejoin?: boolean;
  isRetryable?: (code: number) => boolean;
}

interface Events {
  open: { peerId: string; nodeId?: string; reconnected: boolean };
  close: { code: number; reason: string; willReconnect: boolean };
  reconnecting: { attempt: number; delayMs: number };
  message: Envelope;
  error: unknown;
  state: ClientState;
  shutdown: { reconnectAfterMs: number };
}

type Listener<T> = (data: T) => void;

interface Pending {
  resolve: (e: Envelope) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class RequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

export class WsClient {
  state: ClientState = 'idle';
  peerId = '';
  nodeId = '';

  private ws: WebSocketLike | null = null;
  /** 세대 번호: 낡은(교체된) 소켓에서 늦게 도착하는 이벤트를 무시하기 위한 장치 */
  private gen = 0;
  private attempt = 0;
  private wantOpen = false;
  private everOpened = false;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private pingTimer?: ReturnType<typeof setInterval>;
  private pongTimer?: ReturnType<typeof setTimeout>;
  private shutdownHintMs = 0;
  private idCounter = 0;
  private readonly pending = new Map<string, Pending>();
  private readonly queue: string[] = [];
  private readonly joined = new Map<string, Record<string, unknown> | undefined>();
  private readonly listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};
  private firstOpen?: { resolve: () => void; reject: (e: Error) => void };

  private readonly o: Required<Omit<ClientOptions, 'WebSocket' | 'backoff'>> & { backoff: Required<NonNullable<ClientOptions['backoff']>>; WebSocket?: WebSocketCtor };

  constructor(opts: ClientOptions) {
    this.o = {
      reconnect: true,
      pingIntervalMs: 15_000,
      pingTimeoutMs: 5_000,
      requestTimeoutMs: 10_000,
      maxOfflineQueue: 100,
      autoRejoin: true,
      isRetryable: isRetryableClose,
      ...opts,
      backoff: { baseMs: 500, maxMs: 30_000, factor: 2, ...opts.backoff },
    };
  }

  // ── 이벤트 ─────────────────────────────────────────────────────────────────
  on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    let set = this.listeners[event] as Set<Listener<Events[K]>> | undefined;
    if (!set) this.listeners[event] = set = new Set() as never;
    set.add(fn);
    return () => set?.delete(fn);
  }

  private emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const set = this.listeners[event] as Set<Listener<Events[K]>> | undefined;
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn(data);
      } catch (e) {
        console.error(`[ws-client] '${event}' 리스너 예외`, e);
      }
    }
  }

  private setState(s: ClientState): void {
    if (this.state === s) return;
    this.state = s;
    this.emit('state', s);
  }

  // ── 연결 ───────────────────────────────────────────────────────────────────
  /** 첫 연결이 성공(welcome 수신)하면 resolve. 이후 재연결은 내부에서 자동으로 */
  connect(): Promise<void> {
    this.wantOpen = true;
    return new Promise<void>((resolve, reject) => {
      this.firstOpen = { resolve, reject };
      void this.openSocket();
    });
  }

  private async openSocket(): Promise<void> {
    if (!this.wantOpen) return;
    const myGen = ++this.gen;
    this.setState(this.attempt === 0 && !this.everOpened ? 'connecting' : 'reconnecting');

    let url: string;
    try {
      url = typeof this.o.url === 'function' ? await this.o.url() : this.o.url;
    } catch (e) {
      // ticket 발급 실패 등 — 다음 시도로 넘긴다
      this.emit('error', e);
      if (myGen === this.gen) this.scheduleReconnect(0);
      return;
    }
    if (myGen !== this.gen || !this.wantOpen) return;

    const Ctor = this.o.WebSocket ?? (globalThis as unknown as { WebSocket: WebSocketCtor }).WebSocket;
    const ws = new Ctor(url);
    this.ws = ws;

    ws.addEventListener('message', (ev) => {
      if (myGen !== this.gen) return;
      this.onRaw(typeof ev.data === 'string' ? ev.data : String(ev.data), ws);
    });
    ws.addEventListener('error', (ev) => {
      if (myGen !== this.gen) return;
      this.emit('error', ev); // 에러 직후에는 반드시 close 이벤트가 따라온다. 재연결은 close 에서 처리
    });
    ws.addEventListener('close', (ev) => {
      if (myGen !== this.gen) return;
      this.onClosed(ev.code, ev.reason);
    });
  }

  private onRaw(raw: string, ws: WebSocketLike): void {
    let env: Envelope;
    try {
      env = JSON.parse(raw) as Envelope;
    } catch {
      return;
    }

    if (env.type === 'welcome' && !env.replyTo) {
      const p = env.payload as { peerId: string; nodeId?: string };
      this.peerId = p.peerId;
      this.nodeId = p.nodeId ?? '';
      const reconnected = this.everOpened;
      this.everOpened = true;
      this.attempt = 0; // ★ 백오프 카운터는 "서버가 진짜로 받아 준 뒤"에만 초기화한다. open 이벤트에서 하면 인증 실패 루프에서 백오프가 무력화된다
      this.setState('open');
      this.startPing();
      this.flushQueue(ws);
      this.emit('open', { peerId: this.peerId, nodeId: this.nodeId, reconnected });
      this.firstOpen?.resolve();
      this.firstOpen = undefined;
      if (reconnected && this.o.autoRejoin) void this.rejoinAll();
      return;
    }
    if (env.type === 'pong') {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
    if (env.type === 'server.shutdown') {
      const hint = (env.payload as { reconnectAfterMs?: number } | undefined)?.reconnectAfterMs ?? 0;
      this.shutdownHintMs = hint;
      this.emit('shutdown', { reconnectAfterMs: hint });
    }

    if (env.replyTo && this.pending.has(env.replyTo)) {
      const p = this.pending.get(env.replyTo)!;
      this.pending.delete(env.replyTo);
      clearTimeout(p.timer);
      if (env.error) p.reject(new RequestError(env.error.code, env.error.message));
      else p.resolve(env);
      return;
    }
    this.emit('message', env);
  }

  private onClosed(code: number, reason: string): void {
    this.stopPing();
    this.ws = null;
    this.rejectAllPending(new RequestError('connection_lost', `연결이 끊겼습니다 (${code})`));

    const willReconnect = this.wantOpen && this.o.reconnect && this.o.isRetryable(code);
    this.emit('close', { code, reason, willReconnect });

    if (willReconnect) {
      this.scheduleReconnect(code);
    } else {
      this.setState('closed');
      this.firstOpen?.reject(new Error(`연결 실패 (close ${code} ${reason})`));
      this.firstOpen = undefined;
    }
  }

  /**
   * 지수 백오프 + Full Jitter
   *   상한 = min(maxMs, baseMs * factor^attempt)
   *   대기 = random(0, 상한)
   * 왜 랜덤인가? 서버가 재시작되면 수만 클라이언트가 "같은 순간" 끊깁니다.
   * 백오프만 있고 지터가 없으면 모두가 0.5s, 1s, 2s 뒤에 "동시에" 몰려와 서버를 다시 쓰러뜨립니다 (thundering herd).
   */
  private scheduleReconnect(_code: number): void {
    const { baseMs, maxMs, factor } = this.o.backoff;
    const cap = Math.min(maxMs, baseMs * factor ** this.attempt);
    let delay = Math.random() * cap;
    delay = Math.max(delay, this.shutdownHintMs); // 서버가 "N ms 뒤에 오라"고 알려 줬다면 존중
    this.shutdownHintMs = 0;
    this.attempt++;
    this.setState('reconnecting');
    this.emit('reconnecting', { attempt: this.attempt, delayMs: Math.round(delay) });
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => void this.openSocket(), delay);
  }

  // ── 앱 레벨 하트비트 ─────────────────────────────────────────────────────────
  private startPing(): void {
    this.stopPing();
    if (!this.o.pingIntervalMs) return;
    this.pingTimer = setInterval(() => {
      if (this.state !== 'open' || !this.ws) return;
      this.rawSend(JSON.stringify({ v: 1, type: 'ping', payload: { t: Date.now() } }));
      clearTimeout(this.pongTimer);
      this.pongTimer = setTimeout(() => this.onPongTimeout(), this.o.pingTimeoutMs);
    }, this.o.pingIntervalMs);
  }

  private stopPing(): void {
    clearInterval(this.pingTimer);
    clearTimeout(this.pongTimer);
    this.pingTimer = this.pongTimer = undefined;
  }

  /**
   * pong 이 안 온다 = 연결이 "조용히 죽었다" (Wi-Fi 전환, NAT 테이블 만료, 모바일 터널 진입 …).
   * TCP 는 이걸 알아채는 데 수 분이 걸리고, close() 도 상대와 핸드셰이크가 필요해서 한참 걸릴 수 있다.
   * 그래서 이 소켓을 "버리고" 즉시 새로 연결한다.
   */
  private onPongTimeout(): void {
    const dead = this.ws;
    this.gen++; // 이 소켓의 이후 이벤트는 모두 무시
    this.ws = null;
    this.stopPing();
    try {
      dead?.close(4010, 'pong timeout');
    } catch {
      /* 이미 죽은 소켓 */
    }
    this.rejectAllPending(new RequestError('connection_lost', 'pong timeout'));
    this.emit('close', { code: 4010, reason: 'pong timeout', willReconnect: this.wantOpen && this.o.reconnect });
    if (this.wantOpen && this.o.reconnect) this.scheduleReconnect(4010);
    else this.setState('closed');
  }

  // ── 송신 ───────────────────────────────────────────────────────────────────
  private rawSend(json: string): boolean {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(json);
      return true;
    }
    return false;
  }

  /**
   * 메시지 전송. 연결이 없으면 큐에 쌓았다가 재연결 후 전송한다.
   * ⚠ 큐잉은 양날의 검: 오래된 메시지(예: "이동 중" 좌표)가 뒤늦게 쏟아지면 오히려 해롭다.
   *   상태성 메시지는 큐잉하지 말고, 재연결 후 "현재 상태"를 다시 동기화하는 편이 낫다.
   */
  send(type: string, payload?: unknown, extra: Partial<Envelope> = {}): 'sent' | 'queued' | 'dropped' {
    const json = JSON.stringify({ v: 1, type, ...(payload !== undefined ? { payload } : {}), ...extra });
    if (this.rawSend(json)) return 'sent';
    if (this.o.maxOfflineQueue > 0 && this.wantOpen) {
      if (this.queue.length >= this.o.maxOfflineQueue) return 'dropped';
      this.queue.push(json);
      return 'queued';
    }
    return 'dropped';
  }

  private flushQueue(ws: WebSocketLike): void {
    while (this.queue.length && ws.readyState === 1) ws.send(this.queue.shift()!);
  }

  /** 요청/응답. 서버가 `replyTo` 로 돌려주는 응답을 기다린다. 에러 응답/타임아웃/연결 끊김은 reject */
  request<T = unknown>(type: string, payload?: unknown, opts: { timeoutMs?: number; extra?: Partial<Envelope> } = {}): Promise<Envelope<T>> {
    const id = `r${++this.idCounter}`;
    return new Promise<Envelope<T>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new RequestError('timeout', `요청 시간 초과: ${type}`));
      }, opts.timeoutMs ?? this.o.requestTimeoutMs);
      this.pending.set(id, { resolve: resolve as (e: Envelope) => void, reject, timer });
      const res = this.send(type, payload, { ...opts.extra, id });
      if (res === 'dropped') {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(new RequestError('not_connected', '연결되어 있지 않습니다'));
      }
    });
  }

  private rejectAllPending(err: Error): void {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(err);
      this.pending.delete(id);
    }
  }

  // ── 방 ─────────────────────────────────────────────────────────────────────
  async joinRoom(room: string, meta?: Record<string, unknown>): Promise<{ room: string; you: string; members: { peerId: string; userId: string; nodeId: string; meta?: Record<string, unknown> }[] }> {
    const res = await this.request<{ room: string; you: string; members: never[] }>('room.join', { room, meta });
    this.joined.set(room, meta);
    return res.payload as never;
  }

  async leaveRoom(room: string): Promise<void> {
    this.joined.delete(room);
    await this.request('room.leave', { room });
  }

  /** 재연결 후 서버는 우리를 기억하지 못한다 → 들어가 있던 방에 다시 입장 */
  private async rejoinAll(): Promise<void> {
    for (const [room, meta] of this.joined) {
      try {
        await this.request('room.join', { room, meta });
      } catch (e) {
        this.emit('error', e);
      }
    }
  }

  // ── 종료 ───────────────────────────────────────────────────────────────────
  close(code = 1000, reason = 'client close'): void {
    this.wantOpen = false;
    this.gen++;
    clearTimeout(this.reconnectTimer);
    this.stopPing();
    this.rejectAllPending(new RequestError('closed', '클라이언트가 연결을 닫았습니다'));
    try {
      this.ws?.close(code, reason);
    } catch {
      /* ignore */
    }
    this.ws = null;
    this.setState('closed');
    this.firstOpen?.reject(new Error('closed before open'));
    this.firstOpen = undefined;
  }
}
