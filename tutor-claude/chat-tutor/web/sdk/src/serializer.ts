/**
 * DOM → JSON 직렬화 (15장·16장).
 *
 * "화면을 보낸다"는 것은 픽셀(영상)을 보내는 게 아니라 DOM 구조를 보내는 것이다.
 *   장점: 영상보다 훨씬 작고, 상담사 쪽에서 글자가 선명하며, 특정 요소만 가릴(마스킹) 수 있다.
 *   단점: CSS·이미지·폰트를 상담사 브라우저가 "다시 내려받아" 그려야 하고(16장),
 *         canvas·video·cross-origin iframe 처럼 DOM 에 내용이 없는 것은 보낼 수 없다.
 */
import type { SerializedElement, SerializedNode, SnapshotData } from './protocol.ts';
import { NodeIds } from './node-ids.ts';
import { isBlocked, isFormField, isMasked, maskText, type MaskOptions } from './masking.ts';
import { DROP_TAGS, absolutizeCss, absolutizeUrl, isDangerousMeta, sanitizeAttribute } from './sanitize.ts';

export const IGNORE_ATTR = 'data-cobrowse-ignore'; // SDK 자신이 그리는 오버레이 등은 보내지 않는다

export interface SerializeContext {
  ids: NodeIds;
  mask: MaskOptions;
  base: string; // 상대 URL 해석 기준 (document.baseURI)
  /** 같은 출처(same-origin) 스타일시트를 <style> 로 인라인할지 */
  inlineStylesheets: boolean;
}

export function serializeDocument(doc: Document, ctx: SerializeContext): SnapshotData {
  const root = serializeNode(doc.documentElement, ctx);
  if (!root || root.t !== 'el') throw new Error('documentElement 직렬화 실패');
  const win = doc.defaultView;
  return {
    root,
    url: doc.location?.href ?? ctx.base,
    viewport: { w: win?.innerWidth ?? 0, h: win?.innerHeight ?? 0 },
    scroll: { x: win?.scrollX ?? 0, y: win?.scrollY ?? 0 },
  };
}

/** 노드 하나(와 자손)를 직렬화. 보내지 않을 노드면 null. */
export function serializeNode(node: Node, ctx: SerializeContext): SerializedNode | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    let text = node.textContent ?? '';
    // <style> 안의 텍스트는 CSS 이므로 URL 을 절대화하고, 마스킹하지 않는다
    if (parent?.tagName.toLowerCase() === 'style') text = absolutizeCss(text, ctx.base);
    else if (parent && isMasked(parent, ctx.mask)) text = maskText(text);
    return { id: ctx.ids.assign(node), t: 'text', text };
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null; // 주석·처리 명령 등은 화면에 안 보이므로 생략
  return serializeElement(node as Element, ctx);
}

function serializeElement(el: Element, ctx: SerializeContext): SerializedElement | null {
  const tag = el.tagName.toLowerCase();
  if (DROP_TAGS.has(tag) || isDangerousMeta(el) || el.hasAttribute(IGNORE_ATTR)) return null;

  const id = ctx.ids.assign(el);

  if (isBlocked(el, ctx.mask)) return placeholder(id, el, 'blocked');
  if (tag === 'iframe') return placeholder(id, el, 'iframe'); // 다른 출처 iframe 은 내용을 읽을 수 없다(16장)
  if (tag === 'canvas') return serializeCanvas(id, el as HTMLCanvasElement);
  if (tag === 'link') return serializeLink(id, el as HTMLLinkElement, ctx);

  const out: SerializedElement = { id, t: 'el', tag, attrs: attributesOf(el, ctx), children: [] };
  if (el.namespaceURI === 'http://www.w3.org/2000/svg') out.ns = 'svg';

  if (isFormField(el)) captureFormState(el, out, ctx);

  if (tag === 'style') {
    out.children.push(...styleChildren(el as HTMLStyleElement, ctx));
    return out;
  }

  el.childNodes.forEach((child) => {
    const s = serializeNode(child, ctx);
    if (s) out.children.push(s);
  });
  return out;
}

export function attributesOf(el: Element, ctx: SerializeContext): Record<string, string> {
  const attrs: Record<string, string> = {};
  const masked = isFormField(el) && isMasked(el, ctx.mask);
  for (const a of Array.from(el.attributes)) {
    const v = sanitizeAttribute(a.name, a.value, ctx.base);
    if (v === null) continue;
    attrs[a.name] = masked && a.name === 'value' ? maskText(v) : v;
  }
  return attrs;
}

/**
 * 폼 요소의 "현재 값".
 * 함정: <input value="초기값"> 의 attribute 는 사용자가 타이핑해도 안 바뀐다.
 * 화면에 보이는 값은 element.value (property) 다. 그래서 attribute 와 별도로 담는다.
 */
