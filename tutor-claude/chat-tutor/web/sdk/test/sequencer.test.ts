import { describe, expect, it, vi } from 'vitest';
import { FrameSequencer, OrderedReceiver } from '../src/sequencer.ts';
import type { FrameEnvelope } from '../src/protocol.ts';

function stream() {
  const s = new FrameSequencer();
  s.newEpoch();
  const snap = s.wrap({ type: 'snapshot', data: { root: { id: 1, t: 'el', tag: 'html', attrs: {}, children: [] }, url: '', viewport: { w: 1, h: 1 }, scroll: { x: 0, y: 0 } } });
  const m = (n: number) => s.wrap({ type: 'pointer', x: n, y: n });
  return { s, snap, m };
}

function receiver(gapTimeoutMs = 1000) {
  const got: FrameEnvelope[] = [];
  const resync = vi.fn();
  const r = new OrderedReceiver({ onFrame: (e) => got.push(e), onResyncNeeded: resync, gapTimeoutMs });
  return { r, got, resync, seqs: () => got.map((e) => e.seq) };
}

describe('OrderedReceiver (19장)', () => {
  it('순서대로 오면 그대로 적용', () => {
    const { snap, m } = stream();
    const { r, seqs } = receiver();
    [snap, m(1), m(2)].forEach((e) => r.accept(e));
    expect(seqs()).toEqual([1, 2, 3]);
  });

  it('순서가 뒤바뀌면 버퍼에 두었다가 순서대로 적용', () => {
    const { snap, m } = stream();
    const a = m(1), b = m(2), c = m(3);
    const { r, seqs } = receiver();
    [snap, c, a, b].forEach((e) => r.accept(e));
    expect(seqs()).toEqual([1, 2, 3, 4]);
    expect(r.stats.reordered).toBe(1);
  });

  it('중복은 버린다', () => {
    const { snap, m } = stream();
    const a = m(1);
    const { r, seqs } = receiver();
    [snap, a, a, a].forEach((e) => r.accept(e));
    expect(seqs()).toEqual([1, 2]);
    expect(r.stats.duplicates).toBe(2);
  });

  it('빠진 번호가 끝내 안 오면 재동기화를 "한 번만" 요청한다', () => {
    vi.useFakeTimers();
    const { snap, m } = stream();
    m(1); // 2번은 유실
    const lost3 = m(2), lost4 = m(3);
    const { r, resync } = receiver(1000);
    [snap, lost3, lost4].forEach((e) => r.accept(e));
    vi.advanceTimersByTime(1001);
    expect(resync).toHaveBeenCalledWith('gap-timeout');
    r.accept(m(4));
    vi.advanceTimersByTime(5000);
    expect(resync).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('새 스냅샷이 오면 새 epoch 로 다시 시작한다', () => {
    const first = stream();
    const second = stream();
    const { r, got } = receiver();
    [first.snap, first.m(1), second.snap, first.m(2), second.m(9)].forEach((e) => r.accept(e));
    expect(got.map((e) => `${e.epoch === second.snap.epoch ? 'B' : 'A'}${e.seq}`)).toEqual(['A1', 'A2', 'B1', 'B2']);
  });

  it('중복된 스냅샷이나 늦게 온 옛 스냅샷이 화면을 과거로 되돌리지 않는다', () => {
    const first = stream();
    const second = stream();
    const { r, got } = receiver();
    const f1 = first.m(1);
    [first.snap, f1, first.snap].forEach((e) => r.accept(e)); // 스냅샷 중복
    expect(got.map((e) => e.seq)).toEqual([1, 2]);
    r.accept(second.snap);
    r.accept(first.snap); // 이미 떠난 epoch 의 스냅샷이 늦게 도착
    expect(got.at(-1)!.epoch).toBe(second.snap.epoch);
    expect(r.stats.duplicates).toBe(2);
  });

  it('스냅샷보다 먼저 도착한 같은 epoch 변경분도 살린다', () => {
    const { snap, m } = stream();
    const a = m(1);
    const { r, seqs } = receiver();
    r.accept(a); // 스냅샷(큰 메시지)이 늦게 도착
    r.accept(snap);
    expect(seqs()).toEqual([1, 2]);
  });

  it('처음부터 스냅샷 없이 변경분만 오면 스냅샷을 요청한다 (늦게 입장한 상담사)', () => {
    const { m } = stream();
    const { r, resync } = receiver();
    r.accept(m(1));
    expect(resync).toHaveBeenCalledWith('no-snapshot');
  });
});
