/**
 * 01. Loopback — 한 페이지 안에서 두 RTCPeerConnection(pc1, pc2)을 직접 연결한다.
 *
 * 서버(시그널링)가 없다. "시그널링으로 주고받아야 할 것들"을 같은 JS 변수로 직접 전달할 뿐이다.
 * 그래서 WebRTC 의 핵심 절차만 순수하게 볼 수 있다.
 *
 *   Alice(pc1)                                              Bob(pc2)
 *     createOffer() ─ setLocalDescription(offer)
 *     ─────────── offer(SDP) ───────────────────────────▶ setRemoteDescription(offer)
 *                                                           createAnswer() ─ setLocalDescription(answer)
 *     setRemoteDescription(answer) ◀────── answer(SDP) ──────
 *     ◀════════ ICE candidate 를 서로 교환 (trickle) ════════▶
 *     ◀════════ 연결 확인(ICE) → DTLS 핸드셰이크 → SRTP/SCTP 로 미디어·데이터 전송 ════════▶
 *
 * 이 코드는 `?auto=1` 로 열면 자동 실행되고 결과를 `window.__result` 에 남긴다 (e2e 테스트가 읽는다).
 */
import { createFakeMedia } from '../../../shared/browser/fake-media';
import { $, attachStream, createLogger, injectBaseCss, qs, setBadge } from '../../../shared/browser/ui';
import { countCandidateTypes, describeSdp, parseCandidate } from '../../../shared/sdp';

injectBaseCss();
const log = createLogger($('log'));

// ── 화면 상태 배지 ────────────────────────────────────────────────────────────
type Which = 'p1' | 'p2';
const kindOf = (state: string): 'ok' | 'warn' | 'err' | 'idle' =>
  ['connected', 'completed', 'stable', 'complete'].includes(state) ? 'ok' : ['failed', 'disconnected', 'closed'].includes(state) ? 'err' : state === 'new' ? 'idle' : 'warn';

/** 연결 객체의 4가지 상태를 배지로 표시. 상태 이름의 뜻은 README 참고 */
function watchStates(which: Which, pc: RTCPeerConnection): void {
  const show = () => {
    setBadge($(`${which}-sig`), pc.signalingState, kindOf(pc.signalingState));
    setBadge($(`${which}-gather`), pc.iceGatheringState, kindOf(pc.iceGatheringState));
    setBadge($(`${which}-ice`), pc.iceConnectionState, kindOf(pc.iceConnectionState));
    setBadge($(`${which}-conn`), pc.connectionState, kindOf(pc.connectionState));
  };
  pc.addEventListener('signalingstatechange', () => (log(`${which}.signalingState → ${pc.signalingState}`), show()));
  pc.addEventListener('icegatheringstatechange', () => (log(`${which}.iceGatheringState → ${pc.iceGatheringState}`), show()));
  pc.addEventListener('iceconnectionstatechange', () => (log(`${which}.iceConnectionState → ${pc.iceConnectionState}`, pc.iceConnectionState === 'failed' ? 'err' : 'info'), show()));
  pc.addEventListener('connectionstatechange', () => (log(`${which}.connectionState → ${pc.connectionState}`, pc.connectionState === 'connected' ? 'ok' : 'info'), show()));
  show();
}

// ── 본 흐름 ──────────────────────────────────────────────────────────────────
interface Ctx {
  pc1?: RTCPeerConnection;
  pc2?: RTCPeerConnection;
  media?: ReturnType<typeof createFakeMedia>;
  dc1?: RTCDataChannel;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  cands: string[];
  echo?: string;
  statsTimer?: ReturnType<typeof setInterval>;
}
let ctx: Ctx = { cands: [] };

/**
 * ICE 후보 대기열.
 *   toPc2: pc1 이 만든 후보 중 pc2 에 아직 못 넣은 것 (pc2 의 remoteDescription 이 설정되기 전에 도착)
 *   toPc1: 반대 방향
 * addIceCandidate 는 "상대 SDP 를 먼저 설정한 뒤"에만 성공하므로, 그 전에 도착한 후보는 잠시 보관했다가 나중에 한꺼번에 넣는다.
 * (실제 시그널링에서도 가장 흔한 레이스 컨디션이다: 후보 메시지가 offer/answer 메시지보다 먼저 도착할 수 있다)
 */