function captureFormState(el: Element, out: SerializedElement, ctx: SerializeContext): void {
  const masked = isMasked(el, ctx.mask);
  if (el instanceof el.ownerDocument.defaultView!.HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') out.checked = el.checked;
    else if (el.type !== 'file') out.value = masked ? maskText(el.value) : el.value;
  } else if (el instanceof el.ownerDocument.defaultView!.HTMLTextAreaElement) {
    out.value = masked ? maskText(el.value) : el.value;
  } else if (el instanceof el.ownerDocument.defaultView!.HTMLSelectElement) {
    out.value = el.value; // 선택지 자체는 이미 화면에 있는 정보라 가리지 않는다
  }
}

/**
 * <style> 내용. CSS-in-JS 라이브러리는 빈 <style> 에 insertRule() 로 규칙을 넣는다.
 * 이 경우 textContent 가 비어 있으므로 CSSOM(sheet.cssRules)에서 꺼낸다.
 * (그리고 insertRule 은 MutationObserver 에 잡히지 않는다 — 고급 주제 참고)
 */
function styleChildren(el: HTMLStyleElement, ctx: SerializeContext): SerializedNode[] {
  let css = el.textContent ?? '';
  if (css.trim() === '' && el.sheet) {
    try {
      css = Array.from(el.sheet.cssRules).map((r) => r.cssText).join('\n');
    } catch {
      /* 접근 불가면 빈 채로 */
    }
  }
  // 자식 텍스트 노드 id 를 유지해야 이후 text 변경(mutation)을 반영할 수 있다
  const first = el.firstChild;
  const textId = first ? ctx.ids.assign(first) : ctx.ids.assign(el.ownerDocument.createTextNode(''));
  return [{ id: textId, t: 'text', text: absolutizeCss(css, ctx.base) }];
}

/**
 * <link rel=stylesheet>: 같은 출처면 CSS 를 직접 읽어 <style> 로 바꿔 보낸다.
 *  - 이유: 고객 사이트의 CSS 가 로그인 쿠키가 있어야 받을 수 있는 주소라면 상담사 브라우저는 못 받는다.
 *  - 다른 출처(CDN) CSS 는 브라우저 보안상 cssRules 를 읽을 수 없다(SecurityError) → 주소만 보낸다.
 */
function serializeLink(id: number, el: HTMLLinkElement, ctx: SerializeContext): SerializedElement | null {
  const rel = (el.getAttribute('rel') ?? '').toLowerCase();
  if (!rel.includes('stylesheet')) {
    if (rel.includes('icon')) return { id, t: 'el', tag: 'link', attrs: attributesOf(el, ctx), children: [] };
    return null; // preload, manifest 등은 화면 재현에 불필요
  }
  if (ctx.inlineStylesheets && el.sheet) {
    try {
      const css = Array.from(el.sheet.cssRules).map((r) => r.cssText).join('\n');
      const sheetBase = el.href || ctx.base; // 외부 CSS 안의 url() 은 "CSS 파일 위치" 기준이다
      return {
        id,
        t: 'el',
        tag: 'style',
        attrs: { 'data-cobrowse-from': absolutizeUrl(el.getAttribute('href') ?? '', ctx.base) },
        children: [{ id: ctx.ids.assign(el.ownerDocument.createTextNode('')), t: 'text', text: absolutizeCss(css, sheetBase) }],
      };
    } catch {
      /* cross-origin → 아래로 */
    }
  }
  return { id, t: 'el', tag: 'link', attrs: attributesOf(el, ctx), children: [] };
}

/** canvas 는 DOM 이 아니라 "픽셀"이다. 스냅샷 시점의 그림을 이미지로 찍어 보낸다(이후 변경은 안 따라감). */
function serializeCanvas(id: number, el: HTMLCanvasElement): SerializedElement {
  const size = `width:${el.width}px;height:${el.height}px`;
  try {
    const url = el.toDataURL('image/png');
    if (url.length < 200_000) {
      return { id, t: 'el', tag: 'img', attrs: { src: url, style: size, 'data-cobrowse-canvas': '' }, children: [] };
    }
  } catch {
    // 다른 출처 이미지를 그린 canvas(tainted)는 읽을 수 없다. jsdom 처럼 canvas 미구현 환경도 여기로.
  }
  return { id, t: 'el', tag: 'div', attrs: { 'data-cobrowse-placeholder': 'canvas', style: size + placeholderStyle }, children: [] };
}

const placeholderStyle = ';background:repeating-linear-gradient(45deg,#ddd,#ddd 8px,#eee 8px,#eee 16px);display:inline-block';

function placeholder(id: number, el: Element, kind: string): SerializedElement {
  const r = el.getBoundingClientRect();
  const style = `width:${Math.round(r.width)}px;height:${Math.round(r.height)}px` + placeholderStyle;
  return { id, t: 'el', tag: 'div', attrs: { 'data-cobrowse-placeholder': kind, style }, children: [] };
}
