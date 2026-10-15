import { describe, expect, it } from 'vitest';
import { ScrollSync } from '@ex/08-echo-guard.ts';

describe('연습 08 에코 방지', () => {
  it('원격 적용 직후 같은 값의 이벤트는 보내지 않는다', () => {
    const s = new ScrollSync(300);
    s.applyRemote(500, 0);
    expect(s.position).toBe(500);
    expect(s.onLocalScroll(500, 10)).toBeNull();
  });
  it('사용자가 다른 위치로 움직이면 보낸다', () => {
    const s = new ScrollSync(300);
    s.applyRemote(500, 0);
    expect(s.onLocalScroll(520, 10)).toBe(520);
  });
  it('시간이 지나면 같은 값이어도 사용자 동작으로 본다', () => {
    const s = new ScrollSync(300);
    s.applyRemote(500, 0);
    expect(s.onLocalScroll(500, 301)).toBe(500);
  });
  it('양쪽을 이어 붙여도 메시지가 무한히 오가지 않는다', () => {
    const a = new ScrollSync(300);
    const b = new ScrollSync(300);
    let messages = 0;
    let pending: Array<{ to: ScrollSync; y: number }> = [];
    const send = (to: ScrollSync, y: number | null) => y !== null && (messages++, pending.push({ to, y }));
    send(b, a.onLocalScroll(100, 0)); // 사용자가 A 를 스크롤
    for (let t = 1; t < 10 && pending.length; t++) {
      const batch = pending;
      pending = [];
      for (const { to, y } of batch) {
        to.applyRemote(y, t);
        send(to === a ? b : a, to.onLocalScroll(y, t)); // 적용하면 그쪽에서 scroll 이벤트가 난다
      }
    }
    expect(messages).toBe(1);
  });
});
