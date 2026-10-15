import { describe, expect, it } from 'vitest';
import { SeqBuffer } from '@ex/07-seq-buffer.ts';

describe('연습 07 SeqBuffer', () => {
  it('순서대로', () => {
    const b = new SeqBuffer<string>(1);
    expect(b.push(1, 'a')).toEqual(['a']);
    expect(b.push(2, 'b')).toEqual(['b']);
  });
  it('뒤바뀐 순서를 바로잡는다', () => {
    const b = new SeqBuffer<string>(1);
    expect(b.push(3, 'c')).toEqual([]);
    expect(b.push(2, 'b')).toEqual([]);
    expect(b.missing()).toEqual([1]);
    expect(b.push(1, 'a')).toEqual(['a', 'b', 'c']);
    expect(b.missing()).toEqual([]);
  });
  it('중복 무시', () => {
    const b = new SeqBuffer<string>(1);
    b.push(1, 'a');
    expect(b.push(1, 'a')).toEqual([]);
    b.push(3, 'c');
    expect(b.push(3, 'c')).toEqual([]);
  });
  it('빈 번호 목록', () => {
    const b = new SeqBuffer<string>(10);
    b.push(13, 'x');
    b.push(15, 'y');
    expect(b.missing()).toEqual([10, 11, 12, 14]);
  });
});
