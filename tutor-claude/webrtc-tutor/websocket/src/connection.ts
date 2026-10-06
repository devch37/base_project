/**
 * connection.ts — `ws` 의 WebSocket 을 감싼 "연결 객체"
 *
 * 날것의 WebSocket 에는 "누구의 연결인지", "방에 들어 있는지", "살아 있는지",
 * "너무 많이 보내는지", "수신이 느려서 쌓이고 있지 않은지" 같은 서버가 필요한 상태가 없습니다.
 * Connection 은 그 상태를 한곳에 모아 둡니다.
 *
 * ── 송신 백프레셔(Backpressure)가 핵심 ─────────────────────────────────────────
 *  ws.send() 는 **즉시 리턴**합니다. 상대(클라이언트)가 느리면 데이터는 서버 메모리의
 *  송신 버퍼(ws.bufferedAmount)에 쌓입니다.
 *
 *     서버 ──(빠르게 send)──▶ [송신 버퍼가 계속 커짐 …] ──(느린 네트워크)──▶ 클라이언트
 *
 *  "느린 클라이언트 1명" × "초당 수천 메시지" → 서버 메모리가 부풀다 OOM 으로 전체가 죽습니다.
 *  방어: 두 개의 한계선
 *    soft limit : 넘으면 "버려도 되는(lossy)" 메시지를 버린다 (예: 마우스 커서 위치, 통계)
 *    hard limit : 넘으면 이 연결을 끊는다 (SLOW_CONSUMER). 서버 전체를 지키는 게 우선.
 */
import type { WebSocket } from 'ws';
import { CloseCode } from './errors';
import type { Metrics } from './metrics';
import { type Envelope, encode } from './protocol';
import type { PeerInfo } from './presence';
import { TokenBucket } from './ratelimit';

export interface AuthUser {
  userId: string;
  claims?: Record<string, unknown>;
}

export type SendResult = 'sent' | 'dropped' | 'closed' | 'slow-consumer';

export interface SendLimits {
  /** 이 값을 넘으면 lossy 메시지를 버린다 (bytes) */
  softLimitBytes: number;
  /** 이 값을 넘으면 연결을 끊는다 (bytes) */
  hardLimitBytes: number;
}

export class Connection {
  /** 연결 단위 고유 ID. 클라이언트에도 알려 주며 "peerId" 로 쓰인다 */
  readonly id: string;
  readonly connectedAt = Date.now();
  /** 이 연결이 들어가 있는 방들: room → 내 PeerInfo */
  readonly rooms = new Map<string, PeerInfo>();

  /** 하트비트용. pong 이나 어떤 메시지든 받으면 true 로 되돌린다 */
  isAlive = true;
  readonly bucket: TokenBucket | null;
  rateViolations = 0;

  /** 이 연결의 메시지를 "순서대로" 처리하기 위한 직렬 큐 */
  queue: Promise<void> = Promise.resolve();

  constructor(
    id: string,
    readonly ws: WebSocket,
    readonly user: AuthUser,
    private readonly limits: SendLimits,
    private readonly metrics: Metrics,
    rate: { capacity: number; refillPerSec: number } | null,
  ) {
    this.id = id;
    this.bucket = rate ? new TokenBucket(rate.capacity, rate.refillPerSec) : null;
  }

  get isOpen(): boolean {
    return this.ws.readyState === this.ws.OPEN;
  }

  /** 현재 송신 버퍼에 쌓인 바이트 */
  get buffered(): number {
    return this.ws.bufferedAmount;
  }

  send(env: Envelope, opts: { lossy?: boolean } = {}): SendResult {
    return this.sendRaw(encode(env), opts);
  }

  /**
   * 이미 직렬화된 문자열을 전송.
   * 방 전체에 브로드캐스트할 때 JSON.stringify 를 "한 번만" 하고 N명에게 같은 문자열을 보내려고 분리했다.
   */
  sendRaw(json: string, opts: { lossy?: boolean } = {}): SendResult {
    if (!this.isOpen) return 'closed';

    const buffered = this.ws.bufferedAmount;
    if (buffered > this.limits.hardLimitBytes) {
      this.metrics.slowConsumers++;
      this.close(CloseCode.SLOW_CONSUMER, 'slow consumer');
      return 'slow-consumer';
    }
    if (opts.lossy && buffered > this.limits.softLimitBytes) {
      this.metrics.dropped++;
      return 'dropped';
    }

    this.metrics.messagesOut++;
    // 콜백을 주면 전송 오류가 uncaught 로 번지지 않는다 (연결이 막 닫힌 경우 등)
    this.ws.send(json, () => {});
    return 'sent';
  }

  /**
   * 정상적인 close 핸드셰이크로 닫는다.
   * 상대가 응답하지 않아도(느리거나 죽은 연결) 영원히 기다리지 않도록 `forceAfterMs` 뒤엔 terminate 한다.
   * (close 프레임도 송신 버퍼 뒤에 줄을 서므로, 버퍼가 가득 찬 느린 소비자는 close 프레임조차 못 받는다)
   */
  close(code: number = CloseCode.NORMAL, reason = '', forceAfterMs = 2000): void {
    // reason 은 최대 123 bytes (제어 프레임 제한). 길면 ws 가 throw 한다 → 안전하게 자른다
    const safe = Buffer.from(reason).subarray(0, 120).toString('utf8');
    if (this.ws.readyState === this.ws.OPEN || this.ws.readyState === this.ws.CONNECTING) {
      this.ws.close(code, safe);
      setTimeout(() => {
        if (this.ws.readyState !== this.ws.CLOSED) this.ws.terminate();
      }, forceAfterMs).unref();
    }
  }
}
