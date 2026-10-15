/**
 * 01장 실습: URL 을 쪼개 보고, 두 주소가 "같은 출처(Origin)"인지 판단한다.
 *   npm run lab:01:url
 *
 * Origin = scheme + host + port. 셋 중 하나라도 다르면 다른 출처다. (경로·쿼리는 상관없다)
 * 이 개념이 CORS(22장), 쿠키(10장), WebSocket Origin 검사(07·22장)의 출발점이다.
 */
const samples = [
  'http://localhost:5173/apps/customer/?customer=c1#top',
  'https://chat.example.com/ws',
  'wss://chat.example.com:443/ws',
  'https://chat.example.com:8443/api/rooms?page=2',
];

for (const s of samples) {
  const u = new URL(s);
  console.log(`\n${s}`);
  console.log(`  scheme=${u.protocol}  host=${u.hostname}  port=${u.port || '(기본값)'}  path=${u.pathname}  query=${u.search}  hash=${u.hash}`);
  console.log(`  origin=${u.origin}`);
}

const pairs: Array<[string, string]> = [
  ['http://localhost:5173/a', 'http://localhost:5173/b?x=1'], // 같다: 경로만 다름
  ['http://localhost:5173', 'http://localhost:8080'], // 다르다: 포트
  ['http://example.com', 'https://example.com'], // 다르다: scheme
  ['https://example.com', 'https://api.example.com'], // 다르다: host (서브도메인도 다른 host)
  ['https://example.com', 'https://example.com:443'], // 같다: https 기본 포트가 443
];
console.log('\n=== 같은 출처인가? ===');
for (const [a, b] of pairs) {
  console.log(`${new URL(a).origin === new URL(b).origin ? '같음 ' : '다름 '} ${a}  vs  ${b}`);
}
// 주의: WebSocket 주소 자체의 origin(wss://chat.example.com)과, 브라우저가 WebSocket 요청에 실어 보내는
// Origin 헤더는 다르다. Origin 헤더에는 "그 연결을 연 페이지"의 출처(예: http://localhost:5173)가 들어간다.
// 서버(07·22장)가 검사하는 것은 이 헤더다 — "어느 사이트의 JS 가 나에게 연결하려 하나?"
console.log(`\nWebSocket 주소의 origin            = ${new URL('wss://chat.example.com/ws').origin}`);
console.log('브라우저가 보내는 Origin 요청 헤더 = 연결을 시작한 페이지의 출처 (예: https://shop.example.com)');
