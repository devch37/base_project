/**
 * e2e 도우미 — 실제 Chromium(Playwright)으로 WebRTC 를 검증한다.
 *
 * 헤드리스 브라우저에는 카메라/마이크가 없으므로 Chromium 의 "가짜 장치" 플래그를 쓴다.
 *   --use-fake-device-for-media-stream  : 테스트 패턴 영상 + 비프음을 내는 가짜 카메라/마이크
 *   --use-fake-ui-for-media-stream      : "카메라를 허용하시겠습니까?" 팝업 자동 승인
 *   --autoplay-policy=no-user-gesture-required : 클릭 없이 오디오/비디오 자동재생
 *   --disable-features=WebRtcHideLocalIpsWithMdns : 로컬 IP 를 mDNS(.local) 이름으로 숨기는 기능을 끈다.
 *        (기본값에서는 같은 PC 의 두 탭이 서로의 mDNS 이름을 풀지 못해 연결이 안 되는 샌드박스가 있다)
 *   --allow-loopback-in-peer-connection : 127.0.0.1 후보 허용
 */
import { createServer, type Server } from 'node:http';
import { type Browser, type BrowserContext, chromium } from 'playwright';
import { createStaticHandler } from '../tools/static';

export const CHROMIUM_ARGS = [
  '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream',
  '--autoplay-policy=no-user-gesture-required',
  '--disable-features=WebRtcHideLocalIpsWithMdns',
  '--allow-loopback-in-peer-connection',
];

export async function launch(): Promise<Browser> {
  return chromium.launch({ args: CHROMIUM_ARGS });
}

export async function newContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ permissions: ['camera', 'microphone'] });
}

/** public 디렉터리만 서빙하는 정적 서버 */
export async function serveStatic(publicDir: string): Promise<{ url: string; server: Server; close(): Promise<void> }> {
  const handler = createStaticHandler({ '/': publicDir });
  const server = createServer(async (req, res) => {
    if (!(await handler(req, res))) res.writeHead(404).end();
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as { port: number }).port;
  return {
    url: `http://127.0.0.1:${port}`,
    server,
    close: () =>
      new Promise<void>((r) => {
        server.close(() => r());
        server.closeAllConnections();
      }),
  };
}

/** 조건이 참이 될 때까지 폴링 */
export async function until<T>(fn: () => Promise<T | undefined | false | null>, timeoutMs = 15_000, label = '조건'): Promise<T> {
  const end = Date.now() + timeoutMs;
  let last: unknown;
  while (Date.now() < end) {
    try {
      const v = await fn();
      if (v) return v;
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`시간 초과: ${label}${last ? ` (${(last as Error).message})` : ''}`);
}
