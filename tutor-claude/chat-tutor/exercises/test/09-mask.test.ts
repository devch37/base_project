import { describe, expect, it } from 'vitest';
import { maskValue, shouldMask, type Field } from '@ex/09-mask.ts';

const input = (over: Partial<Field> = {}): Field => ({ tag: 'input', attrs: {}, ancestors: [], ...over });

describe('연습 09 마스킹', () => {
  it('규칙', () => {
    const off = { maskAllInputs: false };
    expect(shouldMask(input({ type: 'password' }), off)).toBe(true);
    expect(shouldMask(input({ autocomplete: 'cc-number' }), off)).toBe(true);
    expect(shouldMask(input({ attrs: { 'data-cobrowse-mask': '' } }), off)).toBe(true);
    expect(shouldMask(input({ ancestors: [{ class: 'x' }, { 'data-cobrowse-mask': '' }] }), off)).toBe(true);
    expect(shouldMask(input(), off)).toBe(false);
    expect(shouldMask(input(), { maskAllInputs: true })).toBe(true);
    expect(shouldMask({ tag: 'select', attrs: {}, ancestors: [] }, { maskAllInputs: true })).toBe(false);
  });
  it('maskValue 는 공백을 남기고 글자 수를 유지', () => {
    expect(maskValue('4111 1111')).toBe('•••• ••••');
    expect(maskValue('홍길동😀')).toBe('••••');
    expect(maskValue('')).toBe('');
  });
});
