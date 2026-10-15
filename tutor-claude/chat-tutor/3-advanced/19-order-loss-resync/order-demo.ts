/**
 * 19장 실습: 순서 뒤바뀜 · 중복 · 손실이 섞인 네트워크를 흉내 내고 OrderedReceiver 가 어떻게 처리하는지 본다.
 *   npm run lab:19
 */
import { FrameSequencer, OrderedReceiver } from '../../web/sdk/src/sequencer.ts';
import type { FrameEnvelope } from '../../web/sdk/src/protocol.ts';

const sender = new FrameSequencer();
sender.newEpoch();
const frames: FrameEnvelope[] = [
  sender.wrap({ type: 'snapshot', data: { root: { id: 1, t: 'el', tag: 'html', attrs: {}, children: [] }, url: '', viewport: { w: 1, h: 1 }, scroll: { x: 0, y: 0 } } }),
  ...Array.from({ length: 30 }, (_, i) => sender.wrap({ type: 'pointer', x: i, y: i })),
];

function run(label: string, network: (f: FrameEnvelope[]) => FrameEnvelope[]) {
  const applied: number[] = [];
  const resyncs: string[] = [];
  const r = new OrderedReceiver({ onFrame: (e) => applied.push(e.seq), onResyncNeeded: (why) => resyncs.push(why), gapTimeoutMs: 50 });
  network(frames).forEach((f) => r.accept(f));
  return new Promise<void>((done) =>
    setTimeout(() => {
      console.log(`\n■ ${label}`);
      console.log(`  적용 순서: ${applied.join(',')}`);
      console.log(`  통계: ${JSON.stringify(r.stats)}  재동기화 요청: ${resyncs.join(',') || '없음'}`);
      r.dispose();
      done();
    }, 100),
  );
}

await run('정상', (f) => f);
await run('이웃끼리 순서 뒤바뀜', (f) => f.map((x, i, a) => (i % 4 === 1 && a[i + 1] ? a[i + 1]! : i % 4 === 2 ? a[i - 1]! : x)));
await run('중복 수신 (재전송·재연결)', (f) => f.flatMap((x, i) => (i % 5 === 0 ? [x, x] : [x])));
await run('10번 프레임 손실', (f) => f.filter((x) => x.seq !== 10));
console.log(`
관찰
  - 뒤바뀜·중복은 seq 만으로 완벽히 복구된다 (화면에는 순서대로 적용).
  - 손실은 "그 뒤의 것"을 적용할 수 없게 만든다(변경분은 이전 상태를 전제로 하므로). 기다려도 안 오면 재동기화.
  - 그래서 서버 쪽 순서 보존(StompConfig 의 preserveReceiveOrder)이 중요하다: 뒤바뀜이 잦으면 버퍼·지연이 커진다.
`);
