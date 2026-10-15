/**
 * 연습 09 (22장) — 마스킹 규칙
 *
 * 요소를 단순화한 모양(Field)을 보고 가려야 하는지 판단하고, 값을 가린다.
 * shouldMask 규칙 (하나라도 해당하면 true):
 *  - type 이 'password'
 *  - autocomplete 가 'cc-' 로 시작 (카드 정보)
 *  - attrs 에 'data-cobrowse-mask' 가 있음
 *  - 조상(ancestors) 중 하나라도 'data-cobrowse-mask' 를 가짐
 *  - options.maskAllInputs 가 true 이고 tag 가 input/textarea
 * maskValue: 공백은 남기고 나머지 글자를 '•' 로 (길이 유지). 이모지·한글도 "한 글자"로 센다.
 */
export interface Field {
  tag: string;
  type?: string;
  autocomplete?: string;
  attrs: Record<string, string>;
  ancestors: Array<Record<string, string>>;
}

export function shouldMask(f: Field, options: { maskAllInputs: boolean }): boolean {
  throw new Error('TODO: shouldMask');
}

export function maskValue(value: string): string {
  throw new Error('TODO: maskValue');
}