const toPc2: RTCIceCandidate[] = [];
const toPc1: RTCIceCandidate[] = [];

/**
 * ICE 후보를 상대에게 "전달"한다. 실제 서비스라면 시그널링 서버를 통해 보낼 부분.
 * addIceCandidate 는 상대의 remoteDescription 이 설정된 뒤에만 가능하다 → 그 전에 온 후보는 잠시 보관(큐)한다.
 */
async function deliverCandidate(to: RTCPeerConnection, queue: RTCIceCandidate[], c: RTCIceCandidate): Promise<void> {
  if (!to.remoteDescription) queue.push(c);
  else await to.addIceCandidate(c);
}
async function flush(to: RTCPeerConnection, queue: RTCIceCandidate[]): Promise<void> {
  while (queue.length) await to.addIceCandidate(queue.shift()!);
}

const steps: { title: string; run: () => Promise<void> }[] = [
  {
    title: '① 두 피어 만들기: new RTCPeerConnection() ×2 (서버 설정 없음 — 같은 PC 안이라 STUN/TURN 불필요)',
    async run() {
      ctx.pc1 = new RTCPeerConnection();
      ctx.pc2 = new RTCPeerConnection();
      watchStates('p1', ctx.pc1);
      watchStates('p2', ctx.pc2);

      // ICE 후보가 생길 때마다(trickle) 상대에게 전달. candidate 가 null 이면 "수집 끝"
      ctx.pc1.onicecandidate = ({ candidate }) => {
        if (!candidate) return log('pc1: ICE 후보 수집 완료(end-of-candidates)');
        record('pc1', candidate);
        void deliverCandidate(ctx.pc2!, toPc2, candidate);
      };
      ctx.pc2.onicecandidate = ({ candidate }) => {
        if (!candidate) return log('pc2: ICE 후보 수집 완료(end-of-candidates)');
        record('pc2', candidate);
        void deliverCandidate(ctx.pc1!, toPc1, candidate);
      };

      // Bob 이 상대의 트랙/데이터채널을 받으면 호출
      ctx.pc2.ontrack = (ev) => {
        log(`pc2.ontrack: ${ev.track.kind} 트랙 도착 (mid=${ev.transceiver.mid})`, 'ok');
        if (ev.track.kind === 'video') attachStream($('v-remote') as HTMLVideoElement, ev.streams[0] ?? new MediaStream([ev.track]), true);
      };
      ctx.pc2.ondatachannel = (ev) => {
        log(`pc2.ondatachannel: "${ev.channel.label}" 채널 도착`, 'ok');
        ev.channel.onmessage = (m) => {
          log(`pc2 ← DataChannel: ${m.data}`);
          ev.channel.send(`echo:${m.data}`); // 받은 걸 되돌려 준다
        };
      };
    },
  },
  {
    title: '② Alice 가 보낼 것 준비: 미디어 트랙(addTrack) + 데이터 채널(createDataChannel)',
    async run() {
      ctx.media = createFakeMedia({ label: 'Alice', hue: 200 });
      attachStream($('v-local') as HTMLVideoElement, ctx.media.stream, true);
      // addTrack 은 "이 트랙을 상대에게 보내겠다"는 선언 → m=audio / m=video 섹션이 SDP 에 생긴다
      for (const t of ctx.media.stream.getTracks()) ctx.pc1!.addTrack(t, ctx.media.stream);
      // 데이터 채널은 SDP 의 m=application(SCTP) 섹션이 된다
      ctx.dc1 = ctx.pc1!.createDataChannel('chat');
      ctx.dc1.onopen = () => {
        log('pc1.dc.onopen: 데이터 채널 열림', 'ok');
        ctx.dc1!.send('hello from Alice');
      };
      ctx.dc1.onmessage = (m) => {
        ctx.echo = String(m.data);
        log(`pc1 ← DataChannel: ${m.data}`, 'ok');
      };
      log(`pc1 transceivers: ${ctx.pc1!.getTransceivers().map((t) => `${t.receiver.track.kind}(${t.direction})`).join(', ')}`);
    },
  },
  {
    title: '③ Alice: createOffer() → setLocalDescription(offer)   ← 이 순간부터 ICE 후보 수집이 시작된다',
    async run() {
      ctx.offer = await ctx.pc1!.createOffer();
      $('offer-raw').textContent = ctx.offer.sdp ?? '';
      $('offer-sum').textContent = describeSdp(ctx.offer.sdp ?? '');
      log(`offer 생성 (SDP ${ctx.offer.sdp?.length} bytes). 아직 pc1 에 적용 전 — "제안서를 써 본 상태"`);
      await ctx.pc1!.setLocalDescription(ctx.offer);
      log('pc1.setLocalDescription(offer) 완료 → signalingState = have-local-offer', 'ok');
    },
  },
  {
    title: '④ (시그널링) offer 를 Bob 에게 전달 → Bob: setRemoteDescription(offer)',
    async run() {
      // 실제로는 WebSocket 으로 서버를 거쳐 전달한다 (2장). 여기서는 변수 전달.
      await ctx.pc2!.setRemoteDescription(ctx.offer!);
      log('pc2.setRemoteDescription(offer) 완료 → signalingState = have-remote-offer', 'ok');
      await flush(ctx.pc2!, toPc2); // 먼저 도착해 있던 Alice 의 후보 반영
    },
  },
  {
    title: '⑤ Bob: createAnswer() → setLocalDescription(answer)   ← Bob 도 ICE 후보를 모으기 시작',
    async run() {
      ctx.answer = await ctx.pc2!.createAnswer();
      $('answer-raw').textContent = ctx.answer.sdp ?? '';
      $('answer-sum').textContent = describeSdp(ctx.answer.sdp ?? '');
      await ctx.pc2!.setLocalDescription(ctx.answer);
      log('pc2.setLocalDescription(answer) 완료 → signalingState = stable', 'ok');
    },
  },
  {
    title: '⑥ (시그널링) answer 를 Alice 에게 전달 → Alice: setRemoteDescription(answer)   ← 협상 완료, 이제 ICE 연결 확인이 진행된다',
    async run() {
      await ctx.pc1!.setRemoteDescription(ctx.answer!);
      log('pc1.setRemoteDescription(answer) 완료 → signalingState = stable', 'ok');
      await flush(ctx.pc1!, toPc1);
    },
  },
  {
    title: '⑦ 연결 확립 대기: ICE 연결 확인(STUN) → DTLS 핸드셰이크(암호화 키 교환) → 미디어/데이터 흐름 시작',
    async run() {
      await waitFor(() => ctx.pc1!.connectionState === 'connected' && ctx.pc2!.connectionState === 'connected', 15000, '연결');
      log('두 피어가 connected! 이제 Alice 의 영상이 Bob 에게 흐른다', 'ok');
      startStats();
      await waitFor(() => ctx.echo !== undefined, 5000, 'DataChannel echo');
    },
  },
];

