/**
 * 23·24장 e2e: 서버 2대(Hazelcast 클러스터). 고객은 A, 상담사는 B 에 붙는다.
 * 그다음 A 를 "강제 종료(SIGKILL)" — 정리 코드가 돌 틈도 없는 진짜 장애 — 하고 복구를 확인한다.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Frame, type Page } from 'playwright';
import type { ViteDevServer } from 'vite';
import { kill, startJava, startTenant, startVite, waitFor, waitHttp } from './harness.ts';

const A = 18081, B = 18082, TENANT = 13001, WEB = 15174;
const base = `http://localhost:${WEB}`;
const clusterEnv = (hzPort: number) => ({
  CHAT_CLUSTER_ENABLED: 'true',
  CHAT_CLUSTER_NAME: `e2e-${process.pid}`,
  CHAT_CLUSTER_PORT: String(hzPort),
  CHAT_CLUSTER_MEMBERS: '127.0.0.1:15701,127.0.0.1:15702',
  CHAT_PRESENCE_TTL: '6s',
  CHAT_PRESENCE_REFRESH_INTERVAL: '2s',
});

let nodeA: ChildProcess, nodeB: ChildProcess, tenant: ChildProcess, vite: ViteDevServer, browser: Browser;
let customer: Page, agent: Page, mirror: Frame;
const customerId = `cluster-${Date.now()}`;

async function roomPresenceNodes(): Promise<string[]> {
  const rooms = (await (await fetch(`http://localhost:${B}/internal/rooms`, { headers: { 'X-Api-Key': 'dev-acme-key' } })).json()) as Array<{
    customerId: string;
    presence: { nodes: string[] };
  }>;
  return rooms.find((r) => r.customerId === customerId)?.presence.nodes ?? [];
}

describe('클러스터: 고객은 A, 상담사는 B', () => {
  before(async () => {
    nodeA = startJava(A, clusterEnv(15701));
    nodeB = startJava(B, clusterEnv(15702));
    await waitHttp(`http://localhost:${A}/actuator/health`, 90_000);
    await waitHttp(`http://localhost:${B}/actuator/health`, 90_000);
    await waitFor(async () => (await (await fetch(`http://localhost:${B}/api/public/node`)).json()).clusterMembers === 2, 30_000, '클러스터 합류');
    tenant = startTenant(TENANT, [`http://localhost:${A}`, `http://localhost:${B}`]);
    vite = await startVite(WEB, `http://localhost:${A}`, `http://localhost:${TENANT}`);
    browser = await chromium.launch();
    customer = await (await browser.newContext({ viewport: { width: 1100, height: 800 } })).newPage();
    agent = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  });

  after(async () => {
    await browser?.close();
    await vite?.close();
    await kill(tenant);
    await Promise.all([kill(nodeA), kill(nodeB)]);
  });

  it('서로 다른 서버에 붙은 고객과 상담사가 화면을 공유한다', async () => {
    await customer.goto(`${base}/apps/customer/?customer=${customerId}&ws=ws://localhost:${A}/ws,ws://localhost:${B}/ws`);
    await customer.click('#cb-start');
    await waitFor(async () => (await customer.textContent('#cb-state'))?.startsWith('connected') ?? false, 15_000, '고객 연결(A)');

    await agent.goto(`${base}/apps/agent/?ws=ws://localhost:${B}/ws`);
    const joinBtn = agent.locator('#rooms li', { hasText: customerId }).locator('button');
    await joinBtn.waitFor({ timeout: 15_000 });
    await joinBtn.click();
    await waitFor(async () => {
      const f = agent.frames().find((x) => x !== agent.mainFrame());
      if (!f) return false;
      mirror = f;
      return (await f.locator('.site-header').count()) === 1;
    }, 15_000, '복제 화면(B 경유)');

    await customer.fill('#name', '김클러스터');
    await waitFor(async () => (await mirror.inputValue('#name')) === '김클러스터', 5000, 'A→Hazelcast Topic→B');
    await waitFor(async () => (await roomPresenceNodes()).length === 2, 10_000, 'presence 에 두 노드');
    assert.deepEqual((await roomPresenceNodes()).sort(), [`node-${A}`, `node-${B}`]);
  });

  it('A 가 갑자기 죽으면 고객은 B 로 재연결하고, 화면이 다시 맞춰지며, A 의 presence 는 TTL 로 사라진다', async () => {
    await kill(nodeA, 'SIGKILL');

    await waitFor(async () => (await customer.textContent('#cb-state'))?.startsWith('connected') ?? false, 30_000, '고객 B 로 재연결');
    await customer.click('#add-beneficiary');
    await customer.fill('#name', '장애 이후');
    await waitFor(async () => (await mirror.inputValue('#name')) === '장애 이후', 15_000, '재연결 후 동기화');
    await waitFor(async () => (await mirror.locator('#beneficiaries li').count()) === 1, 5000, '재연결 후 DOM 변경');

    // 방 정보(IMap)는 B 의 백업 복제본 덕분에 살아 있고, A 가 남긴 presence 는 갱신이 멈춰 TTL(6초) 뒤 사라진다
    await waitFor(async () => {
      const nodes = await roomPresenceNodes();
      return nodes.length === 1 && nodes[0] === `node-${B}`;
    }, 30_000, 'A 의 presence 만료');
  });
});
