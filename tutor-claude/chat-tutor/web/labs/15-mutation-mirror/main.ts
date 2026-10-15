/**
 * 15~16장(+14·18·19장) 실험실: SDK 의 부품을 서버 없이 한 줄로 이어 붙였다.
 *
 *   Recorder → FrameSequencer → encode(압축·조각) → [가짜 네트워크: 지연·손실·뒤섞기] → Decoder → OrderedReceiver → Mirror
 *
 * 실험 아이디어
 *  - "100개 한꺼번에" → 프레임 1개, 압축률 확인 (14장)
 *  - 메시지 최대를 1000B 로 → 스냅샷이 여러 조각으로 (18장)
 *  - 손실률 20% → seq 공백 감지 → 재동기화(새 스냅샷) (19장)
 *  - 순서 뒤섞기 → 순서 뒤바뀜 카운트는 오르지만 화면은 정상 (19장)
 *  - 비밀번호·마스킹 문단이 복제본에서 가려지는지 (22장)
 */
import { Recorder } from '../../sdk/src/recorder.ts';
import { Mirror } from '../../sdk/src/mirror.ts';
import { FrameSequencer, OrderedReceiver } from '../../sdk/src/sequencer.ts';
import { Decoder, encode } from '../../sdk/src/codec.ts';
import { utf8Bytes } from '../../sdk/src/bytes.ts';
import type { Frame } from '../../sdk/src/protocol.ts';
import { $, makeLog } from '../shared-log.ts';

const log = makeLog($('log'));
const num = (id: string) => Number($<HTMLInputElement>(id).value);
const stats = { frames: 0, rawBytes: 0, wireBytes: 0, messages: 0, lost: 0, snapshots: 0 };

const srcFrame = $<HTMLIFrameElement>('src');
const mirror = Mirror.forIframe($<HTMLIFrameElement>('dst'), (r) => log('err', r));
const sequencer = new FrameSequencer();
let recorder: Recorder | null = null;
let chain = Promise.resolve();

const receiver = new OrderedReceiver({
  onFrame: (env) => {
    mirror.apply(env.frame);
    if (env.frame.type === 'snapshot') stats.snapshots++;
  },
  onResyncNeeded: (reason) => {
    log('err', `재동기화 필요: ${reason} → 원본에 새 스냅샷 요청`);
    setTimeout(restart, 100);
  },
  gapTimeoutMs: 1000,
});
let decodeChain = Promise.resolve();
const decoder = new Decoder({ onDrop: (id, reason) => log('err', `조각 조립 실패 ${id}: ${reason}`) });

/** 가짜 네트워크: 지연 + 손실 + (선택) 순서 뒤섞기 */
function network(message: string) {
  stats.messages++;
  stats.wireBytes += utf8Bytes(message);
  if (Math.random() * 100 < num('loss')) {
    stats.lost++;
    return;
  }
  const jitter = $<HTMLInputElement>('shuffle').checked ? Math.random() * 200 : 0;
  setTimeout(() => {
    decodeChain = decodeChain.then(async () => {
      const env = await decoder.accept(message);
      if (env) receiver.accept(env);
    });
  }, num('delay') + jitter);
}

function onFrame(frame: Frame) {
  const env = sequencer.wrap(frame);
  stats.frames++;
  stats.rawBytes += utf8Bytes(JSON.stringify(env));
  chain = chain.then(async () => {
    const parts = await encode(env, { compressThreshold: 1024, maxMessageBytes: num('max') });
    const raw = utf8Bytes(JSON.stringify(env));
    const wire = parts.reduce((s, p) => s + utf8Bytes(p), 0);
    log('out', `#${env.seq} ${frame.type}${frame.type === 'mutation' ? `(${frame.ops.length} ops)` : ''} 원본 ${raw}B → 선 ${wire}B, 메시지 ${parts.length}개`);
    parts.forEach(network);
  });
}

function restart() {
  recorder?.stop();
  const doc = srcFrame.contentDocument!;
  sequencer.newEpoch();
  recorder = new Recorder(doc, onFrame, { mask: { maskAllInputs: $<HTMLInputElement>('maskall').checked } });
  recorder.start();
  log('sys', `새 epoch ${sequencer.epoch} — 스냅샷부터 다시`);
}

srcFrame.addEventListener('load', restart);
$('restart').onclick = restart;
$('maskall').onchange = restart;

setInterval(() => {
  const r = receiver.stats;
  $('stats').innerHTML = [
    ['프레임', stats.frames], ['원본 KB', (stats.rawBytes / 1024).toFixed(1)], ['선 KB', (stats.wireBytes / 1024).toFixed(1)],
    ['메시지', stats.messages], ['유실', stats.lost], ['순서 뒤바뀜', r.reordered], ['재동기화', r.resyncs], ['노드 수(복제본)', mirror.ids.size],
  ].map(([k, v]) => `<div><span class="muted">${k}</span><b>${v}</b></div>`).join('');
}, 300);
