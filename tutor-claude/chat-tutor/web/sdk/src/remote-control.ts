/**
 * 고객 쪽: 상담사의 원격 명령(클릭·입력·스크롤·강조)을 실제 페이지에 적용한다 (17장).
 *
 * 안전장치 (고객 보호):
 *  1. 고객이 동의(enabled=true)했을 때만 — 서버도 검사하지만 고객 브라우저에서 한 번 더
 *  2. 마스킹된 필드(비밀번호·카드번호)에는 입력 불가, data-cobrowse-no-remote 요소는 클릭 불가
 *  3. 명령 종류는 화이트리스트 — "임의 스크립트 실행" 같은 명령은 존재하지 않는다
 *
 * 에코 방지:
 *  - 입력 적용 후 dispatchEvent 로 만든 이벤트는 isTrusted=false → Recorder 가 무시
 *  - 대신 "적용 결과"를 ack 프레임(cmdId 포함)으로 보낸다 → 상담사는 자기 명령의 결과임을 안다
 *  - 스크롤은 EchoGuard 에 "방금 원격으로 적용함"을 기록 → 돌아오는 scroll 이벤트를 걸러 낸다
 */
import type { Command, Frame } from './protocol.ts';
import type { Recorder } from './recorder.ts';
import { IGNORE_ATTR } from './serializer.ts';
import { isFormField, isMasked, maskText } from './masking.ts';

export class RemoteControl {
  enabled = false;
  private highlightBox: HTMLElement | null = null;

  constructor(
    private readonly doc: Document,
    private readonly recorder: Recorder,
    private readonly sendFrame: (f: Frame) => void,
  ) {}

  apply(cmd: Command): void {
    if (cmd.type === 'resync') return; // customer.ts 가 처리
    const ack = (ok: boolean, reason?: string, extra: Partial<Extract<Frame, { type: 'ack' }>> = {}) =>
      this.sendFrame({ type: 'ack', cmdId: cmd.cmdId, ok, reason, ...extra });

    if (!this.enabled && cmd.type !== 'highlight') return ack(false, '고객이 원격 조작을 허용하지 않음');

    const node = this.recorder.ids.nodeOf(cmd.id);
    if (cmd.type === 'scroll' && cmd.id === 0) {
      this.recorder.echo.markApplied('scroll:0', [cmd.x, cmd.y]);
      this.doc.defaultView?.scrollTo(cmd.x, cmd.y);
      return ack(true);
    }
    if (!(node instanceof this.doc.defaultView!.Element)) return ack(false, '대상 요소 없음 (화면이 바뀌었을 수 있음)');
    const el = node as HTMLElement;

    switch (cmd.type) {
      case 'highlight':
        this.highlight(el);
        return ack(true);
      case 'click':
        if (el.closest('[data-cobrowse-no-remote]')) return ack(false, '원격 클릭 금지 요소');
        el.click(); // 브라우저 기본 동작(링크 이동, 체크박스 토글, 버튼 submit)까지 일어난다
        return ack(true);
      case 'input': {
        if (!isFormField(el)) return ack(false, '입력 요소가 아님');
        if (isMasked(el, this.recorder.mask)) return ack(false, '보호된 입력란');
        const input = el as HTMLInputElement;
        if (cmd.checked !== undefined) input.checked = cmd.checked;
        if (cmd.value !== undefined) setNativeValue(input, cmd.value);
        // 페이지의 프레임워크(React/Vue)가 값 변화를 알아채도록 이벤트를 쏴 준다 (isTrusted=false)
        input.dispatchEvent(new (this.doc.defaultView!.Event)('input', { bubbles: true }));
        input.dispatchEvent(new (this.doc.defaultView!.Event)('change', { bubbles: true }));
        // 적용 "결과"를 돌려준다 — 페이지가 값을 바꿨을 수도 있다(예: 대문자 변환, 글자 수 제한)
        const value = input.type === 'checkbox' || input.type === 'radio' ? undefined : input.value;
        return ack(true, undefined, {
          id: cmd.id,
          value: value === undefined ? undefined : isMasked(el, this.recorder.mask) ? maskText(value) : value,
          checked: input.type === 'checkbox' || input.type === 'radio' ? input.checked : undefined,
        });
      }
      case 'scroll':
        this.recorder.echo.markApplied(`scroll:${cmd.id}`, [cmd.x, cmd.y]);
        el.scrollLeft = cmd.x;
        el.scrollTop = cmd.y;
        return ack(true);
    }
  }

  /** 상담사가 "여기요" 하고 가리킨 요소에 테두리. 이 상자는 Recorder 가 무시한다(IGNORE_ATTR). */
  private highlight(el: Element): void {
    const r = el.getBoundingClientRect();
    if (!this.highlightBox) {
      this.highlightBox = this.doc.createElement('div');
      this.highlightBox.setAttribute(IGNORE_ATTR, '');
      Object.assign(this.highlightBox.style, {
        position: 'fixed', pointerEvents: 'none', border: '3px solid #ff5722', borderRadius: '6px',
        zIndex: '2147483647', transition: 'all .15s',
      });
      this.doc.body.appendChild(this.highlightBox);
    }
    Object.assign(this.highlightBox.style, {
      left: `${r.left - 4}px`, top: `${r.top - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px`, display: 'block',
    });
    const box = this.highlightBox;
    setTimeout(() => (box.style.display = 'none'), 2500);
  }
}

/**
 * React 같은 프레임워크는 input.value 의 setter 를 가로채 "자기가 아는 값"과 비교한다.
 * 그냥 el.value = v 하면 React 가 변화를 못 느끼고 다음 렌더링 때 옛 값으로 되돌린다.
 * 원래(프로토타입의) setter 를 직접 호출하면 이 문제를 피할 수 있다.
 */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = Object.getPrototypeOf(el) as object;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
}
