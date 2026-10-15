import { describe, expect, it } from 'vitest';
import { base64Length, fitsInMessage, utf8ByteLength } from '@ex/05-utf8.ts';

describe('연습 05 UTF-8', () => {
  it('utf8ByteLength 는 TextEncoder 와 같아야 한다', () => {
    for (const s of ['', 'abc', 'é', '가나다', '😀', 'a가😀é\n', '𝄞음표']) {
      expect(utf8ByteLength(s)).toBe(new TextEncoder().encode(s).length);
    }
  });
  it('base64Length', () => {
    expect([0, 1, 2, 3, 4, 3000].map(base64Length)).toEqual([0, 4, 4, 4, 8, 4000]);
  });
  it('fitsInMessage 는 글자 수가 아니라 바이트로', () => {
    const korean = JSON.stringify({ t: '가'.repeat(30) }); // 38글자, 98바이트
    expect(korean.length).toBeLessThan(64);
    expect(fitsInMessage(korean, 64)).toBe(false);
  });
});
