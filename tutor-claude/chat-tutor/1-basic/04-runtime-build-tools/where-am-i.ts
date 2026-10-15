/**
 * 04장 실습: "이 코드는 어디서 실행되는가?"  npm run lab:04
 * 같은 TypeScript 라도 Node.js 에서 도는 코드와 브라우저에서 도는 코드는 쓸 수 있는 API 가 다르다.
 */
const isNode = typeof process !== 'undefined' && !!process.versions?.node;
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

console.log(`Node.js 인가? ${isNode} (버전 ${process.versions.node})`);
console.log(`브라우저인가? ${isBrowser}`);
console.log('\n양쪽 모두에 있는 표준 API (SDK 는 이것만 쓴다 → web/sdk/src/bytes.ts):');
for (const name of ['fetch', 'WebSocket', 'TextEncoder', 'CompressionStream', 'URL', 'crypto', 'setTimeout', 'btoa']) {
  console.log(`  ${name.padEnd(18)} ${typeof (globalThis as Record<string, unknown>)[name] !== 'undefined' ? '있음' : '없음'}`);
}
console.log('\nNode 에만 있는 것: process, fs, net, Buffer ...  /  브라우저에만 있는 것: window, document, DOM, localStorage ...');

// 환경 변수: 코드 수정 없이 설정을 바꾸는 가장 기본적인 방법 (12-factor 의 "설정은 환경에")
console.log(`\nCHAT_SERVER 환경 변수 = ${process.env.CHAT_SERVER ?? '(없음 → 기본값 http://localhost:8080 사용)'}`);
console.log('예) CHAT_SERVER=http://localhost:9090 npm run lab:04');
// 주의: 브라우저 코드에는 환경 변수가 없다. Vite 는 빌드할 때 import.meta.env.VITE_* 값을 "코드에 박아" 넣는다.
// → 비밀값(API 키)을 VITE_ 변수로 넣으면 그대로 JS 파일에 노출된다!
