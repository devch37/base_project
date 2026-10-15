// @vitest-environment jsdom
/**
 * 22장: 상담사 콘솔은 고객이 보낸 데이터를 "믿지 않는다".
 * 변조된 SDK·악성 고객이 보낸 스냅샷이라고 가정하고, 위험 요소가 하나도 살아나지 않는지 확인.
 */
import { describe, expect, it } from 'vitest';
import { Mirror } from '../src/mirror.ts';
import type { SnapshotData } from '../src/protocol.ts';
import { agentFrame } from './helpers.ts';

const evil: SnapshotData = {
  url: 'https://shop.example/',
  viewport: { w: 800, h: 600 },
  scroll: { x: 0, y: 0 },
  root: {
    id: 1, t: 'el', tag: 'html', attrs: {}, children: [
      { id: 2, t: 'el', tag: 'head', attrs: {}, children: [
        { id: 3, t: 'el', tag: 'meta', attrs: { 'http-equiv': 'refresh', content: '0;url=https://evil' }, children: [] },
        { id: 4, t: 'el', tag: 'script', attrs: {}, children: [{ id: 5, t: 'text', text: 'alert(1)' }] },
      ] },
      { id: 6, t: 'el', tag: 'body', attrs: { onload: 'alert(2)' }, children: [
        { id: 7, t: 'el', tag: 'img', attrs: { src: 'x', onerror: 'alert(3)' }, children: [] },
        { id: 8, t: 'el', tag: 'a', attrs: { href: ' JaVa\nScRiPt:alert(4)' }, children: [{ id: 9, t: 'text', text: 'link' }] },
        { id: 10, t: 'el', tag: 'iframe', attrs: { srcdoc: '<script>alert(5)</script>' }, children: [] },
        { id: 11, t: 'el', tag: 'img"><script>', attrs: {}, children: [] },
        { id: 12, t: 'el', tag: 'p', attrs: { title: '<b>텍스트는 텍스트일 뿐</b>' }, children: [{ id: 13, t: 'text', text: '<img src=x onerror=alert(6)>' }] },
      ] },
    ],
  },
};

describe('Mirror 는 받은 데이터를 다시 소독한다', () => {
  it('스크립트·이벤트 핸들러·javascript: URL·meta refresh·iframe 이 모두 사라진다', () => {
    const doc = agentFrame();
    new Mirror(() => doc).applySnapshot(evil);
    const html = doc.documentElement.outerHTML;

    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelector('meta[http-equiv]')).toBeNull();
    expect(doc.querySelector('iframe')).toBeNull();
    expect(doc.body.getAttribute('onload')).toBeNull();
    expect(doc.querySelector('img')!.getAttribute('onerror')).toBeNull();
    expect(doc.querySelector('a')!.getAttribute('href')).toBeNull();
    // 남은 'alert(' 는 <p> 안의 "글자"뿐이어야 한다 (실행 불가능한 텍스트)
    const allAttrs = Array.from(doc.querySelectorAll('*')).flatMap((el) => Array.from(el.attributes).map((a) => a.name + '=' + a.value));
    expect(allAttrs.join(' ')).not.toContain('alert(');
    expect(allAttrs.some((a) => a.startsWith('on'))).toBe(false);
    expect(html.match(/alert\(/g)).toHaveLength(1);
  });

  it('텍스트 안의 태그 문자열은 텍스트로만 들어간다 (innerHTML 을 안 쓰는 이유)', () => {
    const doc = agentFrame();
    new Mirror(() => doc).applySnapshot(evil);
    const p = doc.querySelector('p')!;
    expect(p.textContent).toBe('<img src=x onerror=alert(6)>');
    expect(p.querySelector('img')).toBeNull();
  });

  it('변경분(attr)으로 이벤트 핸들러를 넣으려 해도 막힌다', () => {
    const doc = agentFrame();
    const m = new Mirror(() => doc);
    m.applySnapshot(evil);
    m.applyOp({ op: 'attr', id: 12, name: 'onclick', value: 'alert(7)' });
    m.applyOp({ op: 'attr', id: 12, name: 'class', value: 'ok' });
    expect(doc.querySelector('p')!.getAttribute('onclick')).toBeNull();
    expect(doc.querySelector('p')!.className).toBe('ok');
  });
});
