import { describe, expect, it } from 'vitest';
import { Assembler, split } from '@ex/06-chunker.ts';

describe('연습 06 조각', () => {
  const text = 'ABCDEFGHIJ'.repeat(10);
  it('split', () => {
    const parts = split(text, 30, 't1');
    expect(parts.map((p) => p.d.length)).toEqual([30, 30, 30, 10]);
    expect(parts.every((p) => p.n === 4 && p.id === 't1')).toBe(true);
    expect(split('', 10, 'e')).toHaveLength(1);
  });
  it('섞인 순서 + 중복이어도 정확히 한 번 복원', () => {
    const a = new Assembler(1000);
    const parts = split(text, 30, 't1');
    const results = [parts[2]!, parts[0]!, parts[0]!, parts[3]!, parts[1]!].map((p) => a.add(p, 0)).filter(Boolean);
    expect(results).toEqual([text]);
    expect(a.pending).toBe(0);
  });
  it('여러 전송이 동시에 섞여도 각자 조립', () => {
    const a = new Assembler(1000);
    const x = split('xxxxxx', 2, 'x');
    const y = split('yyyyyy', 2, 'y');
    const out = [x[0], y[0], x[1], y[1], y[2], x[2]].map((p) => a.add(p!, 0)).filter(Boolean);
    expect(out).toEqual(['yyyyyy', 'xxxxxx']);
  });
  it('타임아웃된 미완성 전송은 버린다', () => {
    const a = new Assembler(1000);
    const parts = split(text, 30, 'slow');
    a.add(parts[0]!, 0);
    expect(a.expire(999)).toEqual([]);
    expect(a.expire(1000)).toEqual(['slow']);
    expect(a.pending).toBe(0);
  });
});
