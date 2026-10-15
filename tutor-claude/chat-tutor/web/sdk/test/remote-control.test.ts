// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Recorder } from '../src/recorder.ts';
import { RemoteControl } from '../src/remote-control.ts';
import type { Frame } from '../src/protocol.ts';
import { customerPage, flush } from './helpers.ts';

function setup(body: string) {
  const doc = customerPage(body);
  const frames: Frame[] = [];
  const rec = new Recorder(doc, (f) => frames.push(f), { throttleMs: 0 });
  rec.start();
  const rc = new RemoteControl(doc, rec, (f) => frames.push(f));
  const idOf = (sel: string) => rec.ids.idOf(doc.querySelector(sel)!)!;
  const acks = () => frames.filter((f): f is Extract<Frame, { type: 'ack' }> => f.type === 'ack');
  return { doc, frames, rec, rc, idOf, acks };
}

describe('RemoteControl (17장)', () => {
  it('동의 전에는 클릭·입력을 거절하고 ack 로 이유를 알려 준다', () => {
    const { rc, idOf, acks, doc } = setup('<input id="name">');
    rc.apply({ type: 'input', cmdId: 'c1', id: idOf('#name'), value: '해킹' });
    expect((doc.getElementById('name') as HTMLInputElement).value).toBe('');
    expect(acks()[0]).toMatchObject({ cmdId: 'c1', ok: false });
  });

  it('입력 명령: 값을 넣고, 페이지가 알아채도록 이벤트를 쏘고, 결과를 ack 로 돌려준다', async () => {
    const { rc, idOf, acks, doc, frames } = setup('<input id="name">');
    const input = doc.getElementById('name') as HTMLInputElement;
    // 페이지 스크립트가 입력을 대문자로 바꾼다고 하자
    input.addEventListener('input', () => (input.value = input.value.toUpperCase()));
    rc.enabled = true;
    rc.apply({ type: 'input', cmdId: 'c2', id: idOf('#name'), value: 'kim' });
    await flush();

    expect(input.value).toBe('KIM');
    expect(acks().at(-1)).toMatchObject({ cmdId: 'c2', ok: true, value: 'KIM' }); // 상담사는 "실제 결과"를 받는다
    // 합성 이벤트는 isTrusted=false → Recorder 가 input 프레임을 따로 만들지 않는다 (메아리 없음)
    expect(frames.filter((f) => f.type === 'input')).toHaveLength(0);
  });

  it('비밀번호 같은 보호 필드에는 원격 입력 불가', () => {
    const { rc, idOf, acks } = setup('<input type="password" id="pw">');
    rc.enabled = true;
    rc.apply({ type: 'input', cmdId: 'c3', id: idOf('#pw'), value: '1234' });
    expect(acks()[0]).toMatchObject({ ok: false, reason: '보호된 입력란' });
  });

  it('클릭 명령은 실제 click 을 일으킨다. 금지 요소는 거절', () => {
    const { rc, idOf, acks, doc } = setup('<button id="ok">확인</button><button id="pay" data-cobrowse-no-remote>결제</button>');
    let clicked = '';
    doc.addEventListener('click', (e) => (clicked += (e.target as Element).id));
    rc.enabled = true;
    rc.apply({ type: 'click', cmdId: 'c4', id: idOf('#ok') });
    rc.apply({ type: 'click', cmdId: 'c5', id: idOf('#pay') });
    expect(clicked).toBe('ok');
    expect(acks().map((a) => a.ok)).toEqual([true, false]);
  });

  it('강조(highlight)는 동의 없이도 가능하고, 그 상자는 화면 프레임에 포함되지 않는다', async () => {
    const { rc, idOf, frames } = setup('<p id="t">여기</p>');
    rc.apply({ type: 'highlight', cmdId: 'c6', id: idOf('#t') });
    await flush();
    expect(frames.filter((f) => f.type === 'mutation')).toHaveLength(0);
  });

  it('스크롤 명령은 EchoGuard 에 기록된다 → 돌아오는 scroll 이벤트를 보내지 않게', () => {
    const { rc, rec } = setup('<div style="height:3000px"></div>');
    rc.enabled = true;
    rc.apply({ type: 'scroll', cmdId: 'c7', id: 0, x: 0, y: 400 });
    expect(rec.echo.isEcho('scroll:0', [0, 400])).toBe(true);
  });
});