function record(who: string, c: RTCIceCandidate): void {
  const p = parseCandidate(c.candidate);
  ctx.cands.push(`${who}  ${p ? `${p.type.padEnd(5)} ${p.protocol} ${p.ip}:${p.port}` : c.candidate}`);
  $('cands').textContent = `${ctx.cands.join('\n')}\n\n종류별: ${JSON.stringify(countCandidateTypes(ctx.cands.map((l) => ({ type: l.split(/\s+/)[1]! }))))}`;
  log(`${who} ICE 후보: ${p?.type} ${p?.protocol} ${p?.ip}:${p?.port}`);
}

async function waitFor(cond: () => boolean, ms: number, what: string): Promise<void> {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error(`시간 초과: ${what}`);
    await new Promise((r) => setTimeout(r, 50));
  }
}

/** getStats() 로 실제로 데이터가 흐르는지, 어떤 경로(후보 쌍)가 선택됐는지 본다 */
function startStats(): void {
  ctx.statsTimer = setInterval(async () => {
    if (!ctx.pc2) return;
    const report = await ctx.pc2.getStats();
    let inbound: Record<string, unknown> | undefined;
    let pair: Record<string, unknown> | undefined;
    const cands = new Map<string, Record<string, unknown>>();
    report.forEach((s: Record<string, unknown>) => {
      if (s.type === 'inbound-rtp' && s.kind === 'video') inbound = s;
      if (s.type === 'candidate-pair' && (s.nominated || s.state === 'succeeded') && s.selected !== false) pair = pair?.nominated ? pair : s;
      if (s.type === 'local-candidate' || s.type === 'remote-candidate') cands.set(String(s.id), s);
    });
    const lc = pair ? cands.get(String(pair.localCandidateId)) : undefined;
    const rc = pair ? cands.get(String(pair.remoteCandidateId)) : undefined;
    const lines = [
      `수신 영상: 디코딩 프레임 ${inbound?.framesDecoded ?? 0}개, ${inbound?.frameWidth ?? '?'}x${inbound?.frameHeight ?? '?'}, 수신 ${inbound?.packetsReceived ?? 0} 패킷, 손실 ${inbound?.packetsLost ?? 0}`,
      `선택된 후보 쌍: ${lc?.candidateType ?? '?'}(${lc?.address ?? lc?.ip ?? '?'}) ⇄ ${rc?.candidateType ?? '?'}(${rc?.address ?? rc?.ip ?? '?'})  RTT ${pair?.currentRoundTripTime ?? '?'}s`,
    ];
    $('stats').textContent = lines.join('\n');
    (window as unknown as { __result: unknown }).__result = {
      connected: ctx.pc1?.connectionState === 'connected' && ctx.pc2?.connectionState === 'connected',
      echo: ctx.echo,
      framesDecoded: Number(inbound?.framesDecoded ?? 0),
      localCandidateType: lc?.candidateType,
      senderFrames: ctx.media?.frames(),
    };
  }, 500);
}

