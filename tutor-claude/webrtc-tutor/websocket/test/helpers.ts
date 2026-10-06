/**
 * 테스트 공용 헬퍼
 *  - TestClient: ws 클라이언트를 감싸 "조건에 맞는 다음 메시지를 기다리기" 를 쉽게 해 준다
 *  - startRedis: 로컬에 redis-server 가 있으면 임시 인스턴스를 띄운다 (없으면 null → 관련 테스트는 skip)
 */
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import WebSocket from 'ws';
import type { Envelope } from '../src/protocol';

export class TestClient {
  readonly ws: WebSocket;
  readonly inbox: Envelope[] = [];
  private waiters: { pred: (e: Envelope) => boolean; resolve: (e: Envelope) => void; timer: NodeJS.Timeout }[] = [];
  closeInfo?: { code: number; reason: string };
  peerId = '';

  constructor(url: string, opts: WebSocket.ClientOptions = {}) {
    this.ws = new WebSocket(url, opts);
    this.ws.on('message', (data) => {
      const env = JSON.parse(data.toString()) as Envelope;
      if (env.type === 'welcome') this.peerId = (env.payload as { peerId: string }).peerId;
      const w = this.waiters.findIndex((x) => x.pred(env));
      if (w >= 0) {
        const [waiter] = this.waiters.splice(w, 1);
        clearTimeout(waiter!.timer);
        waiter!.resolve(env);
      } else {
        this.inbox.push(env);
      }
    });
    this.ws.on('close', (code, reason) => {
      this.closeInfo = { code, reason: reason.toString() };
    });
    this.ws.on('error', () => {});
  }

  /** 조건에 맞는 메시지를 기다린다. 이미 inbox 에 있으면 즉시 반환 */
  next(pred: (e: Envelope) => boolean = () => true, timeoutMs = 2000): Promise<Envelope> {
    const i = this.inbox.findIndex(pred);
    if (i >= 0) return Promise.resolve(this.inbox.splice(i, 1)[0]!);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout waiting for message')), timeoutMs);
      this.waiters.push({ pred, resolve, timer });
    });
  }

  nextType(type: string, timeoutMs?: number): Promise<Envelope> {
    return this.next((e) => e.type === type, timeoutMs);
  }

  send(type: string, payload?: unknown, extra: Partial<Envelope> = {}): void {
    this.ws.send(JSON.stringify({ v: 1, type, ...(payload !== undefined ? { payload } : {}), ...extra }));
  }

  /** 요청을 보내고 replyTo 로 응답을 받는다 (성공/에러 모두 반환) */
  async request(type: string, payload?: unknown): Promise<Envelope> {
    const id = Math.random().toString(36).slice(2);
    this.send(type, payload, { id });
    return this.next((e) => e.replyTo === id);
  }

  async opened(): Promise<this> {
    await this.nextType('welcome');
    return this;
  }

  async closed(): Promise<{ code: number; reason: string }> {
    if (this.closeInfo) return this.closeInfo;
    await once(this.ws, 'close');
    return this.closeInfo!;
  }

  close(): void {
    this.ws.close();
  }
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 짧은 시간 안에 조건이 참이 될 때까지 폴링 */
export async function waitFor(cond: () => boolean | Promise<boolean>, timeoutMs = 2000, stepMs = 10): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (await cond()) return;
    await sleep(stepMs);
  }
  throw new Error('waitFor timeout');
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as { port: number }).port;
      s.close(() => resolve(p));
    });
    s.on('error', reject);
  });
}

export interface RedisHandle {
  url: string;
  stop(): Promise<void>;
}

/** redis-server 바이너리가 있으면 임시 포트로 띄운다. 없으면 null */
export async function startRedis(): Promise<RedisHandle | null> {
  if (spawnSync('redis-server', ['--version']).status !== 0) return null;
  const port = await freePort();
  const proc: ChildProcess = spawn('redis-server', ['--port', String(port), '--save', '', '--appendonly', 'no', '--bind', '127.0.0.1'], { stdio: 'ignore' });
  // 포트가 열릴 때까지 대기
  const end = Date.now() + 5000;
  while (Date.now() < end) {
    const ok = await new Promise<boolean>((resolve) => {
      const s = createServer();
      s.once('error', () => resolve(true)); // 포트 사용 중 = redis 가 떴다
      s.listen(port, '127.0.0.1', () => s.close(() => resolve(false)));
    });
    if (ok) break;
    await sleep(50);
  }
  return {
    url: `redis://127.0.0.1:${port}`,
    stop: async () => {
      proc.kill('SIGTERM');
      await once(proc, 'exit').catch(() => {});
    },
  };
}
