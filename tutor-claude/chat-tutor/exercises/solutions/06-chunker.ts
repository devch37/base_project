/** 연습 06 해답 */
export interface Chunk {
  id: string;
  i: number;
  n: number;
  d: string;
}

export function split(text: string, size: number, transferId: string): Chunk[] {
  const n = Math.max(1, Math.ceil(text.length / size));
  return Array.from({ length: n }, (_, i) => ({ id: transferId, i, n, d: text.slice(i * size, (i + 1) * size) }));
}

export class Assembler {
  private readonly transfers = new Map<string, { parts: (string | undefined)[]; got: number; since: number }>();

  constructor(private readonly timeoutMs: number) {}

  add(chunk: Chunk, nowMs: number): string | null {
    let t = this.transfers.get(chunk.id);
    if (!t) {
      t = { parts: new Array(chunk.n), got: 0, since: nowMs };
      this.transfers.set(chunk.id, t);
    }
    if (t.parts[chunk.i] !== undefined) return null; // 중복
    t.parts[chunk.i] = chunk.d;
    t.got++;
    if (t.got < chunk.n) return null;
    this.transfers.delete(chunk.id);
    return t.parts.join('');
  }

  expire(nowMs: number): string[] {
    const dropped: string[] = [];
    for (const [id, t] of this.transfers) {
      if (nowMs - t.since >= this.timeoutMs) {
        this.transfers.delete(id);
        dropped.push(id);
      }
    }
    return dropped;
  }

  get pending(): number {
    return this.transfers.size;
  }
}
