/**
 * 최종 프로젝트 e2e: 실제 Chromium 두 개(고객·상담사) + 실제 서버로 화면 공유 상담 전체를 확인한다.
 * 실행: ./gradlew :server:cobrowse-server:bootJar && npm run e2e
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Frame, type Page } from 'playwright';
import type { ViteDevServer } from 'vite';
import { kill, startJava, startTenant, startVite, waitFor, waitHttp } from './harness.ts';

const CHAT = 18080, TENANT = 13000, WEB = 15173;
const base = `http://localhost:${WEB}`;

let java: ChildProcess, tenant: ChildProcess, vite: ViteDevServer, browser: Browser;
let customer: Page, agent: Page, mirror: Frame;
const customerId = `e2e-${Date.now()}`;

describe('화면 공유 상담 (단일 서버)', () => {
  before(async () => {
    java = startJava(CHAT);
    tenant = startTenant(TENANT, [`http://localhost:${CHAT}`]);
    await waitHttp(`http://localhost:${CHAT}/actuator/health`);
    vite = await startVite(WEB, `http://localhost:${CHAT}`, `http://localhost:${TENANT}`);
    browser = await chromium.launch();
    customer = await (await browser.newContext({ viewport: { width: 1100, height: 800 } })).newPage();
    agent = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
    customer.on('pageerror', (e) => console.error('[customer page error]', e));
    agent.on('pageerror', (e) => console.error('[agent page error]', e));
  });

  after(async () => {
    await browser?.close();
    await vite?.close();
    await kill(tenant);
    await kill(java);
  });

  it('고객이 상담을 시작하고 상담사가 입장하면 고객 화면이 복제된다', async () => {
    await customer.goto(`${base}/apps/customer/?customer=${customerId}`);
    await customer.click('#cb-start');
    await waitFor(async () => (await customer.textContent('#cb-state'))?.startsWith('connected') ?? false, 15_000, '고객 연결');

    await agent.goto(`${base}/apps/agent/`);
    const joinBtn = agent.locator('#rooms li', { hasText: customerId }).locator('button');
    await joinBtn.waitFor({ timeout: 15_000 });
    await joinBtn.click();

    await waitFor(async () => {
      const f = agent.frame({ url: /about:blank/ }) ?? agent.frames().find((x) => x !== agent.mainFrame());
      if (!f) return false;
      mirror = f;
      return (await f.locator('.site-header').count()) === 1;
    }, 15_000, '복제 화면');
    assert.equal(await mirror.locator('#cb-widget').count(), 0, 'SDK 위젯(data-cobrowse-ignore)은 복제되지 않는다');
    assert.equal(await mirror.locator('script').count(), 0, '스크립트는 복제되지 않는다');
    const logo = await mirror.locator('header img').getAttribute('src');
    assert.match(logo ?? '', /^http:\/\/localhost:15173\/apps\/customer\/assets\/logo\.svg$/, '상대 경로가 절대 경로로');
  });

  it('고객 입력이 상담사 화면에 반영되고, 민감 정보는 가려진다', async () => {
    await customer.fill('#name', '홍길동');
    await customer.fill('#rrn', '900101-1234567');
    await customer.fill('#card', '4111111111111111');
    await waitFor(async () => (await mirror.inputValue('#name')) === '홍길동', 5000, '이름 동기화');
    await waitFor(async () => (await mirror.inputValue('#rrn')).length > 0, 5000, '주민번호 동기화');
    assert.match(await mirror.inputValue('#rrn'), /^[•-]+$/u);
    assert.doesNotMatch(await mirror.inputValue('#card'), /4111/);
    assert.equal(await mirror.locator('[data-cobrowse-placeholder="blocked"]').count(), 1, '계좌 영역은 통째로 가려짐');
  });

  it('DOM 변경(요소 추가)과 스크롤이 반영된다', async () => {
    await customer.click('#add-beneficiary');
    await customer.click('#add-beneficiary');
    await waitFor(async () => (await mirror.locator('#beneficiaries li').count()) === 2, 5000, '목록 추가');
    await customer.locator('#terms').evaluate((el) => (el.scrollTop = 200));
    await waitFor(async () => (await mirror.locator('#terms').evaluate((el) => el.scrollTop)) > 100, 5000, '스크롤');
  });

  it('동의 전 상담사 클릭은 "가리키기"만 되고, 동의 후에는 실제 클릭이 된다', async () => {
    await mirror.click('.plan[data-plan="premium"]');
    await customer.waitForTimeout(500);
    assert.equal(await customer.locator('.plan.selected').count(), 0, '동의 전에는 고객 화면이 바뀌지 않는다');

    await customer.click('#cb-control');
    await waitFor(async () => (await agent.textContent('#consent'))?.includes('허용됨') ?? false, 5000, '동의 상태 전파');
    await mirror.click('.plan[data-plan="premium"]');
    await waitFor(async () => (await customer.locator('.plan.selected[data-plan="premium"]').count()) === 1, 5000, '원격 클릭');
    await waitFor(async () => (await mirror.locator('.plan.selected[data-plan="premium"]').count()) === 1, 5000, '결과가 다시 복제됨');
  });

  it('상담사 원격 입력: 페이지가 가공한 "결과값"이 양쪽에 같게 남는다 (ack)', async () => {
    await mirror.fill('#phone', '01012345678');
    await waitFor(async () => (await customer.inputValue('#phone')) === '010-1234-5678', 5000, '고객 쪽 적용');
    await waitFor(async () => (await mirror.inputValue('#phone')) === '010-1234-5678', 5000, 'ack 로 상담사 쪽 보정');
  });

  it('원격 클릭 금지 요소와 보호 필드는 거절된다', async () => {
    await mirror.click('#submit');
    await waitFor(async () => (await agent.textContent('#log'))?.includes('원격 클릭 금지 요소') ?? false, 5000, '거절 ack');
    assert.equal(await customer.locator('.toast').count(), 0);
  });

  it('채팅이 양방향으로 오간다', async () => {
    await customer.fill('#cb-text', '안녕하세요 도와주세요');
    await customer.press('#cb-text', 'Enter');
    await waitFor(async () => (await agent.textContent('#chat'))?.includes('안녕하세요 도와주세요') ?? false, 5000, '고객→상담사');
    await agent.fill('#text', '네 화면 보고 있어요');
    await agent.press('#text', 'Enter');
    await waitFor(async () => (await customer.textContent('#cb-chat'))?.includes('네 화면 보고 있어요') ?? false, 5000, '상담사→고객');
  });

  it('서버가 모든 연결을 끊어도 양쪽이 재연결하고 화면이 다시 맞춰진다', async () => {
    await fetch(`http://localhost:${CHAT}/internal/admin/drop-connections`, { method: 'POST', headers: { 'X-Api-Key': 'dev-acme-key' } });
    await waitFor(async () => !((await customer.textContent('#cb-state'))?.startsWith('connected') ?? true), 5000, '끊김 감지');
    await waitFor(async () => (await customer.textContent('#cb-state'))?.startsWith('connected') ?? false, 20_000, '고객 재연결');
    await waitFor(async () => (await agent.textContent('#state')) === 'connected', 20_000, '상담사 재연결');

    await customer.fill('#memo', '재연결 이후 입력');
    await customer.click('#add-beneficiary');
    await waitFor(async () => (await mirror.locator('#beneficiaries li').count()) === 3, 10_000, '재연결 후 변경 반영');
    // memo 는 고객사가 추가 마스킹한 필드
    await waitFor(async () => /^[•\s]+$/u.test(await mirror.inputValue('#memo')), 5000, '재연결 후 마스킹 유지');
  });
});
