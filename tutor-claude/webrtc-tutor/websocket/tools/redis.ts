/**
 * redis.ts — 데모/테스트용 Redis 확보 도우미
 *
 *  1) 환경변수 REDIS_URL 이 있으면 그것을 사용 (예: docker compose 로 띄운 Redis)
 *  2) 없으면 로컬에 설치된 `redis-server` 를 임시 포트로 띄운다
 *  3) 둘 다 없으면 설치 방법을 안내하고 종료
 *
 * 설치:  macOS `brew install redis` / Ubuntu `sudo apt install redis-server` / Docker `docker run -p 6379:6379 redis:7`
 */
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { Redis } from 'ioredis';

export interface RedisHandle {
  url: string;
  spawned: boolean;
  stop(): Promise<void>;
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

async function waitReady(url: string, timeoutMs = 5000): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const r = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null });
    r.on('error', () => {});
    try {
      await r.connect();
      await r.ping();
      await r.quit();
      return;
    } catch {
      r.disconnect();
      await new Promise((res) => setTimeout(res, 50));
    }
  }
  throw new Error(`Redis 가 ${timeoutMs}ms 안에 준비되지 않았습니다: ${url}`);
}

export async function ensureRedis(): Promise<RedisHandle> {
  if (process.env.REDIS_URL) {
    await waitReady(process.env.REDIS_URL);
    return { url: process.env.REDIS_URL, spawned: false, stop: async () => {} };
  }
  if (spawnSync('redis-server', ['--version']).status !== 0) {
    throw new Error('Redis 가 필요합니다.\n  - macOS: brew install redis\n  - Ubuntu: sudo apt install redis-server\n  - Docker: docker run -p 6379:6379 redis:7  후  REDIS_URL=redis://localhost:6379 로 실행');
  }
  const port = await freePort();
  const proc: ChildProcess = spawn('redis-server', ['--port', String(port), '--save', '', '--appendonly', 'no', '--bind', '127.0.0.1'], { stdio: 'ignore' });
  const url = `redis://127.0.0.1:${port}`;
  await waitReady(url);
  return {
    url,
    spawned: true,
    stop: async () => {
      proc.kill('SIGTERM');
      await once(proc, 'exit').catch(() => {});
    },
  };
}
