/** 연습 07 해답 */
export class SeqBuffer<T> {
  private expected: number;
  private readonly held = new Map<number, T>();

  constructor(start: number) {
    this.expected = start;
  }

  push(seq: number, value: T): T[] {
    if (seq < this.expected || this.held.has(seq)) return [];
    if (seq > this.expected) {
      this.held.set(seq, value);
      return [];
    }
    const out = [value];
    this.expected++;
    while (this.held.has(this.expected)) {
      out.push(this.held.get(this.expected)!);
      this.held.delete(this.expected);
      this.expected++;
    }
    return out;
  }

  missing(): number[] {
    if (this.held.size === 0) return [];
    const max = Math.max(...this.held.keys());
    const gaps: number[] = [];
    for (let s = this.expected; s < max; s++) if (!this.held.has(s)) gaps.push(s);
    return gaps;
  }
}
