/**
 * reliable.ts — "끊겼다 다시 붙어도 메시지를 놓치지 않기" 위한 도구 (브라우저/Node 겸용)
 *
 * WebSocket(=TCP)은 "연결이 살아 있는 동안"만 순서와 전달을 보장합니다.
 * 연결이 끊긴 순간에 서버가 보낸 메시지는 **영원히 사라집니다.** TCP 가 대신 재전송해 주지 않습니다
 * (연결 자체가 없어졌으니까요).
 *
 * 그래서 앱 레벨에서 이 3가지를 합니다 (이메일/채팅/주문 알림에서 필수):
 *
 *   1) 서버가 스트림의 모든 메시지에 단조 증가하는 순번(seq)을 붙인다
 *   2) 서버가 최근 N개를 버퍼(ReplayLog)에 보관한다
 *   3) 클라이언트는 마지막으로 받은 seq 를 기억했다가, 재연결하면 "seq 이후 것 주세요(resume)" 라고 요청한다
 *      → 서버는 버퍼에서 이어서 재전송. 버퍼에 없을 만큼 오래 끊겼다면 "전체 재동기화" 신호를 준다
 *
 *  전달 보장 수준
 *   at-most-once  : 보내고 잊음 (기본 WebSocket). 유실 가능, 중복 없음
 *   at-least-once : 유실 없음, 중복 가능   ← seq + resume 이 만드는 것. 클라이언트는 seq 로 중복을 걸러낸다
 *   exactly-once  : "정확히 한 번 '처리'"는 at-least-once + 멱등 처리(idempotency)로 구현하는 것이다
 */

/** 서버 측: 최근 N개 메시지를 순번과 함께 보관하는 링 버퍼 */
export class ReplayLog<T extends { seq?: number }> {
  private items: T[] = [];
  private next = 1;

  constructor(private readonly capacity: number) {}

  /** 새 메시지를 추가하고 seq 를 부여한다. `make` 가 seq 를 받아 완성된 메시지를 만든다 */
  append(make: (seq: number) => T): T {
    const item = make(this.next++);
    this.items.push(item);
    if (this.items.length > this.capacity) this.items.shift(); // 가장 오래된 것부터 버림
    return item;
  }

  get lastSeq(): number {
    return this.next - 1;
  }

  /**
   * afterSeq 보다 큰 모든 메시지.
   * 요청한 지점 이후가 버퍼에 "빠짐없이" 남아 있을 때만 ok. 이미 밀려났다면 gap 이다.
   */
  since(afterSeq: number): { ok: true; items: T[] } | { ok: false; oldestSeq: number } {
    if (afterSeq >= this.lastSeq) return { ok: true, items: [] };
    const oldest = this.items[0]?.seq ?? this.next;
    // 필요한 첫 메시지는 afterSeq+1. 그것이 oldest 보다 작으면 이미 버퍼에서 사라졌다.
    if (afterSeq + 1 < oldest) return { ok: false, oldestSeq: oldest };
    return { ok: true, items: this.items.filter((i) => (i.seq ?? 0) > afterSeq) };
  }
}

export type SeqVerdict = 'deliver' | 'duplicate' | 'gap';

/** 클라이언트 측: 받은 seq 를 검사해 중복/누락을 판정 */
export class SeqTracker {
  last: number;

  constructor(initial = 0) {
    this.last = initial;
  }

  accept(seq: number): SeqVerdict {
    if (seq <= this.last) return 'duplicate'; // 이미 처리한 것 (재전송으로 중복 도착)
    if (seq === this.last + 1) {
      this.last = seq;
      return 'deliver';
    }
    return 'gap'; // 건너뛰었다 → resume 요청 필요
  }

  /** 서버가 "전체 재동기화"를 지시한 경우 등 강제 리셋 */
  reset(seq: number): void {
    this.last = seq;
  }
}
