/**
 * 연습 07 (19장) — 순서대로 내보내는 버퍼
 *
 * SeqBuffer(start): 다음으로 기대하는 번호는 start.
 *  - push(seq, value): 지금 "내보낼 수 있게 된" 값들을 순서대로 배열로 돌려준다
 *      · seq < 기대값 → 중복, 무시 ([] 반환)
 *      · seq > 기대값 → 보관만 ([] 반환)
 *      · seq == 기대값 → 그 값 + 보관 중이던 연속된 다음 값들
 *  - missing(): 보관 중인 것이 있을 때, 지금 비어 있는 번호들 (기대값 ~ 보관된 최대값 사이). 정렬된 배열
 */
export class SeqBuffer<T> {
  constructor(start: number) {}

  push(seq: number, value: T): T[] {
    throw new Error('TODO: push');
  }

  missing(): number[] {
    throw new Error('TODO: missing');
  }
}
