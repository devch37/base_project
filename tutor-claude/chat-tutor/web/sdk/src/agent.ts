/**
 * 상담사 콘솔용 API.
 *
 * 내부 흐름(받기): 구독 → Decoder(조각 모으기·압축 풀기) → OrderedReceiver(순서·중복·공백) → Mirror(iframe 재현)
 * 내부 흐름(보내기): iframe 안 클릭·입력·스크롤 → 명령(command) → 서버 → 고객 SDK
 */
import { dest, type ChatMessage, type Frame, type FrameEnvelope, type RoomStatus } from './protocol.ts';
import { Decoder } from './codec.ts';
import { OrderedReceiver } from './sequencer.ts';
import { Mirror } from './mirror.ts';
import { Overlay } from './overlay.ts';
import { EchoGuard } from './echo-guard.ts';
import { StompTransport, type ConnState, type TokenReason } from './transport.ts';

export interface AgentOptions {
  urls: string[];
  roomId: string;
  getToken: (reason: TokenReason) => Promise<string>;
  iframe: HTMLIFrameElement;
  overlay?: HTMLCanvasElement;
  tokenRefreshMs?: number;
  onState?: (state: ConnState, detail?: string) => void;
  onStatus?: (status: RoomStatus) => void;
  onChat?: (msg: ChatMessage) => void;
  onError?: (message: string) => void;
  /** 스냅샷을 받아 화면 크기·주소가 정해졌을 때 (콘솔이 iframe 크기·배율을 맞춘다) */
  onViewport?: (w: number, h: number, url: string) => void;
  onAck?: (ack: Extract<Frame, { type: 'ack' }>) => void;
  onResync?: (reason: string) => void;
}

export class CobrowseAgent {
  readonly transport: StompTransport;
  readonly mirror: Mirror;
  readonly receiver: OrderedReceiver;
  readonly decoder: Decoder;
  private readonly overlay: Overlay | null;
  private readonly echo = new EchoGuard();
  /** 필드별 "내가 마지막으로 보낸 입력 명령" — 에코 판별용 (17장) */
  private readonly pendingInput = new Map<number, string>();
  private decodeChain: Promise<void> = Promise.resolve();
  private resyncRetry: ReturnType<typeof setTimeout> | null = null;
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly seenChat = new Set<string>();
  private cmdCounter = 0;
  remoteControl = false;
  readonly stats = { messages: 0, bytes: 0, frames: 0, snapshots: 0, lastLatencyMs: 0 };

  constructor(private readonly opts: AgentOptions) {
    this.overlay = opts.overlay ? new Overlay(opts.overlay) : null;
    this.mirror = Mirror.forIframe(opts.iframe, (reason) => this.requestResync(`mirror: ${reason}`));
    this.decoder = new Decoder({ onDrop: (_id, reason) => this.requestResync(`chunk-${reason}`) });
    this.receiver = new OrderedReceiver({
      onFrame: (env) => this.onFrame(env),
      onResyncNeeded: (reason) => this.sendResync(reason),
    });

    this.transport = new StompTransport({
      urls: opts.urls,
      getToken: opts.getToken,
      tokenRefreshMs: opts.tokenRefreshMs,
      onState: opts.onState,
      onServerError: opts.onError,
    });
    const room = opts.roomId;
    // 이 구독이 서버에 도착하면 서버가 고객에게 "스냅샷 보내" 를 전달한다 (PresenceService)
    this.transport.subscribe(dest.screen(room), (body) => this.onWire(body));
    this.transport.subscribe(dest.status(room), (body) => {
      const s = JSON.parse(body) as RoomStatus;
      if (s.type === 'consent') this.remoteControl = s.remoteControl;
      opts.onStatus?.(s);
    });
    this.transport.subscribe(dest.chat(room), (body) => {
      const m = JSON.parse(body) as ChatMessage;
      if (this.seenChat.has(m.id)) return;
      this.seenChat.add(m.id);
      opts.onChat?.(m);
    });
    this.transport.subscribe(dest.errors, (body) => opts.onError?.(JSON.parse(body).error));
  }

  start(): void {
    this.transport.start();
  }

  async stop(): Promise<void> {
    this.receiver.dispose();
    this.decoder.dispose();
    await this.transport.stop();
  }

  sendChat(text: string): void {
    this.transport.publish(dest.chatSend(this.opts.roomId), JSON.stringify({ text }));
  }

  closeRoom(): void {
    this.transport.publish(dest.closeSend(this.opts.roomId), '{}');
  }

  /** 받은 선 메시지를 "도착 순서대로 하나씩" 해독한다 (gunzip 은 비동기라 순서가 뒤집힐 수 있음) */
  private onWire(body: string): void {
    this.stats.messages++;
    this.stats.bytes += body.length;
    this.decodeChain = this.decodeChain
      .then(async () => {
        const env = await this.decoder.accept(body);
        if (env) this.receiver.accept(env);
      })
      .catch((e: unknown) => this.requestResync(`decode: ${(e as Error).message}`));
  }

