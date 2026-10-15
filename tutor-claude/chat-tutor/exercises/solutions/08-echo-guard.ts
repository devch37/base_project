/** 연습 08 해답 */
export class ScrollSync {
  position = 0;
  private lastApplied: { y: number; at: number } | null = null;

  constructor(private readonly ttlMs: number) {}

  applyRemote(y: number, nowMs: number): void {
    this.lastApplied = { y, at: nowMs }; // 적용 "전에" 기억해 둔다 — 이벤트는 적용 직후에 발생하니까
    this.position = y;
  }

  onLocalScroll(y: number, nowMs: number): number | null {
    this.position = y;
    const a = this.lastApplied;
    if (a && nowMs - a.at < this.ttlMs && a.y === y) return null;
    return y;
  }
}
