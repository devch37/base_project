/**
 * e2e 테스트용 실행기: 진짜 Spring 서버(jar) + 고객사 백엔드 + Vite 를 띄우고, Playwright 로 브라우저 2개를 조종한다.
 * 개발 중 띄워 둔 서버와 겹치지 않게 모든 포트를 1xxxx 대로 쓴다.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer, type ViteDevServer } from 'vite';

export const ROOT = resolve(import.meta.dirname, '../..');
export const JAR = resolve(ROOT, 'server/cobrowse-server/build/libs/cobrowse-server.jar');

export async function waitFor(check: () => Promise<boolean> | boolean, ms = 30_000, what = '조건'): Promise<void> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      if (await check()) return;
    } catch {
      /* 아직 */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`${what} 대기 시간 초과 (${ms}ms)`);
}

export function startJava(port: number, env: Record<string, string> = {}): ChildProcess {
  if (!existsSync(JAR)) throw new Error(`jar 없음: ${JAR}\n먼저 ./gradlew :server:cobrowse-server:bootJar`);
  const p = spawn('java', ['-jar', JAR], {
    env: { ...process.env, SERVER_PORT: String(port), ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  p.stdout!.on('data', (d: Buffer) => process.env.E2E_VERBOSE && process.stdout.write(`[java:${port}] ${d}`));
  p.stderr!.on('data', (d: Buffer) => process.stderr.write(`[java:${port}] ${d}`));
  return p;
}

export async function waitHttp(url: string, ms = 60_000): Promise<void> {
  await waitFor(async () => (await fetch(url)).ok, ms, url);
}

export function startTenant(port: number, chatServers: string[]): ChildProcess {
  const p = spawn(resolve(ROOT, 'node_modules/.bin/tsx'), [resolve(ROOT, 'web/tenant-backend/server.ts')], {
    env: { ...process.env, TENANT_PORT: String(port), CHAT_SERVERS: chatServers.join(',') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  p.stderr!.on('data', (d: Buffer) => process.stderr.write(`[tenant] ${d}`));
  return p;
}

export async function startVite(port: number, chatServer: string, tenantServer: string): Promise<ViteDevServer> {
  process.env.CHAT_SERVER = chatServer;
  process.env.TENANT_SERVER = tenantServer;
  const server = await createServer({
    configFile: resolve(ROOT, 'web/vite.config.ts'),
    server: { port, strictPort: true },
    // 의존성 자동 탐색을 끄고 미리 지정 → 테스트 종료 시 탐색 작업이 취소되며 나는 잡음 로그 방지
    optimizeDeps: { noDiscovery: true, include: ['@stomp/stompjs'] },
    logLevel: 'error',
  });
  await server.listen();
  return server;
}

export function kill(p: ChildProcess | undefined, signal: NodeJS.Signals = 'SIGTERM'): Promise<void> {
  return new Promise((res) => {
    // 시그널로 죽은 프로세스는 exitCode 가 null 이고 signalCode 만 채워진다 — 둘 다 봐야 "이미 종료"를 안다
    if (!p || p.exitCode !== null || p.signalCode !== null) return res();
    p.once('exit', () => res());
    p.kill(signal);
  });
}
