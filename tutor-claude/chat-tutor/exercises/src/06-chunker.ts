/**
 * 연습 06 (18장) — 조각내기와 조립
 *
 * split(text, size, transferId): text 를 size 글자씩 잘라 Chunk[] 로. (빈 문자열이면 조각 1개)
 * Assembler:
 *  - add(chunk, nowMs): 조각을 넣는다. 전송이 완성되면 원래 문자열, 아니면 null
 *      · 같은 조각(i)이 또 오면 무시 (멱등)
 *      · 순서가 섞여 와도 i 순서대로 이어 붙인다
 *      · 완성된 전송은 메모리에서 지운다
 *  - expire(nowMs): 첫 조각을 받은 지 timeoutMs 이상 지난 미완성 전송을 지우고, 지운 transferId 목록을 돌려준다
 *  - pending: 조립 중인 전송 수
 */
export interface Chunk {
  id: string;
  i: number;
  n: number;
  d: string;
}

export function split(text: string, size: number, transferId: string): Chunk[] {
  throw new Error('TODO: split');
}

export class Assembler {
  constructor(readonly timeoutMs: number) {}

  add(chunk: Chunk, nowMs: number): string | null {
    throw new Error('TODO: add');
  }

  expire(nowMs: number): string[] {
    throw new Error('TODO: expire');
  }

  get pending(): number {
    throw new Error('TODO: pending');
  }
}
