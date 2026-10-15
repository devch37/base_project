/** 연습 05 해답 */
export function utf8ByteLength(s: string): number {
  let n = 0;
  for (const ch of s) {
    // for...of 는 코드 포인트 단위로 돈다 (서로게이트 쌍을 한 글자로)
    const cp = ch.codePointAt(0)!;
    n += cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4;
  }
  return n;
}

export function base64Length(n: number): number {
  return Math.ceil(n / 3) * 4; // 3바이트 → 4글자, 남는 바이트는 = 로 채운다
}

export function fitsInMessage(json: string, limitBytes: number): boolean {
  return utf8ByteLength(json) <= limitBytes;
}
