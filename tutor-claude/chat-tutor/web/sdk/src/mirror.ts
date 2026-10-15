/**
 * 상담사 쪽: 받은 프레임으로 고객 화면을 iframe 안에 "다시 그린다" (16장).
 *
 * 왜 iframe 인가?
 *   고객 페이지의 CSS 가 상담사 콘솔의 CSS 와 섞이면 둘 다 깨진다(예: body { font-size: 30px }).
 *   iframe 은 별도의 문서라 스타일·DOM 이 완전히 분리된다.
 *
 * 왜 sandbox="allow-same-origin" 만 주나? (22장)
 *   - allow-scripts 없음 → 혹시 스크립트가 섞여 들어와도 실행되지 않는다
 *   - allow-forms/allow-top-navigation 없음 → 폼 전송·상위 창 이동 불가
 *   - allow-same-origin 은 "상담사 콘솔 JS 가 iframe 안 DOM 을 만들기" 위해 필요
 *     (allow-scripts 와 allow-same-origin 을 "같이" 주면 iframe 이 sandbox 를 스스로 풀 수 있으니 절대 금지)
 */
import type { Frame, MutationOp, SerializedElement, SerializedNode, SnapshotData } from './protocol.ts';
import { NodeIds } from './node-ids.ts';
import { DROP_TAGS, sanitizeAttribute } from './sanitize.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class Mirror {
  ids = new NodeIds();
  snapshot: SnapshotData | null = null;
  /** 적용에 실패한 연산 수 — 0 이 아니면 화면이 어긋났을 수 있다 → 재동기화 신호 */
  errors = 0;

  constructor(
    private readonly getDocument: () => Document,
    private readonly onError: (reason: string) => void = () => {},
  ) {}

  static forIframe(iframe: HTMLIFrameElement, onError?: (reason: string) => void): Mirror {
    return new Mirror(() => iframe.contentDocument!, onError);
  }

  get document(): Document {
    return this.getDocument();
  }

  apply(frame: Frame): void {
    switch (frame.type) {
      case 'snapshot':
        return this.applySnapshot(frame.data);
      case 'mutation':
        return frame.ops.forEach((op) => this.applyOp(op));
      case 'input':
        return this.applyInput(frame.id, frame.value, frame.checked);
      case 'scroll':
        return this.applyScroll(frame.id, frame.x, frame.y);
      default:
        return; // viewport·pointer·ack 은 화면 DOM 이 아니라 콘솔(agent.ts)이 처리
    }
  }

  applySnapshot(data: SnapshotData): void {
    const doc = this.document;
    this.ids = new NodeIds();
    this.errors = 0;
    this.snapshot = data;
    // 표준 모드(<!DOCTYPE html>)로 시작해야 고객 화면과 같은 레이아웃 규칙이 적용된다 (quirks 모드 방지)
    doc.open();
    doc.write('<!DOCTYPE html><html></html>');
    doc.close();
    const html = this.build(data.root, doc);
    if (html) doc.replaceChild(html, doc.documentElement);
    doc.defaultView?.scrollTo(data.scroll.x, data.scroll.y);
  }

  applyOp(op: MutationOp): void {
    try {
      switch (op.op) {
        case 'add': {
          const parent = this.ids.nodeOf(op.parentId);
          if (!parent) throw new Error(`부모 ${op.parentId} 없음`);
          const node = this.build(op.node, this.document);
          if (!node) return;
          const before = op.beforeId === null ? null : (this.ids.nodeOf(op.beforeId) ?? null);
          parent.insertBefore(node, before && before.parentNode === parent ? before : null);
          return;
        }
        case 'remove': {
          const node = this.ids.nodeOf(op.id);
          if (!node) return; // 이미 없음 — 중복 수신이어도 안전(멱등)
          node.parentNode?.removeChild(node);
          this.ids.forget(node);
          return;
        }
        case 'attr': {
          const el = this.ids.nodeOf(op.id) as Element | undefined;
          if (!el) throw new Error(`노드 ${op.id} 없음`);
          if (op.value === null) el.removeAttribute(op.name);
          else {
            const v = sanitizeAttribute(op.name, op.value, this.base());
            if (v !== null) el.setAttribute(op.name, v);
          }
          return;
        }
        case 'text': {
          const node = this.ids.nodeOf(op.id);
          if (!node) throw new Error(`텍스트 ${op.id} 없음`);
          node.textContent = op.text;
          return;
        }
      }
    } catch (e) {
      this.errors++;
      this.onError(`연산 실패: ${(e as Error).message}`);
    }
  }

  applyInput(id: number, value?: string, checked?: boolean): void {
    const el = this.ids.nodeOf(id) as HTMLInputElement | undefined;
    if (!el) return;
    if (checked !== undefined) el.checked = checked;
    if (value !== undefined) el.value = value; // property 로! (attribute 로 하면 화면 값이 안 바뀐다)
  }

  applyScroll(id: number, x: number, y: number): void {
    if (id === 0) {
      this.document.defaultView?.scrollTo(x, y);
      return;
    }
    const el = this.ids.nodeOf(id) as Element | undefined;
    if (el) {
      el.scrollLeft = x;
      el.scrollTop = y;
    }
  }

  /** 상담사가 클릭한 요소 → 고객 쪽 노드 번호 */
  idOf(node: Node): number | undefined {
    return this.ids.idOf(node);
  }

  nodeOf(id: number): Node | undefined {
    return this.ids.nodeOf(id);
  }

  private base(): string {
    return this.snapshot?.url ?? 'about:blank';
  }

  /**
   * 직렬화된 노드 → 실제 DOM. innerHTML 을 쓰지 않는다.
   * innerHTML 은 문자열을 "HTML 로 해석"하므로 <img onerror=...> 같은 것이 그대로 살아난다.
   * createElement + setAttribute(정리된 값만) 로 한 땀씩 만드는 것이 안전하다.
   */
  private build(s: SerializedNode, doc: Document): Node | null {
    if (s.t === 'text') {
      const t = doc.createTextNode(s.text);
      this.ids.set(s.id, t);
      return t;
    }
    return this.buildElement(s, doc);
  }

  private buildElement(s: SerializedElement, doc: Document): Element | null {
    const tag = s.tag.toLowerCase();
    if (DROP_TAGS.has(tag) || tag === 'iframe' || tag === 'frame') return null; // 받는 쪽에서도 다시 거른다
    if (!/^[a-z][a-z0-9-]*$/.test(tag)) return null; // 이상한 태그명 거부
    if (tag === 'meta' && s.attrs['http-equiv'] !== undefined) return null;

    const el = s.ns === 'svg' ? doc.createElementNS(SVG_NS, tag) : doc.createElement(tag);
    for (const [name, value] of Object.entries(s.attrs)) {
      const v = sanitizeAttribute(name, value, this.base());
      if (v === null) continue;
      try {
        el.setAttribute(name, v);
      } catch {
        /* 잘못된 속성명 등은 건너뛴다 */
      }
    }
    this.ids.set(s.id, el);
    for (const child of s.children) {
      const c = this.build(child, doc);
      if (c) el.appendChild(c);
    }
    if (s.value !== undefined) (el as HTMLInputElement).value = s.value;
    if (s.checked !== undefined) (el as HTMLInputElement).checked = s.checked;
    return el;
  }
}
