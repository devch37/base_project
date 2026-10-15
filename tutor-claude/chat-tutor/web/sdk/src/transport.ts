/**
 * STOMP 연결 관리: 인증 헤더, heartbeat, 재연결(백오프+jitter), 재구독, 서버 여러 대 돌아가며 붙기 (09·12·24장).
 *
 * @stomp/stompjs 에도 자동 재연결이 있지만 직접 관리하는 이유:
 *  - 끊긴 "이유"(close code)에 따라 다르게 행동해야 한다 (cobrowse-server SessionRegistry 와 짝)
 *      4001 토큰 만료        → 새 토큰을 받아 즉시 재연결
 *      4401 인증 실패        → 새 토큰을 받아 백오프 후 재연결
 *      4003 강제 퇴장 / 1008 권한 위반 → 재연결하지 않는다 (다시 붙어도 또 거부된다. 서버만 괴롭힐 뿐)
 *      그 외(1006 네트워크 단절, 1001 서버 종료) → 백오프 후 재연결
 *  - 실패할 때마다 다음 서버 주소로 넘어가야 한다 (서버 A 가 죽었으면 B 로)
 *  - 재연결 후 "구독을 다시" 해야 한다 (구독은 연결에 묶여 있어서 연결과 함께 사라진다)
 */
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { DEFAULT_BACKOFF, backoffDelay, type BackoffOptions } from './backoff.ts';
import { dest } from './protocol.ts';

export type ConnState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'stopped';
export type TokenReason = 'initial' | 'reconnect' | 'expired';

export interface TransportOptions {
  /** ws://host/ws 주소들. 여러 개면 실패할 때마다 다음 주소로 */
  urls: string[];
  getToken: (reason: TokenReason) => Promise<string>;
  heartbeatMs?: number;
  backoff?: BackoffOptions;
  /** 토큰 만료 전에 연결을 유지한 채 갱신 (0 이면 끔) */
  tokenRefreshMs?: number;
  onState?: (state: ConnState, detail?: string) => void;
  /** 연결(재연결 포함) 직후. 고객 SDK 는 여기서 스냅샷을 다시 보낸다. */
  onConnected?: (info: { url: string; reconnect: boolean }) => void;
  onServerError?: (message: string) => void;
}

interface Sub {
  destination: string;
  handler: (body: string, msg: IMessage) => void;
  active?: StompSubscription;
}

export class StompTransport {
  private client: Client | null = null;
  private readonly subs = new Map<number, Sub>();
  private nextSubKey = 1;
  private attempt = 0;
  private urlIndex = 0;
  private stopped = false;
  private everConnected = false;
  private lastServerError = '';
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  state: ConnState = 'idle';
  currentUrl = '';

  constructor(private readonly opts: TransportOptions) {
    if (opts.urls.length === 0) throw new Error('urls 가 비어 있습니다');
  }

  start(): void {
    this.stopped = false;
    void this.connect('initial');
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    const c = this.client;
    this.client = null;
    this.setState('stopped');
    await c?.deactivate();
  }

  get connected(): boolean {
    return this.client?.connected ?? false;
  }

  /** 구독 등록. 연결이 끊겼다 붙어도 자동으로 다시 구독된다. 반환값을 부르면 구독 해제. */
  subscribe(destination: string, handler: (body: string, msg: IMessage) => void): () => void {
    const key = this.nextSubKey++;
    const sub: Sub = { destination, handler };
    this.subs.set(key, sub);
    if (this.connected) this.activate(sub);
    return () => {
      sub.active?.unsubscribe();
      this.subs.delete(key);
    };
  }

  /** 연결돼 있지 않으면 false (보내지 않음). 큐에 쌓아 두지 않는 이유는 customer.ts 주석 참고. */
  publish(destination: string, body: string): boolean {
    if (!this.client?.connected) return false;
    this.client.publish({ destination, body, headers: { 'content-type': 'application/json' } });
    return true;
  }

  // ── 내부 ────────────────────────────────────────────────────────

  private async connect(reason: TokenReason): Promise<void> {
    if (this.stopped) return;
    this.setState(this.everConnected ? 'reconnecting' : 'connecting');
    const url = this.opts.urls[this.urlIndex % this.opts.urls.length]!;

    let token: string;
    try {
      token = await this.opts.getToken(reason);
    } catch (e) {
      this.scheduleRetry(`토큰 발급 실패: ${(e as Error).message}`, 'reconnect');
      return;
    }
    if (this.stopped) return;

    const hb = this.opts.heartbeatMs ?? 10_000;
    const client = new Client({
      webSocketFactory: () => new WebSocket(url),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0, // stompjs 자동 재연결 끔 — 우리가 한다
      heartbeatIncoming: hb,
      heartbeatOutgoing: hb,
      debug: () => {},
    });
    this.client = client;
    this.currentUrl = url;
    this.lastServerError = '';

    client.onConnect = () => {
      if (this.client !== client) return;
      this.attempt = 0;
      this.setState('connected', url);
      this.subs.forEach((s) => this.activate(s)); // 재구독
      this.startTokenRefresh();
      this.opts.onConnected?.({ url, reconnect: this.everConnected });
      this.everConnected = true;
    };
    client.onStompError = (frame) => {
      // 서버가 ERROR 프레임을 보냄 → 곧 연결이 닫힌다 (12장)
      this.lastServerError = frame.headers['message'] ?? 'ERROR';
      this.opts.onServerError?.(this.lastServerError);
    };
    client.onWebSocketClose = (evt: CloseEvent) => {
      if (this.client !== client) return; // 이미 버린 클라이언트의 늦은 이벤트
      this.client = null;
      this.subs.forEach((s) => (s.active = undefined));
      if (this.refreshTimer) clearInterval(this.refreshTimer);
      this.onClosed(evt.code, evt.reason);
    };
    client.activate();
  }

  private onClosed(code: number, reason: string): void {
    if (this.stopped) return;
    if (code === 4003 || code === 1008) {
      this.stopped = true;
      this.setState('stopped', code === 4003 ? '강제 퇴장/권한 해제 (4003)' : '권한 없는 요청으로 차단 (1008)');
      return;
    }
    const detail = `code=${code} ${reason || this.lastServerError}`.trim();
    if (code === 4001) return this.scheduleRetry(detail, 'expired', true);
    if (code === 4401) return this.scheduleRetry(detail, 'expired');
    this.scheduleRetry(detail, 'reconnect');
  }

  private scheduleRetry(detail: string, reason: TokenReason, immediate = false): void {
    if (this.stopped) return;
    this.urlIndex++; // 다음 서버로
    const delay = immediate ? 0 : backoffDelay(this.attempt++, this.opts.backoff ?? DEFAULT_BACKOFF);
    this.setState('reconnecting', `${detail} → ${delay}ms 후 재시도`);
    this.retryTimer = setTimeout(() => void this.connect(reason), delay);
  }

  private activate(sub: Sub): void {
    sub.active = this.client!.subscribe(sub.destination, (msg) => sub.handler(msg.body, msg));
  }

  private startTokenRefresh(): void {
    const every = this.opts.tokenRefreshMs ?? 0;
    if (every <= 0) return;
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(async () => {
      try {
        const token = await this.opts.getToken('reconnect');
        this.publish(dest.tokenRefresh, JSON.stringify({ token }));
      } catch {
        /* 다음 주기에 다시 */
      }
    }, every);
  }

  private setState(state: ConnState, detail?: string): void {
    this.state = state;
    this.opts.onState?.(state, detail);
  }
}
