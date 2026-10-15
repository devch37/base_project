/**
 * 고객 SDK 의 공개 API (20장). 고객사 개발자는 이 클래스만 알면 된다.
 *
 *   const cb = new CobrowseCustomer({ urls: ['wss://chat.example.com/ws'], roomId, getToken });
 *   cb.start();
 *   cb.setRemoteControl(true);   // 고객이 "상담사 조작 허용" 버튼을 눌렀을 때
 *
 * 내부 흐름: Recorder(화면 변화) → FrameSequencer(번호) → encode(압축·조각) → StompTransport(전송)
 */
import { dest, type ChatMessage, type Command, type Frame, type RoomStatus } from './protocol.ts';
import { Recorder } from './recorder.ts';
import { FrameSequencer } from './sequencer.ts';
import { DEFAULT_ENCODE, encode, type EncodeOptions } from './codec.ts';
import { StompTransport, type ConnState, type TokenReason } from './transport.ts';
import { RemoteControl } from './remote-control.ts';
import type { MaskOptions } from './masking.ts';
import { utf8Bytes } from './bytes.ts';

export interface CustomerOptions {
  urls: string[];
  roomId: string;
  getToken: (reason: TokenReason) => Promise<string>;
  mask?: Partial<MaskOptions>;
  encode?: Partial<EncodeOptions>;
  document?: Document;
  tokenRefreshMs?: number;
  onState?: (state: ConnState, detail?: string) => void;
  onStatus?: (status: RoomStatus) => void;
  onChat?: (msg: ChatMessage) => void;
  onCommand?: (cmd: Command) => void;
  onError?: (message: string) => void;
}

export class CobrowseCustomer {
  readonly transport: StompTransport;
  readonly recorder: Recorder;
  readonly remote: RemoteControl;
  private readonly sequencer = new FrameSequencer();
  private readonly encodeOpts: EncodeOptions;
  private sendChain: Promise<void> = Promise.resolve();
  private resyncTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly seenChat = new Set<string>();
  readonly stats = { frames: 0, messages: 0, bytes: 0, snapshots: 0, dropped: 0 };

  constructor(private readonly opts: CustomerOptions) {
    const doc = opts.document ?? document;
    this.encodeOpts = { ...DEFAULT_ENCODE, ...opts.encode };
    this.recorder = new Recorder(doc, (f) => this.send(f), { mask: opts.mask });
    this.remote = new RemoteControl(doc, this.recorder, (f) => this.send(f));
    this.transport = new StompTransport({
      urls: opts.urls,
      getToken: opts.getToken,
      tokenRefreshMs: opts.tokenRefreshMs,
      onState: opts.onState,
      onServerError: opts.onError,
      // (재)연결될 때마다 스냅샷부터 새로. 끊긴 동안의 변경분은 이미 버렸기 때문이다.
      onConnected: () => this.resnapshot(),
    });
    const room = opts.roomId;
    this.transport.subscribe(dest.commands(room), (body) => this.onCommand(JSON.parse(body) as Command));
    this.transport.subscribe(dest.status(room), (body) => opts.onStatus?.(JSON.parse(body) as RoomStatus));
    this.transport.subscribe(dest.chat(room), (body) => {
      const m = JSON.parse(body) as ChatMessage;
      if (this.seenChat.has(m.id)) return; // 재연결 등으로 같은 메시지가 두 번 와도 한 번만 (19장)
      this.seenChat.add(m.id);
      opts.onChat?.(m);
    });
    this.transport.subscribe(dest.errors, (body) => opts.onError?.(JSON.parse(body).error));
  }

  start(): void {
    this.transport.start();
  }

  async stop(): Promise<void> {
    this.recorder.stop();
    await this.transport.stop();
  }

  setRemoteControl(on: boolean): void {
    this.remote.enabled = on;
    this.transport.publish(dest.consentSend(this.opts.roomId), JSON.stringify({ remoteControl: on }));
  }

  sendChat(text: string): void {
    this.transport.publish(dest.chatSend(this.opts.roomId), JSON.stringify({ text }));
  }

  /** 새 epoch 로 스냅샷부터 다시. 짧은 시간에 여러 번 요청돼도 한 번만 찍는다(상담사 여럿이 동시에 입장 등). */
  resnapshot(): void {
    if (this.resyncTimer) return;
    this.resyncTimer = setTimeout(() => {
      this.resyncTimer = null;
      this.sequencer.newEpoch();
      this.stats.snapshots++;
      this.recorder.start(); // 내부에서 snapshot 프레임을 emit → send()
    }, 50);
  }

  private onCommand(cmd: Command): void {
    this.opts.onCommand?.(cmd);
    if (cmd.type === 'resync') this.resnapshot();
    else this.remote.apply(cmd);
  }

  /**
   * 프레임 전송. 연결이 없으면 "버린다"(큐에 쌓지 않는다).
   *   이유: 재연결되면 어차피 새 스냅샷을 보낸다. 끊긴 동안의 변경분을 쌓아 두면 메모리만 먹고,
   *   재연결 직후 낡은 변경분이 한꺼번에 쏟아져 상담사 화면이 오히려 늦게 정상화된다.
   *
   * 순서 보장: seq 는 지금 붙이고(동기), 압축·전송은 sendChain 으로 "한 줄로" 처리한다.
   *   encode 는 비동기(gzip)라서 그냥 부르면 작은 프레임이 큰 스냅샷보다 먼저 나갈 수 있다.
   */
  private send(frame: Frame): void {
    if (!this.transport.connected) {
      this.stats.dropped++;
      return;
    }
    const env = this.sequencer.wrap(frame);
    this.stats.frames++;
    const room = this.opts.roomId;
    this.sendChain = this.sendChain
      .then(async () => {
        for (const part of await encode(env, this.encodeOpts)) {
          if (!this.transport.publish(dest.frameSend(room), part)) return; // 도중에 끊기면 중단 (재연결 시 스냅샷)
          this.stats.messages++;
          this.stats.bytes += utf8Bytes(part);
        }
      })
      .catch((e: unknown) => this.opts.onError?.(`프레임 전송 실패: ${(e as Error).message}`));
  }
}
