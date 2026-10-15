/**
 * 고객 브라우저의 화면 변화를 프레임으로 만든다 (15장).
 *
 *   스냅샷 1번 + 이후 변경분(mutation) 계속 + 입력·스크롤·포인터 이벤트
 *
 * MutationObserver 가 잡는 것 / 못 잡는 것 — 15장의 핵심 표:
 *   잡는다   : 노드 추가·삭제, 속성 변경, 텍스트 변경
 *   못 잡는다: input 에 타이핑한 값(property), 체크 상태, 스크롤 위치, 창 크기, 마우스 위치,
 *             CSSOM(insertRule), canvas 그림
 *   → 못 잡는 것들은 이벤트 리스너(input, scroll, resize, mousemove)로 따로 보낸다.
 */
import type { Frame, MutationOp } from './protocol.ts';
import { NodeIds } from './node-ids.ts';
import { IGNORE_ATTR, serializeDocument, serializeNode, type SerializeContext } from './serializer.ts';
import { isFormField, isMasked, maskText, mergeMask, type MaskOptions } from './masking.ts';
import { absolutizeCss, sanitizeAttribute } from './sanitize.ts';
import { EchoGuard } from './echo-guard.ts';

export interface RecorderOptions {
  mask?: Partial<MaskOptions>;
  inlineStylesheets?: boolean;
  /** 스크롤·포인터 이벤트를 최대 몇 ms 마다 보낼지 (너무 자주 보내면 네트워크·상담사 CPU 낭비) */
  throttleMs?: number;
  echoGuard?: EchoGuard;
}

export class Recorder {
  ids = new NodeIds();
  readonly mask: MaskOptions;
  readonly echo: EchoGuard;
  private observer: MutationObserver | null = null;
  private readonly throttleMs: number;
  private readonly inline: boolean;
  private readonly cleanups: Array<() => void> = [];
  private readonly pending = new Map<string, { timer: ReturnType<typeof setTimeout>; frame: Frame }>();

  constructor(
    private readonly doc: Document,
    private readonly emit: (frame: Frame) => void,
    opts: RecorderOptions = {},
  ) {
    this.mask = mergeMask(opts.mask);
    this.throttleMs = opts.throttleMs ?? 50;
    this.inline = opts.inlineStylesheets ?? true;
    this.echo = opts.echoGuard ?? new EchoGuard();
  }

  private ctx(): SerializeContext {
    return { ids: this.ids, mask: this.mask, base: this.doc.baseURI, inlineStylesheets: this.inline };
  }

