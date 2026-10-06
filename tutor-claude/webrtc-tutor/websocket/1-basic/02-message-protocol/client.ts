/**
 * client.ts — 요청/응답(RPC) 클라이언트: "WebSocket 위에서 await 쓰기"
 *
 * WebSocket 은 본래 "메시지가 오면 이벤트가 터지는" 비동기 푸시 모델입니다.
 * 그런데 앱 코드는 `const r = await call('math.add', ...)` 처럼 쓰고 싶죠.
 * 그 다리가 **상관관계 ID(correlation id)** 입니다.
 *
 *   call() 호출 → id 를 만들어 요청에 실어 보내고, pending 맵에 { resolve, reject, timer } 저장
 *   응답 도착   → replyTo 로 pending 에서 찾아 resolve/reject
 *   타임아웃    → 응답이 영영 안 올 수 있으므로 반드시 타이머를 두고 pending 에서 제거(메모리 누수 방지)
 *   연결 끊김   → 대기 중인 모든 요청을 reject (영원히 매달리는 Promise 방지)
 */
import WebSocket from 'ws';
import type { Request, Response } from './messages';

export class RpcError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

interface Pending {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: NodeJS.Timeout;
}

export class RpcClient {
  private ws!: WebSocket;
  private seq = 0;
  private readonly pending = new Map<string, Pending>();
  /** 요청과 무관한 서버 푸시 이벤트 구독 */
  onEvent: (e: Extract<Response, { type: `event.${string}` }>) => void = () => {};

  async connect(url: string): Promise<void> {
    this.ws = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      this.ws.once('open', () => resolve());
      this.ws.once('error', reject);
    });

    this.ws.on('message', (data) => {
      const res = JSON.parse(data.toString()) as Response;
      if (res.type === 'result' || (res.type === 'error' && res.replyTo)) {
        const id = res.replyTo!;
        const p = this.pending.get(id);
        if (!p) return; // 이미 타임아웃 처리된 요청의 늦은 응답 → 무시
        this.pending.delete(id);
        clearTimeout(p.timer);
        if (res.type === 'result') p.resolve(res.payload);
        else p.reject(new RpcError(res.error.code, res.error.message));
      } else if (res.type.startsWith('event.')) {
        this.onEvent(res as never);
      }
    });

    this.ws.on('close', () => {
      // 끊기면 대기 중인 요청은 영원히 응답이 안 온다 → 전부 실패 처리
      for (const [id, p] of this.pending) {
        clearTimeout(p.timer);
        p.reject(new RpcError('connection_closed', '연결이 닫혔습니다'));
        this.pending.delete(id);
      }
    });
  }

  /** 타입 안전한 호출: type 에 맞는 payload 만 컴파일 단계에서 허용 */
  call<T extends Request['type']>(type: T, payload: Extract<Request, { type: T }>['payload'], timeoutMs = 2000): Promise<unknown> {
    return this.callUntyped(type, payload, timeoutMs);
  }

  /** 타입 검사를 건너뛰는 호출 — 서버 검증을 일부러 시험할 때만 사용 */
  callUntyped(type: string, payload: unknown, timeoutMs = 2000): Promise<unknown> {
    const id = `c${++this.seq}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new RpcError('timeout', `${type} 응답 시간 초과 (${timeoutMs}ms)`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ v: 1, id, type, payload }));
    });
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  close(): void {
    this.ws.close();
  }
}
