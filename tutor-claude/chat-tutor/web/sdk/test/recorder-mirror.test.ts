// @vitest-environment jsdom
/**
 * 왕복(round-trip) 테스트: 고객 문서를 바꿔 가며 Recorder → Mirror 를 거친 상담사 문서가
 * 원본과 "똑같아지는지" 확인한다. 15장의 까다로운 경우(형제 순서, 같은 배치 안 추가 후 삭제, 이동)를 포함.
 */
import { describe, expect, it } from 'vitest';
import { Recorder } from '../src/recorder.ts';
import { Mirror } from '../src/mirror.ts';
import type { Frame } from '../src/protocol.ts';
import { agentFrame, bodyHtml, customerPage, flush } from './helpers.ts';

function setup(body: string) {
  const src = customerPage(body);
  const dst = agentFrame();
  const frames: Frame[] = [];
  const mirror = new Mirror(() => dst);
  const rec = new Recorder(src, (f) => {
    frames.push(f);
    mirror.apply(f);
  }, { throttleMs: 0 });
  rec.start();
  return { src, dst, frames, mirror, rec };
}

describe('Recorder → Mirror 왕복', () => {
  it('스냅샷만으로 같은 화면이 된다', () => {
    const { src, dst } = setup('<h1 class="t">상품</h1><ul><li>A</li><li>B</li></ul>');
    expect(bodyHtml(dst)).toBe(bodyHtml(src));
    expect(dst.compatMode).toBe('CSS1Compat'); // 표준 모드
  });

  it('추가·삭제·속성·텍스트 변경이 반영된다', async () => {
    const { src, dst, frames } = setup('<ul id="list"><li>A</li></ul><p id="p">old</p>');
    const list = src.getElementById('list')!;
    const li = src.createElement('li');
    li.textContent = 'B';
    list.appendChild(li);
    src.getElementById('p')!.className = 'changed';
    src.getElementById('p')!.firstChild!.textContent = 'new';
    list.firstElementChild!.remove();
    await flush();

    expect(frames.filter((f) => f.type === 'mutation')).toHaveLength(1); // 한 배치로 묶여 온다
    expect(bodyHtml(dst)).toBe(bodyHtml(src));
  });

  it('같은 배치에서 앞에 끼워 넣기를 연속으로 해도 순서가 맞다', async () => {
    const { src, dst } = setup('<div id="box"><span>X</span></div>');
    const box = src.getElementById('box')!;
    const a = src.createElement('b');
    a.textContent = 'A';
    box.insertBefore(a, box.firstChild); // [A, X]
    const b = src.createElement('i');
    b.textContent = 'B';
    box.insertBefore(b, a); // [B, A, X]
    const c = src.createElement('u');
    c.textContent = 'C';
    a.after(c); // [B, A, C, X]
    await flush();
    expect(bodyHtml(dst)).toBe(bodyHtml(src));
  });

  it('추가했다가 같은 배치에서 지운 노드는 보내지 않는다', async () => {
    const { src, dst, frames } = setup('<div id="box"></div>');
    const tmp = src.createElement('p');
    src.getElementById('box')!.appendChild(tmp);
    tmp.remove();
    await flush();
    expect(frames.filter((f) => f.type === 'mutation')).toHaveLength(0);
    expect(bodyHtml(dst)).toBe(bodyHtml(src));
  });

  it('노드 이동(삭제 후 다른 곳에 추가)', async () => {
    const { src, dst } = setup('<div id="a"><p id="m">이동</p></div><div id="b"></div>');
    src.getElementById('b')!.appendChild(src.getElementById('m')!);
    await flush();
    expect(bodyHtml(dst)).toBe(bodyHtml(src));
    // 이동한 노드에 이후 변경이 와도 반영된다 (새 번호로 다시 등록됐으므로)
    src.getElementById('m')!.setAttribute('data-x', '1');
    await flush();
    expect(bodyHtml(dst)).toBe(bodyHtml(src));
  });

  it('여러 번 연속 변경을 해도 끝까지 일치한다 (간단한 퍼징)', async () => {
    const { src, dst } = setup('<div id="root"></div>');
    const root = src.getElementById('root')!;
    let seed = 42;
    const rand = (n: number) => (seed = (seed * 1103515245 + 12345) % 2 ** 31) % n;
    for (let round = 0; round < 30; round++) {
      for (let k = 0; k < 5; k++) {
        const all = [root, ...Array.from(root.querySelectorAll('*'))];
        const target = all[rand(all.length)]!;
        const op = rand(4);
        if (op === 0 || all.length < 3) {
          const el = src.createElement(['div', 'span', 'p'][rand(3)]!);
          el.textContent = `n${round}-${k}`;
          target.insertBefore(el, target.childNodes[rand(target.childNodes.length + 1)] ?? null);
        } else if (op === 1 && target !== root) {
          target.remove();
        } else if (op === 2) {
          target.setAttribute('data-r', String(rand(100)));
        } else if (target !== root) {
          const dest = all[rand(all.length)]!;
          if (!target.contains(dest)) dest.appendChild(target);
        }
      }
      await flush();
      expect(bodyHtml(dst)).toBe(bodyHtml(src));
    }
  });

  it('입력값(property)은 MutationObserver 가 아니라 input 이벤트로 전달된다', async () => {
    const { src, dst, frames, rec } = setup('<input id="q">');
    const input = src.getElementById('q') as HTMLInputElement;
    input.value = '검색어';
    await flush();
    expect(frames.filter((f) => f.type === 'mutation')).toHaveLength(0); // value 프로퍼티 변경은 DOM 변경이 아니다!

    // 실제 사용자 입력(isTrusted=true)은 테스트에서 만들 수 없으므로, 이벤트 처리 함수가 부르는 메서드를 직접 부른다
    rec.recordInput(input);
    // 반대로 스크립트가 만든 이벤트(isTrusted=false)는 무시된다 → 에코 방지 (17장)
    const before = frames.length;
    input.dispatchEvent(new src.defaultView!.Event('input', { bubbles: true }));
    expect(frames.length).toBe(before);
    expect((dst.getElementById('q') as HTMLInputElement).value).toBe('검색어');
  });

  it('SDK 오버레이(data-cobrowse-ignore)는 보내지 않는다', async () => {
    const { src, dst, frames } = setup('<p>본문</p>');
    const box = src.createElement('div');
    box.setAttribute('data-cobrowse-ignore', '');
    src.body.appendChild(box);
    box.style.left = '10px';
    await flush();
    expect(frames.filter((f) => f.type === 'mutation')).toHaveLength(0);
    expect(dst.body.innerHTML).not.toContain('data-cobrowse-ignore');
  });
});