  /** 스냅샷을 찍어 보내고 관찰을 시작한다. 다시 부르면 "새 스냅샷"부터 다시 시작한다. */
  start(): void {
    this.stop();
    this.ids = new NodeIds(); // 새 epoch → 번호도 새로. 상담사 화면도 통째로 다시 만든다.
    this.emit({ type: 'snapshot', data: serializeDocument(this.doc, this.ctx()) });

    this.observer = new (this.doc.defaultView!.MutationObserver)((records) => this.onMutations(records));
    this.observer.observe(this.doc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    this.listen();
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.cleanups.splice(0).forEach((fn) => fn());
    this.pending.forEach((p) => clearTimeout(p.timer));
    this.pending.clear();
  }

  // ── MutationObserver → 연산 목록 ─────────────────────────────────

  /**
   * 기록을 "도착 순서대로" 처리하되, 노드 상태는 "지금 DOM" 기준으로 읽는다.
   * 이렇게 하면 같은 배치 안에서 추가됐다 지워진 노드(isConnected=false)는 자연스럽게 건너뛰고,
   * 형제 순서는 "이미 번호가 있는 다음 형제" 앞에 끼우는 방식으로 맞춰진다.
   */
  onMutations(records: MutationRecord[]): void {
    const ops: MutationOp[] = [];
    for (const r of records) {
      if (this.isIgnored(r.target)) continue;

      if (r.type === 'childList') {
        r.removedNodes.forEach((n) => {
          const id = this.ids.idOf(n);
          if (id === undefined) return; // 우리가 모르는 노드(무시 대상 등)
          ops.push({ op: 'remove', id });
          this.ids.forget(n);
        });
        r.addedNodes.forEach((n) => {
          if (!n.isConnected || this.ids.has(n) || this.isIgnored(n)) return;
          const parent = n.parentNode;
          const parentId = parent ? this.ids.idOf(parent) : undefined;
          if (parentId === undefined) return; // 부모가 아직 미등록이면 부모가 추가될 때 통째로 직렬화된다
          const node = serializeNode(n, this.ctx());
          if (!node) return;
          ops.push({ op: 'add', parentId, beforeId: this.nextKnownSibling(n), node });
        });
      } else if (r.type === 'attributes') {
        const el = r.target as Element;
        const id = this.ids.idOf(el);
        if (id === undefined || !r.attributeName) continue;
        const raw = el.getAttribute(r.attributeName);
        let value = raw === null ? null : sanitizeAttribute(r.attributeName, raw, this.doc.baseURI);
        if (raw !== null && value === null) continue; // 버리는 속성(on* 등)
        if (value !== null && r.attributeName === 'value' && isFormField(el) && isMasked(el, this.mask)) value = maskText(value);
        ops.push({ op: 'attr', id, name: r.attributeName, value });
      } else if (r.type === 'characterData') {
        const id = this.ids.idOf(r.target);
        if (id === undefined) continue;
        const parent = r.target.parentElement;
        let text = r.target.textContent ?? '';
        if (parent?.tagName.toLowerCase() === 'style') text = absolutizeCss(text, this.doc.baseURI);
        else if (parent && isMasked(parent, this.mask)) text = maskText(text);
        ops.push({ op: 'text', id, text });
      }
    }
    if (ops.length > 0) this.emit({ type: 'mutation', ops });
  }

  private nextKnownSibling(n: Node): number | null {
    for (let s = n.nextSibling; s; s = s.nextSibling) {
      const id = this.ids.idOf(s);
      if (id !== undefined) return id;
    }
    return null;
  }

  private isIgnored(n: Node): boolean {
    const el = n.nodeType === Node.ELEMENT_NODE ? (n as Element) : n.parentElement;
    return !!el?.closest(`[${IGNORE_ATTR}]`);
  }

  // ── 이벤트: MutationObserver 가 못 잡는 것들 ──────────────────────

  private listen(): void {
    const doc = this.doc;
    const win = doc.defaultView!;
    const on = <K extends string>(target: EventTarget, type: K, fn: (e: Event) => void) => {
      // capture: true — 페이지 코드가 stopPropagation() 해도 우리가 먼저 본다
      target.addEventListener(type, fn, { capture: true, passive: true });
      this.cleanups.push(() => target.removeEventListener(type, fn, { capture: true }));
    };

    on(doc, 'input', (e) => this.onInput(e));
    on(doc, 'change', (e) => this.onInput(e));
    on(doc, 'scroll', (e) => this.onScroll(e)); // 스크롤은 버블링하지 않지만 capture 로는 document 에서 잡힌다
    on(win, 'resize', () => this.throttle('viewport', { type: 'viewport', w: win.innerWidth, h: win.innerHeight }));
    on(doc, 'mousemove', (e) => {
      const m = e as MouseEvent;
      this.throttle('pointer', { type: 'pointer', x: m.clientX, y: m.clientY });
    });
  }

  private onInput(e: Event): void {
    // 원격 명령이 만든 가짜(합성) 이벤트는 isTrusted=false → 보내지 않는다.
    // 결과값은 RemoteControl 이 ack 프레임으로 따로 알려 준다 (17장 에코 방지 1단계)
    if (!e.isTrusted) return;
    this.recordInput(e.target as Element);
  }

  /** 입력 요소의 현재 값을 input 프레임으로 보낸다 */
  recordInput(el: Element): void {
    const id = this.ids.idOf(el);
    if (id === undefined || !isFormField(el)) return;
    this.emit(inputFrame(el, id, this.mask));
  }

  private onScroll(e: Event): void {
    const doc = this.doc;
    const target = e.target;
    const isWindow = target === doc || target === doc.documentElement || target === doc.body;
    const id = isWindow ? 0 : this.ids.idOf(target as Node);
    if (id === undefined) return;
    const el = target as Element;
    const x = isWindow ? doc.defaultView!.scrollX : el.scrollLeft;
    const y = isWindow ? doc.defaultView!.scrollY : el.scrollTop;
    if (this.echo.isEcho(`scroll:${id}`, [x, y])) return; // 17장 에코 방지 2단계
    this.throttle(`scroll:${id}`, { type: 'scroll', id, x, y });
  }

  /**
   * 마지막 값만 보내는 throttle (trailing).
   * 스크롤 이벤트는 초당 수십~수백 번 온다. 중간값은 버리고 "마지막 위치"만 throttleMs 마다 보낸다.
   */
  private throttle(key: string, frame: Frame): void {
    const p = this.pending.get(key);
    if (p) {
      p.frame = frame;
      return;
    }
    const entry = {
      frame,
      timer: setTimeout(() => {
        this.pending.delete(key);
        this.emit(entry.frame);
      }, this.throttleMs),
    };
    this.pending.set(key, entry);
  }
}

export function inputFrame(el: Element, id: number, mask: MaskOptions): Frame {
  const masked = isMasked(el, mask);
  const input = el as HTMLInputElement;
  if (input.type === 'checkbox' || input.type === 'radio') return { type: 'input', id, checked: input.checked };
  const value = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  return { type: 'input', id, value: masked ? maskText(value) : value };
}

