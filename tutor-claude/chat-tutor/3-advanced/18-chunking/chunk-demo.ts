/**
 * 18장 실습: 큰 스냅샷을 조각내고, 뒤섞인 순서로 받아 복원하고, 한 조각을 잃어버려 본다.  npm run lab:18
 */
import { Decoder, encode } from '../../web/sdk/src/codec.ts';
import { FrameSequencer } from '../../web/sdk/src/sequencer.ts';
import { utf8Bytes } from '../../web/sdk/src/bytes.ts';

const seq = new FrameSequencer();
// 압축이 잘 안 되는 내용(무작위 상품 코드)을 섞어 큰 스냅샷을 흉내
const text = Array.from({ length: 4000 }, (_, i) => `<li>${i}:${Math.random().toString(36).slice(2, 10)}</li>`).join('');
const env = seq.wrap({ type: 'mutation', ops: [{ op: 'text', id: 1, text }] });
console.log(`원본 프레임: ${(utf8Bytes(JSON.stringify(env)) / 1024).toFixed(1)}KB`);

for (const max of [128 * 1024, 32 * 1024, 8 * 1024]) {
  const parts = await encode(env, { compressThreshold: 2048, maxMessageBytes: max });
  console.log(`  메시지 한도 ${max / 1024}KB → ${parts.length}개 (가장 큰 조각 ${Math.max(...parts.map(utf8Bytes))}B)`);
}

const parts = await encode(env, { compressThreshold: 2048, maxMessageBytes: 8 * 1024 });
console.log('\n조각 하나의 모양:', parts[0]!.slice(0, 90) + '…');

// 1) 뒤섞인 순서로 도착
const dec = new Decoder();
const shuffled = [...parts].sort(() => Math.random() - 0.5);
let restored = null;
for (const p of shuffled) restored = (await dec.accept(p)) ?? restored;
console.log(`\n뒤섞어 보냈는데 복원 성공? ${JSON.stringify(restored) === JSON.stringify(env)}`);

// 2) 한 조각 유실 → 타임아웃 → 버리고 알림
const lossy = new Decoder({ timeoutMs: 500, onDrop: (id, reason) => console.log(`조립 실패 transferId=${id} reason=${reason} → 상담사 SDK 는 여기서 재동기화를 요청한다`) });
for (const p of parts.slice(1)) await lossy.accept(p);
console.log(`첫 조각을 뺀 나머지 ${parts.length - 1}개 수신, 조립 중 ${lossy.pendingTransfers}건…`);
await new Promise((r) => setTimeout(r, 700));
console.log(`0.7초 뒤 조립 중 ${lossy.pendingTransfers}건 (메모리 반환됨)`);
