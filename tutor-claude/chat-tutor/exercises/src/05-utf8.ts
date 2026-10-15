/**
 * 연습 05 (14장) — 바이트 세기
 *
 * utf8ByteLength(s): TextEncoder/Buffer 를 쓰지 말고 직접 계산하라.
 *   코드 포인트 범위별 UTF-8 바이트 수: U+0000~007F → 1, ~07FF → 2, ~FFFF → 3, 그 이상 → 4
 *   주의: JS 문자열은 UTF-16. 이모지 같은 문자는 두 칸(서로게이트 쌍)을 차지한다 → for...of 나 codePointAt 사용
 * base64Length(n): n 바이트를 base64(패딩 포함)로 바꾼 글자 수
 * fitsInMessage(json, limitBytes): JSON 문자열이 바이트 한도 안에 들어가는가
 */
export function utf8ByteLength(s: string): number {
  throw new Error('TODO: utf8ByteLength');
}

export function base64Length(n: number): number {
  throw new Error('TODO: base64Length');
}

export function fitsInMessage(json: string, limitBytes: number): boolean {
  throw new Error('TODO: fitsInMessage');
}
