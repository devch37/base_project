/**
 * 개인정보 마스킹 규칙 (22장).
 *
 * 핵심 원칙: 마스킹은 "고객 브라우저 안에서, 보내기 전에" 끝낸다.
 *   서버에서 지우면? → 이미 네트워크를 탔고, 서버 로그·메모리·Hazelcast 에 원문이 남는다.
 *   상담사 화면에서 가리면? → 개발자도구 한 번이면 원문이 보인다.
 *   SDK 가 압축·조각까지 한 뒤라 서버는 내용을 볼 수도 없다 → 고객 쪽만이 유일한 자리다.
 */
export interface MaskOptions {
  /** 값/텍스트를 가릴 요소 (기본: 비밀번호, 카드 자동완성, data-cobrowse-mask) */
  maskSelectors: string[];
  /** 아예 통째로 회색 상자로 바꿀 요소 (예: 계좌 목록 영역) */
  blockSelectors: string[];
  /** true 면 모든 입력 필드 값을 가린다 (금융권 기본값으로 많이 씀) */
  maskAllInputs: boolean;
}

export const DEFAULT_MASK: MaskOptions = {
  maskSelectors: [
    'input[type=password]',
    'input[autocomplete^="cc-"]', // 카드번호·CVC·유효기간 자동완성 필드
    '[data-cobrowse-mask]',
  ],
  blockSelectors: ['[data-cobrowse-block]'],
  maskAllInputs: false,
};

export function mergeMask(opts?: Partial<MaskOptions>): MaskOptions {
  return {
    maskSelectors: [...DEFAULT_MASK.maskSelectors, ...(opts?.maskSelectors ?? [])],
    blockSelectors: [...DEFAULT_MASK.blockSelectors, ...(opts?.blockSelectors ?? [])],
    maskAllInputs: opts?.maskAllInputs ?? DEFAULT_MASK.maskAllInputs,
  };
}

/** 이 요소(또는 조상)가 마스킹 대상인가 — closest 로 조상까지 본다 */
export function isMasked(el: Element, mask: MaskOptions): boolean {
  if (mask.maskAllInputs && isFormField(el)) return true;
  return mask.maskSelectors.some((s) => el.closest(s) !== null);
}

export function isBlocked(el: Element, mask: MaskOptions): boolean {
  return mask.blockSelectors.some((s) => el.matches(s));
}

export function isFormField(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

/**
 * 값 가리기. 길이는 유지한다(레이아웃이 안 흔들리게).
 * 트레이드오프: 길이 자체가 정보가 될 수 있다(예: 비밀번호 길이). 더 엄격히 하려면 고정 길이로.
 */
export function maskText(value: string): string {
  return value.replace(/\S/g, '•');
}