  private onFrame(env: FrameEnvelope): void {
    this.stats.frames++;
    this.stats.lastLatencyMs = Date.now() - env.t; // 고객·상담사 PC 시계가 다르면 부정확 (참고용)
    const f = env.frame;
    switch (f.type) {
      case 'snapshot':
        this.stats.snapshots++;
        if (this.resyncRetry) clearTimeout(this.resyncRetry);
        this.resyncRetry = null;
        this.pendingInput.clear();
        this.mirror.apply(f);
        this.opts.onViewport?.(f.data.viewport.w, f.data.viewport.h, f.data.url);
        this.overlay?.resize(f.data.viewport.w, f.data.viewport.h);
        this.attachInteractions(); // document.open() 이 리스너를 지우므로 스냅샷마다 다시 단다
        return;
      case 'viewport':
        this.opts.onViewport?.(f.w, f.h, this.mirror.snapshot?.url ?? '');
        this.overlay?.resize(f.w, f.h);
        return;
      case 'pointer':
        this.overlay?.showPointer(f.x, f.y);
        return;
      case 'scroll':
        this.echo.markApplied(`scroll:${f.id}`, [f.x, f.y]); // 곧 iframe 에서 scroll 이벤트가 날 것 → 무시하도록
        this.mirror.apply(f);
        return;
      case 'input':
        // 내가 이 필드에 보낸 입력의 결과(ack)를 기다리는 중이면, 고객 쪽 중간값으로 덮어쓰지 않는다
        if (this.pendingInput.has(f.id)) return;
        this.mirror.apply(f);
        return;
      case 'ack':
        this.onAck(f);
        return;
      default:
        this.mirror.apply(f);
    }
  }

  private onAck(ack: Extract<Frame, { type: 'ack' }>): void {
    this.opts.onAck?.(ack);
    if (ack.id === undefined) return;
    // "가장 최근에 보낸 명령"의 ack 만 반영. 더 최근 입력이 있으면 이 ack 는 이미 낡은 값이다.
    if (this.pendingInput.get(ack.id) !== ack.cmdId) return;
    this.pendingInput.delete(ack.id);
    if (ack.ok) this.mirror.applyInput(ack.id, ack.value, ack.checked);
  }

  // ── 상담사의 조작 → 명령 ────────────────────────────────────────

  private attachInteractions(): void {
    const doc = this.mirror.document;
    // 클릭: 복제본에서 링크를 따라가거나 버튼이 동작하면 안 된다 → 기본 동작을 막고 "명령"으로 바꾼다
    doc.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = this.mirror.idOf(e.target as Node);
      if (id === undefined) return;
      if (e.shiftKey || !this.remoteControl) this.highlight(id);
      else this.command({ type: 'click', id });
    }, true);
    doc.addEventListener('submit', (e) => e.preventDefault(), true);
    doc.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement;
      const id = this.mirror.idOf(el);
      if (id === undefined) return;
      if (!this.remoteControl) {
        this.opts.onError?.('고객이 원격 조작을 허용해야 입력할 수 있습니다');
        return;
      }
      const isCheck = el.type === 'checkbox' || el.type === 'radio';
      const cmdId = this.command(isCheck ? { type: 'input', id, checked: el.checked } : { type: 'input', id, value: el.value });
      this.pendingInput.set(id, cmdId);
    }, true);
    doc.addEventListener('scroll', (e) => {
      if (!this.remoteControl) return;
      const isWindow = e.target === doc;
      const id = isWindow ? 0 : this.mirror.idOf(e.target as Node);
      if (id === undefined) return;
      const x = isWindow ? doc.defaultView!.scrollX : (e.target as Element).scrollLeft;
      const y = isWindow ? doc.defaultView!.scrollY : (e.target as Element).scrollTop;
      if (this.echo.isEcho(`scroll:${id}`, [x, y])) return; // 고객 화면을 따라 움직인 것 → 보내지 않음
      if (this.scrollTimer) clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => this.command({ type: 'scroll', id, x, y }), 80);
    }, true);
  }

  private highlight(id: number): void {
    const el = this.mirror.nodeOf(id) as Element | undefined;
    if (el?.getBoundingClientRect) {
      const r = el.getBoundingClientRect();
      this.overlay?.showBox({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
    this.command({ type: 'highlight', id });
  }

  private command(cmd: Record<string, unknown>): string {
    const cmdId = `a${Date.now().toString(36)}${(this.cmdCounter++).toString(36)}`;
    this.transport.publish(dest.commandSend(this.opts.roomId), JSON.stringify({ ...cmd, cmdId }));
    return cmdId;
  }

  // ── 재동기화 ────────────────────────────────────────────────────

  requestResync(reason: string): void {
    this.receiver.allowResyncAgain();
    this.sendResync(reason);
  }

  private sendResync(reason: string): void {
    this.opts.onResync?.(reason);
    this.transport.publish(dest.resyncSend(this.opts.roomId), JSON.stringify({ reason }));
    // 스냅샷이 5초 안에 안 오면(고객 오프라인 등) 다시 요청할 수 있게 한다
    if (this.resyncRetry) clearTimeout(this.resyncRetry);
    this.resyncRetry = setTimeout(() => this.receiver.allowResyncAgain(), 5000);
  }
}