// ── 단계 실행기 ──────────────────────────────────────────────────────────────
let idx = 0;
const ol = $('steps');
function renderSteps(): void {
  ol.innerHTML = '';
  steps.forEach((s, i) => {
    const li = document.createElement('li');
    li.textContent = s.title;
    li.style.opacity = i < idx ? '0.55' : '1';
    li.style.fontWeight = i === idx ? '700' : '400';
    if (i < idx) li.textContent = '✔ ' + s.title;
    ol.appendChild(li);
  });
  $('stepHint').textContent = idx >= steps.length ? '완료! 로그와 SDP 를 읽어 보세요.' : `다음: ${steps[idx]!.title.slice(0, 40)}…`;
  ($('btnNext') as HTMLButtonElement).disabled = idx >= steps.length;
}

async function runNext(): Promise<void> {
  if (idx >= steps.length) return;
  const s = steps[idx]!;
  ($('btnNext') as HTMLButtonElement).disabled = true;
  try {
    await s.run();
    idx++;
  } catch (e) {
    log(`오류: ${(e as Error).message}`, 'err');
  }
  renderSteps();
}

async function runAll(): Promise<void> {
  while (idx < steps.length) {
    const before = idx;
    await runNext();
    if (idx === before) break; // 실패
    await new Promise((r) => setTimeout(r, 150));
  }
}

function reset(): void {
  clearInterval(ctx.statsTimer);
  ctx.pc1?.close();
  ctx.pc2?.close();
  ctx.media?.stop();
  ctx = { cands: [] };
  toPc1.length = toPc2.length = 0;
  idx = 0;
  for (const id of ['offer-raw', 'answer-raw', 'offer-sum', 'answer-sum', 'cands', 'stats', 'log']) $(id).textContent = '';
  renderSteps();
}

$('btnNext').onclick = () => void runNext();
$('btnAuto').onclick = () => void runAll();
$('btnReset').onclick = reset;
renderSteps();
if (qs('auto') === '1') void runAll();
