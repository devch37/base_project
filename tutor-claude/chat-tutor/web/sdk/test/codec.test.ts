import { describe, expect, it, vi } from 'vitest';
import { Decoder, encode } from '../src/codec.ts';
import { FrameSequencer } from '../src/sequencer.ts';
import { utf8Bytes, toBase64, toUtf8 } from '../src/bytes.ts';
import type { Frame, Wire } from '../src/protocol.ts';

const seq = new FrameSequencer();
const bigText = (n: number) => Array.from({ length: n }, (_, i) => `<div class="item-${i % 7}">상품 ${i}</div>`).join('');

describe('바이트·base64 (14장)', () => {
  it('문자 수와 UTF-8 바이트 수는 다르다', () => {
    expect('가나다'.length).toBe(3);
    expect(utf8Bytes('가나다')).toBe(9);
    expect(utf8Bytes('😀')).toBe(4);
    expect('😀'.length).toBe(2); // JS 문자열은 UTF-16 — 이모지는 2칸
  });

  it('base64 는 약 33% 커진다', () => {
    const bytes = toUtf8('x'.repeat(3000));
    expect(toBase64(bytes).length).toBe(4000);
  });
});

describe('encode/Decoder (18장)', () => {
  it('작은 프레임은 그대로(f), 큰 프레임은 압축(z)', async () => {
    const small = await encode(seq.wrap({ type: 'pointer', x: 1, y: 2 }));
    expect(small).toHaveLength(1);
    expect((JSON.parse(small[0]!) as Wire).k).toBe('f');

    const frame: Frame = { type: 'mutation', ops: [{ op: 'text', id: 1, text: bigText(300) }] };
    const packed = await encode(seq.wrap(frame));
    expect((JSON.parse(packed[0]!) as Wire).k).toBe('z');
    expect(packed[0]!.length).toBeLessThan(utf8Bytes(JSON.stringify(frame)) / 3); // 반복이 많아 잘 줄어든다
  });

  it('한도를 넘으면 조각내고, 순서가 섞여 도착해도 복원된다', async () => {
    // 압축이 잘 안 되는 무작위 데이터
    const noise = Array.from({ length: 60_000 }, () => Math.random().toString(36).slice(2, 3)).join('');
    const env = seq.wrap({ type: 'mutation', ops: [{ op: 'text', id: 1, text: noise }] });
    const parts = await encode(env, { compressThreshold: 1024, maxMessageBytes: 8 * 1024 });
    expect(parts.length).toBeGreaterThan(2);
    parts.forEach((p) => expect(utf8Bytes(p)).toBeLessThanOrEqual(8 * 1024));

    const dec = new Decoder();
    const shuffled = [...parts].reverse();
    let result = null;
    for (const p of shuffled) result = (await dec.accept(p)) ?? result;
    expect(result).toEqual(env);
    expect(dec.pendingTransfers).toBe(0);
  });

  it('같은 조각이 두 번 와도 한 번만 쓴다', async () => {
    const noise = Array.from({ length: 30_000 }, () => Math.random().toString(36).slice(2, 3)).join('');
    const env = seq.wrap({ type: 'mutation', ops: [{ op: 'text', id: 1, text: noise }] });
    const parts = await encode(env, { compressThreshold: 1024, maxMessageBytes: 4 * 1024 });
    const dec = new Decoder();
    const results = [];
    for (const p of [parts[0]!, parts[0]!, ...parts.slice(1)]) {
      const r = await dec.accept(p);
      if (r) results.push(r);
    }
    expect(results).toHaveLength(1);
  });

  it('조각이 끝내 안 오면 타임아웃으로 버리고 알린다', async () => {
    vi.useFakeTimers();
    const onDrop = vi.fn();
    const dec = new Decoder({ timeoutMs: 1000, onDrop });
    await dec.accept(JSON.stringify({ k: 'c', id: 't1', i: 0, n: 3, d: 'AAAA' }));
    vi.advanceTimersByTime(1001);
    expect(onDrop).toHaveBeenCalledWith('t1', 'timeout');
    expect(dec.pendingTransfers).toBe(0);
    vi.useRealTimers();
  });

  it('동시 조립 개수 한도를 넘는 조각은 거절한다 (메모리 보호)', async () => {
    const onDrop = vi.fn();
    const dec = new Decoder({ maxTransfers: 2, onDrop });
    for (const id of ['a', 'b', 'c']) await dec.accept(JSON.stringify({ k: 'c', id, i: 0, n: 2, d: 'AA' }));
    expect(onDrop).toHaveBeenCalledWith('c', 'overflow');
    dec.dispose();
  });

  it('한글이 많은 프레임은 글자 수가 아니라 바이트로 판단한다', async () => {
    // 1500자 × 3바이트 = 4500바이트 → 기준(2048) 초과로 압축돼야 한다
    const parts = await encode(seq.wrap({ type: 'mutation', ops: [{ op: 'text', id: 1, text: '가'.repeat(1500) }] }));
    expect((JSON.parse(parts[0]!) as Wire).k).toBe('z');
  });
});
