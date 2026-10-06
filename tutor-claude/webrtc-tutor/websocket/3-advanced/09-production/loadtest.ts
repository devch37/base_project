/**
 * loadtest.ts — "내 서버는 연결 몇 개를 감당하는가?"를 직접 측정한다
 *
 *   npm run ws:09:load            # 기본 2000 연결
 *   npm run ws:09:load -- 10000   # 1만 연결
 *
 * 측정 항목
 *   1) 연결 수립 지연 (p50 / p95 / p99)        — 접속이 몰릴 때 서버가 버티는가
 *   2) 연결당 서버 메모리(KB)                    — 용량 산정의 기본 단위
 *   3) 팬아웃 지연: 한 명이 방에 보낸 메시지가 N-1명 모두에게 도달하는 시간
 *
 * 서버는 별도 프로세스(main.ts)로 띄워서 **서버 프로세스의 RSS** 만 정확히 잰다.
 * (같은 프로세스에서 재면 클라이언트 N개의 메모리가 섞인다)
 *
 * ★ 파일 디스크립터(FD): 소켓 1개 = FD 1개. OS 기본 한도(macOS 256, Linux 1024)로는 수천 연결이 불가능하다.
 *   이 스크립트는 한도가 부족하면 `ulimit -n` 을 올려 자기 자신을 다시 실행한다.
 *   운영 서버는 systemd `LimitNOFILE`, 컨테이너는 `--ulimit nofile=` 로 올려야 한다.
 */
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import WebSocket from 'ws';
import { say } from '../../tools/narrate';

const N = Number(process.argv[2] ?? 2000);

// ── FD 한도 확인 / 자기 재실행 ───────────────────────────────────────────────────
const limit = Number(spawnSync('sh', ['-c', 'ulimit -n']).stdout.toString().trim());
const needed = N * 2 + 512; // 클라이언트 소켓 N + (서버 쪽 N 은 자식 프로세스가 따로 가짐) + 여유
if (Number.isFinite(limit) && limit < needed && !process.env.LT_REEXEC) {
  const r = spawnSync('sh', ['-c', 'ulimit -n 65535 2>/dev/null || ulimit -n 10240 2>/dev/null; exec "$@"', 'sh', process.execPath, ...process.execArgv, process.argv[1]!, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, LT_REEXEC: '1' },
  });
  process.exit(r.status ?? 1);
}

const rssKb = (pid: number) => Number(spawnSync('ps', ['-o', 'rss=', '-p', String(pid)]).stdout.toString().trim());
const pct = (a: number[], p: number) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor((p / 100) * a.length))]!;

say.title(`9. 부하 테스트: ${N} 연결 (FD 한도 ${spawnSync('sh', ['-c', 'ulimit -n']).stdout.toString().trim()})`);

// ── 서버 프로세스 기동 ─────────────────────────────────────────────────────────
const entry = new URL('./main.ts', import.meta.url).pathname;
const child: ChildProcess = spawn(process.execPath, [...process.execArgv, entry], {
  env: { ...process.env, PORT: '0', NODE_ID: 'load', HEARTBEAT_MS: '60000' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
const port = await new Promise<number>((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('서버 기동 시간 초과')), 15_000);
  child.stdout!.on('data', (d: Buffer) => {
    for (const line of d.toString().split('\n')) {
      if (!line.includes('서버 시작')) continue;
      clearTimeout(t);
      resolve((JSON.parse(line) as { port: number }).port);
    }
  });
  child.once('exit', (c) => reject(new Error(`서버가 종료됨 (code ${c})`)));
});
const pid = child.pid!;
await new Promise((r) => setTimeout(r, 300));
const baseKb = rssKb(pid);
say.server(`서버 PID ${pid}, 포트 ${port}, 기본 RSS ${(baseKb / 1024).toFixed(1)}MB`);

// ── ① 연결 수립 ──────────────────────────────────────────────────────────────
say.step(`① ${N} 개 연결을 200개씩 동시에 맺는다`);
interface C {
  ws: WebSocket;
  gotAt: number;
}
const clients: C[] = [];
const connectMs: number[] = [];
const tStart = performance.now();
for (let i = 0; i < N; i += 200) {
  await Promise.all(
    Array.from({ length: Math.min(200, N - i) }, async () => {
      const t0 = performance.now();
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
      await new Promise<void>((resolve, reject) => {
        ws.once('message', () => resolve()); // welcome 메시지 = 서버가 완전히 받아 줌
        ws.once('error', reject);
      });
      connectMs.push(performance.now() - t0);
      const c: C = { ws, gotAt: 0 };
      ws.on('error', () => {});
      clients.push(c);
    }),
  );
}
const connectSec = (performance.now() - tStart) / 1000;
await new Promise((r) => setTimeout(r, 500));
const afterKb = rssKb(pid);
say.ok(`${clients.length} 연결 성공 (${connectSec.toFixed(1)}초, ${(clients.length / connectSec).toFixed(0)} conn/s)`);
say.note(`연결 수립 지연  p50=${pct(connectMs, 50).toFixed(0)}ms  p95=${pct(connectMs, 95).toFixed(0)}ms  p99=${pct(connectMs, 99).toFixed(0)}ms`);
say.note(`서버 RSS ${(baseKb / 1024).toFixed(0)}MB → ${(afterKb / 1024).toFixed(0)}MB  ⇒ 연결당 약 ${(((afterKb - baseKb) * 1024) / clients.length / 1024).toFixed(1)}KB (유휴 상태, 압축 없음)`);

// ── ② 팬아웃 ─────────────────────────────────────────────────────────────────
say.step('② 전원이 방 "bench" 에 입장한 뒤, 1명이 보낸 메시지가 나머지 전원에게 도달하는 시간');
await Promise.all(
  clients.map(
    (c) =>
      new Promise<void>((resolve) => {
        c.ws.once('message', () => resolve()); // room.join 응답(요청 id 를 붙였으므로)
        c.ws.send(JSON.stringify({ v: 1, id: 'j', type: 'room.join', payload: { room: 'bench' } }));
      }),
  ),
);

for (let trial = 1; trial <= 3; trial++) {
  let received = 0;
  const lat: number[] = [];
  const t0 = performance.now();
  const done = new Promise<void>((resolve) => {
    for (const c of clients) {
      const h = () => {
        lat.push(performance.now() - t0);
        c.ws.off('message', h);
        if (++received === clients.length - 1) resolve();
      };
      c.ws.on('message', h);
    }
  });
  clients[0]!.ws.send(JSON.stringify({ v: 1, type: 'room.message', payload: { room: 'bench', data: 'ping' } }));
  await done;
  say.note(`시도 ${trial}: ${clients.length - 1}명 전원 수신까지 ${Math.max(...lat).toFixed(0)}ms (p50=${pct(lat, 50).toFixed(0)}ms, p99=${pct(lat, 99).toFixed(0)}ms)  — 서버 팬아웃 처리량 ≈ ${(((clients.length - 1) / Math.max(...lat)) * 1000).toFixed(0)} msg/s`);
}

// ── 정리 ────────────────────────────────────────────────────────────────────
say.step('정리: 서버에 SIGTERM → 우아한 종료 확인');
const exited = new Promise<number | null>((resolve) => child.once('exit', (c) => resolve(c)));
child.kill('SIGTERM');
const code = await Promise.race([exited, new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 15_000))]);
say.ok(`서버 종료 코드: ${code} (0 = 우아한 종료 성공)`);
clients.forEach((c) => c.ws.terminate());
process.exit(code === 0 ? 0 : 1);
