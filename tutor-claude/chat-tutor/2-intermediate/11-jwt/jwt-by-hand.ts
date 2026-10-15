/**
 * 11장 실습: 라이브러리 없이 JWT(HS256)를 만들고, 읽고, 검증하고, 위조해 본다.  npm run lab:11
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = 'dev-only-secret-change-me-0123456789abcdef';
const b64url = (data: string | Buffer) => Buffer.from(data).toString('base64url');
const fromB64url = (s: string) => Buffer.from(s, 'base64url').toString('utf8');

function sign(payload: object, secret = SECRET): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const signature = b64url(createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${signature}`;
}

function verify(token: string, now = Math.floor(Date.now() / 1000)): { ok: boolean; reason: string; payload?: Record<string, unknown> } {
  const [h, p, s] = token.split('.');
  if (!h || !p || s === undefined) return { ok: false, reason: '형식 오류' };
  const header = JSON.parse(fromB64url(h)) as { alg: string };
  if (header.alg !== 'HS256') return { ok: false, reason: `허용하지 않는 alg: ${header.alg}` }; // alg:none 공격 차단
  const expected = createHmac('sha256', SECRET).update(`${h}.${p}`).digest();
  const given = Buffer.from(s, 'base64url');
  // 길이가 다르면 timingSafeEqual 이 예외 → 먼저 비교. 문자열 === 비교는 "몇 글자까지 맞았는지" 시간 차이가 새어 나갈 수 있다
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: '서명 불일치(위조 또는 다른 키)' };
  const payload = JSON.parse(fromB64url(p)) as Record<string, unknown>;
  if (typeof payload.exp === 'number' && now >= payload.exp) return { ok: false, reason: '만료' };
  return { ok: true, reason: '정상', payload };
}

const now = Math.floor(Date.now() / 1000);
const token = sign({ sub: 'c-100', tenant: 'acme-bank', role: 'CUSTOMER', rooms: ['r-1'], iat: now, exp: now + 900 });
console.log('토큰:\n' + token.split('.').join('\n.') + '\n');

const [h, p] = token.split('.');
console.log('헤더 (base64url 디코드):', fromB64url(h!));
console.log('페이로드 (base64url 디코드):', fromB64url(p!));
console.log('→ 비밀키 없이도 누구나 읽을 수 있다. 서명은 "변조 방지"이지 "숨김"이 아니다.\n');

console.log('정상 검증:', verify(token).reason);

const forgedPayload = b64url(fromB64url(p!).replace('CUSTOMER', 'AGENT'));
console.log('역할을 AGENT 로 고친 토큰:', verify(`${h}.${forgedPayload}.${token.split('.')[2]}`).reason);

const none = `${b64url(JSON.stringify({ alg: 'none' }))}.${forgedPayload}.`;
console.log('alg:none 토큰:', verify(none).reason);

console.log('다른 비밀키로 서명:', verify(sign({ sub: 'x' }, 'attacker-secret')).reason);
console.log('16분 뒤:', verify(token, now + 16 * 60).reason);

console.log(`
정리
  JWS(서명): 지금 본 것. 누구나 읽음, 아무도 못 고침.        ← 이 프로젝트가 쓰는 것
  JWE(암호화): 내용을 암호화. 키 없으면 못 읽음.             ← 토큰에 꼭 비밀을 넣어야 할 때 (드묾)
  Bearer: "이 토큰을 가진 사람(bearer)을 그 사용자로 믿는다" → 탈취되면 그대로 사칭된다. 그래서 짧은 만료 + HTTPS 필수.
`);
