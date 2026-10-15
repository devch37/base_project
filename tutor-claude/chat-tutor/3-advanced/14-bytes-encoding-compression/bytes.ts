/**
 * 14장 실습: 문자열 · UTF-8 · 바이트 · base64 · gzip.  npm run lab:14
 */
import { gzip, toBase64, toUtf8, utf8Bytes } from '../../web/sdk/src/bytes.ts';

const samples = ['abc', '가나다', 'é', '😀', '상담 시작합니다 👋'];
console.log('문자열            .length(UTF-16 단위)  UTF-8 바이트');
for (const s of samples) console.log(`${s.padEnd(18)} ${String(s.length).padStart(6)}               ${utf8Bytes(s)}`);
console.log('→ "64KB 한도"를 글자 수로 계산하면 한글 페이지에서 3배를 넘긴다. 항상 바이트로 재자.\n');

console.log('바이트 보기: "가" =', [...toUtf8('가')].map((b) => b.toString(16).padStart(2, '0')).join(' '), '(3바이트)');
console.log('같은 바이트를 base64 로:', toBase64(toUtf8('가')), '(텍스트 프레임에 안전하게 실을 수 있는 문자만 사용)\n');

// 실제 DOM 직렬화와 비슷한 JSON
const domLike = JSON.stringify({
  t: 'el', tag: 'ul', attrs: { class: 'product-list' },
  children: Array.from({ length: 400 }, (_, i) => ({ id: i, t: 'el', tag: 'li', attrs: { class: 'product-item', 'data-sku': `SKU-${1000 + i}` }, children: [{ t: 'text', text: `상품 ${i} — 무료배송` }] })),
});
const random = Array.from({ length: domLike.length }, () => String.fromCharCode(33 + Math.floor(Math.random() * 90))).join('');

for (const [name, text] of [['DOM 비슷한 JSON', domLike], ['무작위 문자열', random]] as const) {
  const raw = toUtf8(text);
  const t = performance.now();
  const z = await gzip(raw);
  const ms = (performance.now() - t).toFixed(1);
  const b64 = toBase64(z);
  console.log(`${name}: 원본 ${raw.length}B → gzip ${z.length}B (${((z.length / raw.length) * 100).toFixed(1)}%, ${ms}ms) → base64 ${b64.length}B`);
}
console.log(`
관찰
  - 태그·속성 이름이 반복되는 DOM JSON 은 gzip 으로 크게 줄어든다.
  - 무작위 데이터는 거의 안 줄고, base64 로 33% 다시 커진다 → 이미 압축된 것(이미지)을 또 압축하지 말 것.
  - 작은 메시지는 gzip 헤더(약 20B) 때문에 오히려 커진다 → SDK 는 2KB 이상만 압축한다 (codec.ts compressThreshold).
`);
