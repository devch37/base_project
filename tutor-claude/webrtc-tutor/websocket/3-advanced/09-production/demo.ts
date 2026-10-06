/**
 * npm run ws:09 — 무중단 배포(롤링 재시작) 시뮬레이션
 *
 * 질문: 서버를 재배포할 때 연결된 사용자 300명은 어떻게 될까?
 *   (a) 그냥 프로세스를 죽이면      → 300명이 같은 순간 끊기고 같은 순간 몰려와 새 서버를 때린다 (재연결 쓰나미)
 *   (b) 우아한 종료 + 지터 힌트를 주면 → 재연결 시각이 시간축에 퍼져 새 서버가 여유 있게 받는다
 * 두 경우의 "재연결 시각 분포"를 히스토그램으로 비교한다.
 */
import { WsClient } from '@tutor/ws-kit/client';
import { WsServer } from '@tutor/ws-kit';
import WebSocket from 'ws';
import { say, sleep, until } from '../../tools/narrate';
import { startLb } from '../08-scale-out-redis/lb';

const CLIENTS = 300;
const BUCKET_MS = 250;

async function rollingRestart(label: string, opts: { jitterMs: number; graceful: boolean }): Promise<number[]> {
  const oldNode = new WsServer({ nodeId: 'old', heartbeat: false, rateLimit: false });
  const newNode = new WsServer({ nodeId: 'new', heartbeat: false, rateLimit: false });
  const oldPort = await oldNode.start();
  const newPort = await newNode.start();

  // LB 는 처음엔 old 만 가리키다가, 배포 시점에 new 로 전환된다 (실제로는 /readyz 가 503 이면 LB 가 old 를 풀에서 뺀다)
  let backends = [oldPort];
  const lb = await startLb(() => backends);

  const reconnectAt: number[] = [];
  let t0 = 0;
  const clients: WsClient[] = [];
  for (let i = 0; i < CLIENTS; i++) {
    const c = new WsClient({
      url: `ws://127.0.0.1:${lb.port}/ws`,
      WebSocket: WebSocket as never,
      pingIntervalMs: 0,
      backoff: { baseMs: 100, maxMs: 2000, factor: 2 },
    });
    c.on('open', (e) => e.reconnected && reconnectAt.push(Date.now() - t0));
    clients.push(c);
  }
  await Promise.all(clients.map((c) => c.connect()));
  say.note(`${label}: ${CLIENTS}명이 old 노드에 접속 완료 (old 연결 수 ${oldNode.connectionCount})`);

  // ── 배포 시작 ──
  t0 = Date.now();
  backends = [newPort]; // LB 가 새 노드로 트래픽 전환 (readiness 가 실패한 노드를 풀에서 제외)
  if (opts.graceful) {
    // 1) /readyz 는 draining 중 503 (LB 가 보고 풀에서 뺀다)  2) server.shutdown 알림 + 1012  3) 지터 힌트로 재연결 분산
    const ready = await fetch(`http://127.0.0.1:${oldPort}/readyz`).then((r) => r.status);
    const closing = oldNode.close({ graceMs: 3000, reconnectJitterMs: opts.jitterMs });
    await sleep(20);
    const draining = await fetch(`http://127.0.0.1:${oldPort}/readyz`).then((r) => r.status).catch(() => 'down');
    say.note(`/readyz: 종료 전 ${ready} → drain 중 ${draining}  (LB 가 503 을 보고 old 를 풀에서 제거)`);
    await closing;
  } else {
    oldNode.simulateCrash(); // 그냥 프로세스를 죽인 것과 같다: 알림도, 지터 힌트도 없다
  }

  await until(() => reconnectAt.length === CLIENTS, 15_000, '전원 재연결');
  say.ok(`${label}: ${CLIENTS}명 전원 재연결 (new 노드 연결 수 ${newNode.connectionCount}), 마지막 재연결 = ${Math.max(...reconnectAt)}ms 후`);

  clients.forEach((c) => c.close());
  await lb.close();
  await newNode.close({ graceMs: 200 });
  return reconnectAt;
}

function histogram(times: number[], horizonMs = 3000): void {
  const n = Math.ceil(horizonMs / BUCKET_MS);
  const buckets = new Array<number>(n).fill(0);
  for (const t of times) buckets[Math.min(n - 1, Math.floor(t / BUCKET_MS))]!++;
  const peak = Math.max(...buckets);
  buckets.forEach((c, i) => {
    const label = `${((i * BUCKET_MS) / 1000).toFixed(2)}s`.padStart(6);
    console.log(`  ${label} │${'█'.repeat(Math.round((c / peak) * 40))} ${c}`);
  });
  say.note(`가장 몰린 ${BUCKET_MS}ms 구간의 재연결 = ${peak}건`);
}

say.title('9. 운영: 무중단 배포와 재연결 쓰나미');

say.step('(a) 그냥 죽이기: 알림 없음, 지터 힌트 없음 (클라이언트 기본 백오프만)');
const a = await rollingRestart('(a)', { jitterMs: 0, graceful: false });
histogram(a);

say.step('(b) 우아한 종료: /readyz 503 → server.shutdown(reconnectAfterMs 0~2s 랜덤) → close(1012)');
const b = await rollingRestart('(b)', { jitterMs: 2000, graceful: true });
histogram(b);

say.note('(b)는 서버가 클라이언트마다 다른 "N ms 뒤에 오라"를 알려 줘 재연결이 시간축에 고르게 퍼진다. 새 노드의 순간 부하가 크게 낮다.');
say.ok('9장 데모 끝');
