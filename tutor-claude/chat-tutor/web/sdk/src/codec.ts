/**
 * 프레임 ↔ 선(wire) 메시지 변환: 압축 + 조각내기 + 복원 (14장·18장).
 *
 *   작은 프레임   → {k:'f', e:{...}}                         그대로
 *   큰 프레임     → {k:'z', d:'H4sIAAAA...'}                 gzip → base64
 *   아주 큰 프레임 → {k:'c', id, i:0, n:3, d:'...'} × 3        base64 문자열을 조각조각
 *
 * 왜 조각을 내나?
 *   서버·프록시·브라우저 곳곳에 "메시지 1개 최대 크기"가 있다(cobrowse-server 128KB, Tomcat 기본 8KB...).
 *   스냅샷은 압축해도 수백 KB 가 될 수 있다. 한도를 넘으면 연결이 통째로 끊긴다(1009).
 *   또 큰 메시지 하나가 연결을 오래 점유하면 그 뒤의 작은 메시지(채팅·포인터)가 줄줄이 늦어진다.
 */
import type { FrameEnvelope, Wire } from './protocol.ts';
import { fromBase64, fromUtf8, gunzip, gzip, toBase64, toUtf8, utf8Bytes } from './bytes.ts';

export interface EncodeOptions {
  /** 이 바이트 수 이상이면 압축 (작은 메시지는 압축 오버헤드가 더 크다) */
  compressThreshold: number;
  /** 선 메시지 하나의 최대 바이트 수 */
  maxMessageBytes: number;
}

export const DEFAULT_ENCODE: EncodeOptions = { compressThreshold: 2048, maxMessageBytes: 32 * 1024 };

let transferCounter = 0;
function newTransferId(): string {
  transferCounter = (transferCounter + 1) % 1_000_000;
  return `${Date.now().toString(36)}-${transferCounter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function encode(env: FrameEnvelope, opts: EncodeOptions = DEFAULT_ENCODE): Promise<string[]> {
  const plain = JSON.stringify({ k: 'f', e: env } satisfies Wire);
  // 길이 비교는 반드시 "바이트"로. 한글이 많으면 글자 수의 3배가 된다.
  if (utf8Bytes(plain) < opts.compressThreshold) return [plain];

  const b64 = toBase64(await gzip(toUtf8(JSON.stringify(env))));
  const packed = JSON.stringify({ k: 'z', d: b64 } satisfies Wire);
  if (packed.length <= opts.maxMessageBytes) return [packed]; // base64 는 ASCII 라 글자 수 = 바이트 수

  // 조각 내기: 각 조각 JSON 의 껍데기({"k":"c","id":...})에 쓸 여유 200바이트를 뺀다
  const size = opts.maxMessageBytes - 200;
  const n = Math.ceil(b64.length / size);
  const id = newTransferId();
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    parts.push(JSON.stringify({ k: 'c', id, i, n, d: b64.slice(i * size, (i + 1) * size) } satisfies Wire));
  }
  return parts;
}

export interface DecoderOptions {
  /** 조각이 다 모이기까지 기다릴 최대 시간 */
  timeoutMs: number;
  /** 동시에 조립 중인 전송 최대 개수 (악의적·버그로 조각만 쏟아질 때 메모리 보호) */
  maxTransfers: number;
  /** 조립 중인 데이터 총량 한도 */
  maxBufferedBytes: number;
  /** 조립 실패(타임아웃·한도 초과) 시 호출 — 보통 재동기화를 요청한다 */
  onDrop?: (transferId: string, reason: 'timeout' | 'overflow' | 'invalid') => void;
}

export const DEFAULT_DECODE: DecoderOptions = { timeoutMs: 5000, maxTransfers: 8, maxBufferedBytes: 8 * 1024 * 1024 };

interface Transfer {
  parts: (string | undefined)[];
  received: number;
  bytes: number;
  timer: ReturnType<typeof setTimeout>;
}

export class Decoder {
  private readonly transfers = new Map<string, Transfer>();
  private buffered = 0;
  private readonly opts: DecoderOptions;

  constructor(opts: Partial<DecoderOptions> = {}) {
    this.opts = { ...DEFAULT_DECODE, ...opts };
  }

  /** 선 메시지 하나를 넣는다. 프레임이 완성되면 돌려주고, 아직이면 null. */
  async accept(raw: string): Promise<FrameEnvelope | null> {
    let wire: Wire;
    try {
      wire = JSON.parse(raw) as Wire;
    } catch {
      this.opts.onDrop?.('-', 'invalid');
      return null;
    }
    switch (wire.k) {
      case 'f':
        return wire.e;
      case 'z':
        return this.unpack(wire.d);
      case 'c':
        return this.collect(wire);
      default:
        this.opts.onDrop?.('-', 'invalid');
        return null;
    }
  }

  private async unpack(b64: string): Promise<FrameEnvelope> {
    return JSON.parse(fromUtf8(await gunzip(fromBase64(b64)))) as FrameEnvelope;
  }

  private async collect(c: Extract<Wire, { k: 'c' }>): Promise<FrameEnvelope | null> {
    if (!Number.isInteger(c.n) || c.n <= 0 || c.n > 10_000 || c.i < 0 || c.i >= c.n) {
      this.opts.onDrop?.(c.id, 'invalid');
      return null;
    }
    let t = this.transfers.get(c.id);
    if (!t) {
      if (this.transfers.size >= this.opts.maxTransfers) {
        this.opts.onDrop?.(c.id, 'overflow');
        return null;
      }
      t = {
        parts: new Array(c.n),
        received: 0,
        bytes: 0,
        timer: setTimeout(() => this.expire(c.id), this.opts.timeoutMs),
      };
      this.transfers.set(c.id, t);
    }
    if (t.parts[c.i] !== undefined) return null; // 같은 조각 중복 수신 → 무시 (멱등)
    if (this.buffered + c.d.length > this.opts.maxBufferedBytes) {
      this.drop(c.id, 'overflow');
      return null;
    }
    t.parts[c.i] = c.d;
    t.received++;
    t.bytes += c.d.length;
    this.buffered += c.d.length;
    if (t.received < c.n) return null;

    // 다 모였다: 순서대로 이어 붙여 압축 해제
    this.release(c.id);
    return this.unpack(t.parts.join(''));
  }

  private expire(id: string): void {
    if (this.transfers.has(id)) this.drop(id, 'timeout');
  }

  private drop(id: string, reason: 'timeout' | 'overflow'): void {
    this.release(id);
    this.opts.onDrop?.(id, reason);
  }

  private release(id: string): void {
    const t = this.transfers.get(id);
    if (!t) return;
    clearTimeout(t.timer);
    this.buffered -= t.bytes;
    this.transfers.delete(id);
  }

  get pendingTransfers(): number {
    return this.transfers.size;
  }

  dispose(): void {
    for (const id of [...this.transfers.keys()]) this.release(id);
  }
}
