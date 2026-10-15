/**
 * 순서·중복·손실 처리 (19장).
 *
 * 보내는 쪽(고객): epoch(스냅샷 ID) + seq(1,2,3...)를 붙인다.
 * 받는 쪽(상담사): seq 를 보고
 *   - 기다리던 번호면      → 적용하고, 버퍼에 다음 번호가 있으면 이어서 적용
 *   - 이미 지난 번호면      → 중복이므로 버림
 *   - 건너뛴 번호면(공백)   → 버퍼에 잠시 보관하고 빠진 번호를 기다림
 *   - 끝내 안 오면(타임아웃) → "스냅샷 다시 보내 줘"(재동기화)
 *
 * 변경분(mutation)은 하나라도 빠지면 이후 연산이 엉뚱한 노드를 가리킬 수 있다.
 * 그래서 "빠진 것을 다시 달라"(재전송)보다 "처음부터 다시"(스냅샷)가 단순하고 확실하다.
 */
import { PROTOCOL_VERSION, type Frame, type FrameEnvelope } from './protocol.ts';

export class FrameSequencer {
  epoch = '';
  private seq = 0;

  constructor(private readonly now: () => number = () => Date.now()) {}

  /** 새 스냅샷을 찍기 직전에 호출 → 새 epoch 시작 */
  newEpoch(): string {
    this.epoch = `${this.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this.seq = 0;
    return this.epoch;
  }

  wrap(frame: Frame): FrameEnvelope {
    if (!this.epoch) this.newEpoch();
    return { v: PROTOCOL_VERSION, epoch: this.epoch, seq: ++this.seq, t: this.now(), frame };
  }
}

export interface ReceiverOptions {
  onFrame: (env: FrameEnvelope) => void;
  /** 재동기화가 필요할 때 */
  onResyncNeeded: (reason: 'gap-timeout' | 'buffer-overflow' | 'no-snapshot' | 'version') => void;
  gapTimeoutMs?: number;
  maxBuffer?: number;
}

export class OrderedReceiver {
  private epoch: string | null = null;
  private expected = 1;
  private readonly buffer = new Map<number, FrameEnvelope>();
  /** 아직 스냅샷을 받지 못한 "다른 epoch" 의 프레임 (스냅샷보다 먼저 도착한 변경분) */
  private early: FrameEnvelope[] = [];
  private gapTimer: ReturnType<typeof setTimeout> | null = null;
  private waitingSnapshot = true;
  private askedForSnapshot = false;
  /** 이미 지나간 epoch 들 — 늦게 도착한 옛 스냅샷이 화면을 과거로 되돌리지 못하게 */
  private readonly pastEpochs = new Set<string>();
  readonly stats = { delivered: 0, duplicates: 0, stale: 0, reordered: 0, resyncs: 0 };

  constructor(private readonly opts: ReceiverOptions) {}

  accept(env: FrameEnvelope): void {
    if (env.v !== PROTOCOL_VERSION) {
      this.requestResync('version');
      return;
    }

    if (env.frame.type === 'snapshot') {
      // 같은 스냅샷이 또 오거나(중복) 이미 떠난 epoch 의 스냅샷이 늦게 오면 무시한다.
      // 무시하지 않으면 그동안 적용한 변경분이 지워지고 화면이 과거로 돌아간다.
      if ((env.epoch === this.epoch && !this.waitingSnapshot) || this.pastEpochs.has(env.epoch)) {
        this.stats.duplicates++;
        return;
      }
      this.startEpoch(env);
      return;
    }

    if (env.epoch !== this.epoch) {
      // 기준이 될 스냅샷이 아직 없다. 두 경우가 있다:
      //  (1) 큰 스냅샷이 조각·압축 해제 중이라 뒤의 작은 변경분이 먼저 도착 → 잠시 보관했다가 살린다
      //  (2) 늦게 들어와서 이전 스냅샷을 아예 못 받음 → 보관해도 소용없으니 스냅샷 요청
      this.stats.stale++;
      this.early.push(env);
      if (this.early.length > (this.opts.maxBuffer ?? 500)) this.early.shift();
      if (this.epoch === null && !this.askedForSnapshot) this.requestResync('no-snapshot');
      return;
    }
    if (this.waitingSnapshot) {
      this.stats.stale++; // 재동기화를 요청해 둔 상태. 현재 epoch 의 나머지는 의미 없다.
      return;
    }

    if (env.seq < this.expected || this.buffer.has(env.seq)) {
      this.stats.duplicates++;
      return;
    }
    if (env.seq > this.expected) {
      this.stats.reordered++;
      this.buffer.set(env.seq, env);
      if (this.buffer.size > (this.opts.maxBuffer ?? 500)) {
        this.requestResync('buffer-overflow');
        return;
      }
      this.armGapTimer();
      return;
    }
    this.deliver(env);
    this.flush();
  }

  private startEpoch(snapshot: FrameEnvelope): void {
    if (this.epoch && this.epoch !== snapshot.epoch) {
      this.pastEpochs.add(this.epoch);
      if (this.pastEpochs.size > 50) this.pastEpochs.delete(this.pastEpochs.values().next().value!);
    }
    this.epoch = snapshot.epoch;
    this.expected = snapshot.seq + 1;
    // 같은 epoch 의 변경분이 스냅샷보다 "먼저" 도착해 보관돼 있었을 수 있다 → 살린다
    this.buffer.clear();
    for (const env of this.early) {
      if (env.epoch === snapshot.epoch && env.seq > snapshot.seq) this.buffer.set(env.seq, env);
    }
    this.early = [];
    this.waitingSnapshot = false;
    this.askedForSnapshot = false;
    this.clearGapTimer();
    this.deliver(snapshot);
    this.flush();
  }

  private deliver(env: FrameEnvelope): void {
    this.expected = env.seq + 1;
    this.stats.delivered++;
    this.opts.onFrame(env);
  }

  private flush(): void {
    let next = this.buffer.get(this.expected);
    while (next) {
      this.buffer.delete(this.expected);
      this.deliver(next);
      next = this.buffer.get(this.expected);
    }
    if (this.buffer.size === 0) this.clearGapTimer();
  }

  private armGapTimer(): void {
    if (this.gapTimer) return;
    this.gapTimer = setTimeout(() => {
      this.gapTimer = null;
      if (this.buffer.size > 0) this.requestResync('gap-timeout');
    }, this.opts.gapTimeoutMs ?? 2000);
  }

  private clearGapTimer(): void {
    if (this.gapTimer) clearTimeout(this.gapTimer);
    this.gapTimer = null;
  }

  private requestResync(reason: Parameters<ReceiverOptions['onResyncNeeded']>[0]): void {
    this.buffer.clear();
    this.clearGapTimer();
    this.waitingSnapshot = true;
    if (this.askedForSnapshot) return; // 이미 요청했으면 스냅샷이 올 때까지 또 요청하지 않는다 (요청 폭주 방지)
    this.askedForSnapshot = true;
    this.stats.resyncs++;
    this.opts.onResyncNeeded(reason);
  }

  /** 응답이 끝내 안 오면 다시 요청할 수 있도록 (상위에서 타이머로 호출) */
  allowResyncAgain(): void {
    this.askedForSnapshot = false;
  }

  dispose(): void {
    this.clearGapTimer();
    this.buffer.clear();
    this.early = [];
  }
}
