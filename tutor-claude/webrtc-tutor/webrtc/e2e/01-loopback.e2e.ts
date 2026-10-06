/** 1장 Loopback: 한 페이지 안의 두 피어가 실제로 연결되고, 영상 프레임과 데이터채널 메시지가 흐르는가 */
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Browser } from 'playwright';
import { launch, newContext, serveStatic, until } from './helpers';

const here = dirname(fileURLToPath(import.meta.url));

describe('01 loopback (Chromium)', () => {
  let browser: Browser;
  let srv: Awaited<ReturnType<typeof serveStatic>>;
  before(async () => {
    browser = await launch();
    srv = await serveStatic(resolve(here, '../1-basic/01-loopback/public'));
  });
  after(async () => {
    await browser.close();
    await srv.close();
  });

  it('auto 모드: 연결 → 데이터채널 echo → 영상 프레임 디코딩', async () => {
    const page = await (await newContext(browser)).newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${srv.url}/?auto=1`);

    const result = await until(
      async () => {
        const r = (await page.evaluate(() => (window as unknown as { __result?: Record<string, unknown> }).__result)) as { connected: boolean; echo?: string; framesDecoded: number } | undefined;
        return r && r.connected && r.echo && r.framesDecoded > 5 ? r : undefined;
      },
      20_000,
      'loopback 연결/프레임',
    );
    assert.equal(result.echo, 'echo:hello from Alice');
    assert.ok(result.framesDecoded > 5);
    assert.deepEqual(errors, []);

    // SDP 요약이 화면에 표시되었는가 (offer 에 audio/video/application 섹션이 있어야 한다)
    const offer = await page.textContent('#offer-sum');
    assert.match(offer ?? '', /audio/);
    assert.match(offer ?? '', /video/);
    assert.match(offer ?? '', /BUNDLE/);
    await page.close();
  });
});
