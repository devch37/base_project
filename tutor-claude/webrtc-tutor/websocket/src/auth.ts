/**
 * auth.ts — WebSocket 접속 인증 (ticket 방식) + Origin 검사
 *
 * ── 왜 WebSocket 인증은 HTTP API 인증보다 까다로운가? ──────────────────────────
 *  브라우저의 `new WebSocket(url)` 은 **커스텀 헤더를 붙일 수 없습니다.**
 *  (Authorization: Bearer ... 불가)  선택지는 다음과 같습니다.
 *
 *   A) 쿠키          : 같은 사이트면 자동 전송. 하지만 CSWSH(Cross-Site WebSocket Hijacking)에
 *                      취약 → 반드시 Origin 검사가 필요.
 *   B) URL 쿼리 토큰 : `wss://host/ws?ticket=...`. 간단하지만 URL이 프록시/액세스 로그에 남는다.
 *                      → "짧은 수명(≤60s) + 1회용" 티켓으로 위험을 줄인다.   ◀ 이 파일이 구현하는 방식
 *   C) 첫 메시지 인증 : 연결 후 첫 메시지로 토큰 전송. 인증 전 연결을 오래 열어 두는 문제(DoS)가 있다.
 *   D) Sec-WebSocket-Protocol 헤더에 토큰 넣기 : 헤더라서 로그엔 덜 남지만 "편법"이라 비권장.
 *
 *  실무 표준 흐름(B):
 *   1. 클라이언트가 평소 인증(쿠키/Bearer)으로 `POST /api/ws-ticket` 호출
 *   2. 서버가 30초짜리 서명된 티켓 발급
 *   3. 클라이언트가 `wss://host/ws?ticket=...` 로 접속
 *   4. 서버는 업그레이드 시점에 티켓 검증 → 통과해야만 101 Switching Protocols
 *
 * 이 파일의 티켓은 "HMAC-SHA256 서명 + 만료 시각" 구조의 최소 구현입니다(JWT와 같은 원리).
 * 운영에서는 `jose` 같은 검증된 JWT 라이브러리 + 키 로테이션(kid)을 권장합니다.
 */
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { AuthError } from './errors';

export interface TicketClaims {
  /** subject: 사용자 ID */
  sub: string;
  /** 만료 시각 (epoch seconds) */
  exp: number;
  /** 티켓 고유 ID — 재사용(replay) 방지용 */
  jti: string;
  /** 이 티켓으로 입장 가능한 방 등 앱 정의 클레임 */
  [extra: string]: unknown;
}

const b64u = (buf: Buffer | string): string => Buffer.from(buf).toString('base64url');

function sign(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

export interface IssueOptions {
  sub: string;
  /** 유효 시간(초). 기본 30초 — 티켓은 "발급 직후 바로 쓰는 것"이라 짧을수록 안전 */
  ttlSec?: number;
  extra?: Record<string, unknown>;
  now?: number; // epoch ms (테스트용)
}

export function issueTicket(opts: IssueOptions, secret: string): string {
  const now = opts.now ?? Date.now();
  const claims: TicketClaims = {
    ...opts.extra,
    sub: opts.sub,
    exp: Math.floor(now / 1000) + (opts.ttlSec ?? 30),
    jti: randomUUID(),
  };
  const payload = b64u(JSON.stringify(claims));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyTicket(token: string | null | undefined, secret: string, now: number = Date.now()): TicketClaims {
  if (!token) throw new AuthError('missing_ticket', '티켓이 없습니다');
  const parts = token.split('.');
  if (parts.length !== 2) throw new AuthError('malformed_ticket', '티켓 형식이 올바르지 않습니다');
  const [payload, sig] = parts as [string, string];

  // 서명 비교는 반드시 "상수 시간 비교". 일반 === 는 일치하는 앞부분 길이를 시간 차이로 흘린다(타이밍 공격).
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new AuthError('bad_signature', '티켓 서명이 올바르지 않습니다');
  }

  let claims: TicketClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TicketClaims;
  } catch {
    throw new AuthError('malformed_ticket', '티켓 본문을 읽을 수 없습니다');
  }
  if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number' || typeof claims.jti !== 'string') {
    throw new AuthError('malformed_ticket', '필수 클레임이 없습니다');
  }
  if (claims.exp * 1000 <= now) throw new AuthError('expired_ticket', '티켓이 만료되었습니다');
  return claims;
}

/**
 * 티켓 1회용 보장을 위한 저장소 인터페이스.
 * 여러 서버(노드)가 있다면 반드시 Redis `SET key NX EX ttl` 같은 공유 저장소를 구현해서 써야 한다.
 */
export interface TicketStore {
  /** 처음 소비하면 true, 이미 소비된 jti 면 false */
  consume(jti: string, ttlMs: number): Promise<boolean>;
}

export class MemoryTicketStore implements TicketStore {
  private readonly seen = new Map<string, number>(); // jti → 만료 시각(ms)

  async consume(jti: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    // 만료된 항목 청소 (무한히 쌓이지 않도록)
    for (const [k, exp] of this.seen) if (exp <= now) this.seen.delete(k);
    if (this.seen.has(jti)) return false;
    this.seen.set(jti, now + ttlMs);
    return true;
  }
}

/**
 * Origin 검사 — CSWSH 방어의 핵심.
 *
 * WebSocket 핸드셰이크는 CORS(동일 출처 정책) 대상이 아닙니다!
 * 악성 사이트 evil.com 의 스크립트가 `new WebSocket('wss://bank.com/ws')` 를 호출하면
 * 브라우저는 bank.com 의 쿠키를 함께 보내 버립니다. 서버가 Origin 헤더를 확인하지 않으면
 * 로그인된 사용자의 권한으로 악성 사이트가 소켓을 열 수 있습니다.
 *
 *  - 브라우저는 Origin 헤더를 항상 붙이고, 스크립트가 위조할 수 없다.
 *  - 브라우저가 아닌 클라이언트(서버, wscat 등)는 Origin 이 없을 수 있다 → allowNoOrigin 정책으로 결정.
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowed: readonly string[] | '*',
  allowNoOrigin = true,
): boolean {
  if (allowed === '*') return true;
  if (!origin) return allowNoOrigin;
  return allowed.includes(origin);
}
