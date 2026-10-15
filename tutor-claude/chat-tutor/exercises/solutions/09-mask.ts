/** 연습 09 해답 */
export interface Field {
  tag: string;
  type?: string;
  autocomplete?: string;
  attrs: Record<string, string>;
  ancestors: Array<Record<string, string>>;
}

const MASK_ATTR = 'data-cobrowse-mask';

export function shouldMask(f: Field, options: { maskAllInputs: boolean }): boolean {
  if (f.type === 'password') return true;
  if (f.autocomplete?.startsWith('cc-')) return true;
  if (MASK_ATTR in f.attrs || f.ancestors.some((a) => MASK_ATTR in a)) return true;
  return options.maskAllInputs && (f.tag === 'input' || f.tag === 'textarea');
}

export function maskValue(value: string): string {
  return Array.from(value, (ch) => (/\s/.test(ch) ? ch : '•')).join('');
}
