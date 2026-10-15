import { JSDOM, VirtualConsole } from 'jsdom';

/** jsdom 이 구현하지 않은 API(scrollTo 등) 경고는 숨긴다. 진짜 오류는 그대로 보인다. */
function quietConsole(): VirtualConsole {
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    if (!String(e.message).startsWith('Not implemented')) console.error(e);
  });
  return vc;
}

/** 고객 페이지 역할의 가짜 문서 */
export function customerPage(body: string, url = 'https://shop.example/products/1'): Document {
  const dom = new JSDOM(`<!DOCTYPE html><html><head><title>t</title></head><body>${body}</body></html>`, { url, virtualConsole: quietConsole() });
  return dom.window.document;
}

/** 상담사 iframe 역할의 빈 문서 */
export function agentFrame(): Document {
  return new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost:5173/agent', virtualConsole: quietConsole() }).window.document;
}

/** MutationObserver 콜백은 마이크로태스크로 실행된다 → 한 박자 기다려 준다 */
export const flush = () => new Promise((r) => setTimeout(r, 0));

/** 비교용: 공백 정리한 body HTML */
export function bodyHtml(doc: Document): string {
  return doc.body.innerHTML.replace(/\s+/g, ' ').trim();
}
