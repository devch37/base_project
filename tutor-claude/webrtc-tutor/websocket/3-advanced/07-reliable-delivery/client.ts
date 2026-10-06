/**
 * client.ts — 끊겨도 놓치지 않는 스트림 클라이언트 (WsClient + SeqTracker)
 *
 * 규칙: "받은 마지막 seq 를 기억하고, 연결될 때마다(처음 포함) 그 지점부터 달라고 요청한다"
 *   - seq === last+1 → 정상 전달
 *   - seq <= last    → 중복(재전송으로 겹침) → 버림
 *   - seq >  last+1  → 건너뜀(gap). 이 이벤트는 버리고, 서버가 재생해 줄 때까지 기다린다
 */
import { SeqTracker } from '@tutor/ws-kit/reliable';
import { type ClientOptions, WsClient } from '@tutor/ws-kit/client';
import WebSocket from 'ws';

export interface StreamStats {
  delivered: number[];
  duplicates: number;
  gapsDropped: number;
  resumes: { mode: string; replayed?: number }[];
}

export class ReliableStreamClient {
  readonly ws: WsClient;
  readonly tracker = new SeqTracker();
  readonly stats: StreamStats = { delivered: [], duplicates: 0, gapsDropped: 0, resumes: [] };
  onFullResync: (snapshot: unknown) => void = () => {};

  constructor(url: ClientOptions['url'], extra: Partial<ClientOptions> = {}) {
    this.ws = new WsClient({
      url,
      WebSocket: WebSocket as never,
      backoff: { baseMs: 20, maxMs: 100, factor: 2 },
      pingIntervalMs: 0,
      autoRejoin: false, // 방 재입장은 아래 subscribe 가 대신한다 (resume 과 한 번에)
      ...extra,
    });

    this.ws.on('message', (env) => {
      if (env.type !== 'stream.event' || env.seq === undefined) return;
      switch (this.tracker.accept(env.seq)) {
        case 'deliver':
          this.stats.delivered.push(env.seq);
          break;
        case 'duplicate':
          this.stats.duplicates++;
          break;
        case 'gap':
          this.stats.gapsDropped++; // 이어 붙일 수 없는 이벤트는 버린다. 곧 재생이 도착한다
          break;
      }
    });

    // 연결(재연결 포함)될 때마다 "내가 받은 마지막 seq 이후"를 요청
    this.ws.on('open', () => void this.subscribe());
  }

  private async subscribe(): Promise<void> {
    const afterSeq = this.tracker.last > 0 ? this.tracker.last : undefined;
    const res = await this.ws.request<{ mode: string; replayed?: number; oldestSeq?: number; lastSeq: number }>('stream.subscribe', afterSeq === undefined ? {} : { afterSeq });
    const p = res.payload!;
    this.stats.resumes.push({ mode: p.mode, ...(p.replayed !== undefined ? { replayed: p.replayed } : {}) });

    if (p.mode === 'gap') {
      // 버퍼 범위를 벗어났다 → 스냅샷으로 전체 상태를 다시 받고, seq 를 서버의 최신으로 맞춘다
      const snap = await this.ws.request<{ state: unknown; lastSeq: number }>('stream.snapshot');
      this.onFullResync(snap.payload!.state);
      this.tracker.reset(snap.payload!.lastSeq);
    }
  }

  connect(): Promise<void> {
    return this.ws.connect();
  }
  close(): void {
    this.ws.close();
  }
}
