// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { serializeDocument, type SerializeContext } from '../src/serializer.ts';
import { NodeIds } from '../src/node-ids.ts';
import { mergeMask } from '../src/masking.ts';
import type { SerializedElement, SerializedNode } from '../src/protocol.ts';
import { customerPage } from './helpers.ts';

function ctx(doc: Document, maskAllInputs = false): SerializeContext {
  return { ids: new NodeIds(), mask: mergeMask({ maskAllInputs }), base: doc.baseURI, inlineStylesheets: true };
}

function find(n: SerializedNode, pred: (e: SerializedElement) => boolean): SerializedElement | undefined {
  if (n.t !== 'el') return undefined;
  if (pred(n)) return n;
  for (const c of n.children) {
    const f = find(c, pred);
    if (f) return f;
  }
  return undefined;
}

function texts(n: SerializedNode): string {
  return n.t === 'text' ? n.text : n.children.map(texts).join('');
}

describe('serializer (15·16장)', () => {
  it('script 와 on* 속성은 보내지 않는다', () => {
    const doc = customerPage('<script>alert(1)</script><button onclick="steal()">결제</button>');
    const snap = serializeDocument(doc, ctx(doc));
    expect(find(snap.root, (e) => e.tag === 'script')).toBeUndefined();
    const btn = find(snap.root, (e) => e.tag === 'button')!;
    expect(btn.attrs.onclick).toBeUndefined();
  });

  it('상대 URL 은 절대 URL 로, javascript: 링크는 제거', () => {
    const doc = customerPage(
      '<img src="/img/a.png" srcset="b.png 2x"><a href="../cart">장바구니</a><a href="javascript:evil()">x</a>' +
        '<div style="background:url(bg.png)"></div>',
    );
    const snap = serializeDocument(doc, ctx(doc));
    expect(find(snap.root, (e) => e.tag === 'img')!.attrs.src).toBe('https://shop.example/img/a.png');
    expect(find(snap.root, (e) => e.tag === 'img')!.attrs.srcset).toBe('https://shop.example/products/b.png 2x');
    const links = [find(snap.root, (e) => e.tag === 'a' && e.attrs.href !== undefined)!];
    expect(links[0]!.attrs.href).toBe('https://shop.example/cart');
    expect(find(snap.root, (e) => e.tag === 'a' && texts(e) === 'x')!.attrs.href).toBeUndefined();
    expect(find(snap.root, (e) => e.tag === 'div')!.attrs.style).toContain('url(https://shop.example/products/bg.png)');
  });

  it('입력값은 attribute 가 아니라 property(현재 값)를 보낸다', () => {
    const doc = customerPage('<input id="name" value="초기값">');
    (doc.getElementById('name') as HTMLInputElement).value = '사용자가 친 값';
    const snap = serializeDocument(doc, ctx(doc));
    const input = find(snap.root, (e) => e.tag === 'input')!;
    expect(input.attrs.value).toBe('초기값'); // attribute 는 그대로
    expect(input.value).toBe('사용자가 친 값'); // 화면에 보이는 값
  });

  it('비밀번호·카드번호·data-cobrowse-mask 는 가려서 보낸다', () => {
    const doc = customerPage(
      '<input type="password" id="pw"><input autocomplete="cc-number" id="cc">' +
        '<p data-cobrowse-mask>주민번호 900101-1234567</p><p>공개 정보</p>',
    );
    (doc.getElementById('pw') as HTMLInputElement).value = 'secret!';
    (doc.getElementById('cc') as HTMLInputElement).value = '4111 1111 1111 1111';
    const snap = serializeDocument(doc, ctx(doc));
    const json = JSON.stringify(snap);
    expect(json).not.toContain('secret!');
    expect(json).not.toContain('4111');
    expect(json).not.toContain('900101');
    expect(json).toContain('공개 정보');
    expect(find(snap.root, (e) => e.attrs.type === 'password')!.value).toBe('•••••••');
  });

  it('maskAllInputs 이면 모든 입력값을 가린다', () => {
    const doc = customerPage('<input id="a">');
    (doc.getElementById('a') as HTMLInputElement).value = '홍길동';
    const snap = serializeDocument(doc, ctx(doc, true));
    expect(JSON.stringify(snap)).not.toContain('홍길동');
  });

  it('data-cobrowse-block 은 내용 없이 회색 상자로', () => {
    const doc = customerPage('<section data-cobrowse-block><p>계좌 잔고 1억</p></section>');
    const snap = serializeDocument(doc, ctx(doc));
    expect(JSON.stringify(snap)).not.toContain('1억');
    expect(find(snap.root, (e) => e.attrs['data-cobrowse-placeholder'] === 'blocked')).toBeDefined();
  });

  it('iframe·canvas 는 대체 요소로 바뀐다 (내용을 DOM 으로 보낼 수 없다)', () => {
    const doc = customerPage('<iframe src="https://pay.example"></iframe><canvas width="10" height="10"></canvas>');
    const snap = serializeDocument(doc, ctx(doc));
    expect(find(snap.root, (e) => e.tag === 'iframe')).toBeUndefined();
    expect(find(snap.root, (e) => e.attrs['data-cobrowse-placeholder'] === 'iframe')).toBeDefined();
    expect(find(snap.root, (e) => e.attrs['data-cobrowse-placeholder'] === 'canvas' || e.attrs['data-cobrowse-canvas'] !== undefined)).toBeDefined();
  });

  it('meta refresh 와 base 는 버린다 (상담사 화면을 다른 곳으로 보낼 수 있다)', () => {
    const doc = customerPage('');
    doc.head.innerHTML = '<meta http-equiv="refresh" content="0;url=https://evil"><base href="https://evil/"><meta charset="utf-8">';
    const snap = serializeDocument(doc, ctx(doc));
    expect(find(snap.root, (e) => e.tag === 'base')).toBeUndefined();
    expect(find(snap.root, (e) => e.tag === 'meta' && e.attrs['http-equiv'] !== undefined)).toBeUndefined();
    expect(find(snap.root, (e) => e.tag === 'meta')).toBeDefined();
  });

  it('SVG 는 네임스페이스 표시를 남긴다', () => {
    const doc = customerPage('<svg width="10" height="10"><circle r="5"></circle></svg>');
    const snap = serializeDocument(doc, ctx(doc));
    expect(find(snap.root, (e) => e.tag === 'circle')!.ns).toBe('svg');
  });
});
