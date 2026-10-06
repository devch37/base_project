/**
 * backpressure.ts — "느린 수신자"로부터 서버를 지키는 도구 모음
 *
 * ── 배경 ───────────────────────────────────────────────────────────────────────
 *  `ws.send(data)` 는 데이터를 소켓에 "맡기고 즉시 리턴"한다. 상대가 빨리 못 읽으면 데이터는
 *  커널 송신 버퍼 → (가득 차면) Node 프로세스 메모리의 큐에 쌓인다. 이 큐의 크기가 `ws.bufferedAmount`.
 *
 *     생산자(우리 코드) ──▶ [ ws 큐 ──▶ 커널 송신 버퍼 ] ──▶ 네트워크 ──▶ 느린 클라이언트
 *                              ▲ 여기가 부풀어 오른다 (= 서버 힙/RSS 증가 → 결국 OOM)
 *
 *  백프레셔(backpressure)란 "소비자가 느리면 생산자도 속도를 늦추거나 포기하는" 신호 전달이다.
 *  WebSocket 에는 내장 흐름 제어가 없으므로 우리가 직접 만든다.
 *
 * ── 전략 4가지 (메시지의 성격에 맞게 고른다) ─────────────────────────────────────
 *   1) 보내기 전에 bufferedAmount 확인 → 한계 초과 시 버리기/끊기      (guardedSend)
 *   2) 전송 완료 콜백을 기다리며 보내기 (스트리밍/파일처럼 "전부 보내야" 할 때)  (streamWithBackpressure)
 *   3) 최신 값만 남기기(conflation) (좌표·시세처럼 "마지막 값만 의미 있을" 때)   (ConflatingSender)
 *   4) 아예 구독을 해제/하향(downgrade) — 예: 갱신 주기를 낮춘 요약 스트림으로 전환
 */
import type { WebSocket } from 'ws';

export interface Limits {
  /** 넘으면 lossy 메시지는 버린다 */
  softBytes: number;
  /** 넘으면 연결을 끊는다 (서버 보호가 우선) */
  hardBytes: number;
}

export type SendOutcome = 'sent' | 'dropped' | 'closed' | 'slow-consumer';

/** 전략 1: 한계선 기반 전송 */
export function guardedSend(ws: WebSocket, data: string | Buffer, limits: Limits, opts: { lossy?: boolean } = {}): SendOutcome {
  if (ws.readyState !== ws.OPEN) return 'closed';
  const buffered = ws.bufferedAmount;
  if (buffered > limits.hardBytes) {
    ws.close(4009, 'slow consumer'); // 우리가 감당 못 한다 → 정중히 끊고, 클라이언트는 재연결/재동기화
    return 'slow-consumer';
  }
  if (opts.lossy && buffered > limits.softBytes) return 'dropped'; // 버려도 되는 메시지는 건너뛴다
  ws.send(data, () => {}); // 콜백을 주면 전송 에러가 uncaught 로 번지지 않는다
  return 'sent';
}

/** ws.send 를 Promise 로: 데이터가 소켓에 "써졌을 때" resolve (느린 소비자면 늦게 resolve → 자연스러운 백프레셔) */
export function sendAsync(ws: WebSocket, data: string | Buffer): Promise<void> {
  return new Promise((resolve, reject) => ws.send(data, (err) => (err ? reject(err) : resolve())));
}

/**
 * 전략 2: 모든 청크를 보내야 하는 스트림 (파일, 대용량 스냅샷).
 * 큐가 highWater 를 넘으면 낮아질 때까지 기다렸다가 보낸다 → 서버 메모리가 highWater 근처에서 유지된다.
 * 반환값: 스트리밍 중 관측한 최대 bufferedAmount (데모에서 "정말 제한되는지" 확인하는 용도)
 */
export async function streamWithBackpressure(ws: WebSocket, chunks: Iterable<Buffer>, highWater = 256 * 1024): Promise<number> {
  let maxBuffered = 0;
  for (const chunk of chunks) {
    // 큐가 차 있으면 기다린다. (ws 에는 'drain' 이벤트가 없어 짧게 폴링하거나, 콜백 기반으로 대기)
    while (ws.bufferedAmount > highWater) {
      if (ws.readyState !== ws.OPEN) throw new Error('연결이 닫혔습니다');
      await new Promise((r) => setTimeout(r, 2));
    }
    maxBuffered = Math.max(maxBuffered, ws.bufferedAmount);
    ws.send(chunk, () => {});
  }
  return maxBuffered;
}

/**
 * 전략 3: Conflation(병합) — 키별로 "최신 값만" 보낸다.
 *
 * 마우스 커서 위치가 초당 1000번 바뀌는데 클라이언트가 느려 100개밖에 못 받는다면,
 * 중간의 900개는 아무 의미가 없다. 어차피 마지막 위치만 중요하니까.
 *   set(key, value) 가 불릴 때마다 "대기 중인 값"만 덮어쓰고,
 *   소켓이 한가해질 때(bufferedAmount 낮음) 대기 중인 최신 값들만 한꺼번에 보낸다.
 * 거래소 시세, 게임 상태, 협업 커서, 센서 스트림에 널리 쓰이는 패턴.
 */
export class ConflatingSender {
  private readonly latest = new Map<string, unknown>();
  private timer?: NodeJS.Timeout;
  sentMessages = 0;
  conflated = 0;

  constructor(
    private readonly ws: WebSocket,
    private readonly opts: { flushIntervalMs?: number; sendWhenBufferedBelow?: number } = {},
  ) {
    this.timer = setInterval(() => this.flush(), opts.flushIntervalMs ?? 10);
  }

  set(key: string, value: unknown): void {
    if (this.latest.has(key)) this.conflated++; // 아직 안 나간 이전 값을 덮어씀 = 하나 절약
    this.latest.set(key, value);
  }

  private flush(): void {
    if (this.ws.readyState !== this.ws.OPEN) return;
    if (this.latest.size === 0) return;
    if (this.ws.bufferedAmount > (this.opts.sendWhenBufferedBelow ?? 16 * 1024)) return; // 아직 이전 것도 못 보냈다 → 더 쌓지 않고 기다림
    const batch = Object.fromEntries(this.latest);
    this.latest.clear();
    this.ws.send(JSON.stringify({ type: 'state', batch }), () => {});
    this.sentMessages++;
  }

  stop(): void {
    clearInterval(this.timer);
  }
}
