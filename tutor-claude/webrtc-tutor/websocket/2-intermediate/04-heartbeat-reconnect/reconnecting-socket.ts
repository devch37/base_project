/**
 * reconnecting-socket.ts — 재연결 소켓의 원리를 보여 주는 미니 구현 (약 70줄)
 *
 * ★ 재연결의 3원칙
 *   1) 지수 백오프(exponential backoff): 실패할수록 대기 시간을 늘린다 (서버를 보호)
 *   2) 지터(jitter): 대기 시간에 "무작위"를 섞는다 (수만 클라이언트가 같은 순간에 몰리는 것을 방지)
 *   3) 성공의 정의: TCP 연결이 아니라 "서버가 받아 주었다"를 확인한 뒤에야 백오프 카운터를 초기화한다
 *
 * 실무용 완성판은 `@tutor/ws-kit/client` 의 WsClient (앱 ping, 요청/응답, 방 자동 재입장, 오프라인 큐 포함).
 */
import WebSocket from 'ws';

export interface BackoffOptions {
  baseMs: number;
  maxMs: number;
  factor: number;
  /** 'none' | 'full'(0~상한 균등) | 'equal'(상한/2 + 0~상한/2) */
  jitter: 'none' | 'full' | 'equal';
}

/** 시도 횟수(attempt, 0부터)에 대한 대기 시간 */
export function backoffDelay(attempt: number, o: BackoffOptions, rand: () => number = Math.random): number {
  const cap = Math.min(o.maxMs, o.baseMs * o.factor ** attempt);
  switch (o.jitter) {
    case 'none':
      return cap; // 모든 클라이언트가 똑같은 시각에 재시도 → 쓰나미
    case 'full':
      return rand() * cap; // AWS 아키텍처 블로그가 권장하는 방식. 가장 고르게 퍼진다
    case 'equal':
      return cap / 2 + (rand() * cap) / 2; // 최소 대기를 보장하면서 분산
  }
}

export class ReconnectingSocket {
  private ws?: WebSocket;
  private attempt = 0;
  private stopped = false;
  private timer?: NodeJS.Timeout;
  onOpen: () => void = () => {};
  onMessage: (data: string) => void = () => {};
  onRetry: (attempt: number, delayMs: number) => void = () => {};

  constructor(
    private readonly url: string,
    private readonly backoff: BackoffOptions = { baseMs: 200, maxMs: 5000, factor: 2, jitter: 'full' },
  ) {}

  start(): void {
    this.stopped = false;
    this.connect();
  }

  private connect(): void {
    const ws = (this.ws = new WebSocket(this.url));
    ws.on('open', () => {
      this.attempt = 0; // 연결 성공 → 백오프 초기화 (실무판은 welcome 메시지 수신 후에 초기화)
      this.onOpen();
    });
    ws.on('message', (d) => this.onMessage(d.toString()));
    ws.on('error', () => {}); // 에러 뒤에는 반드시 close 가 오므로 재시도는 close 에서 한 곳으로 모은다
    ws.on('close', () => {
      if (this.stopped) return;
      const delay = backoffDelay(this.attempt++, this.backoff);
      this.onRetry(this.attempt, Math.round(delay));
      this.timer = setTimeout(() => this.connect(), delay);
    });
  }

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(data);
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.timer);
    this.ws?.close();
  }
}
