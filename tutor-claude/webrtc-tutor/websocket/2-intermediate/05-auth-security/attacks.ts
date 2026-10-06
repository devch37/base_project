/**
 * attacks.ts — 공격자의 시점에서 서버를 두드려 본다 (학습용, 내 서버에만!)
 *
 * 각 함수는 "업그레이드가 어떻게 끝났는가"를 숫자(HTTP 상태)나 close code 로 돌려준다.
 */
import WebSocket from 'ws';

export type Outcome = { kind: 'open' } | { kind: 'rejected'; status: number } | { kind: 'closed'; code: number };

/** 접속을 시도하고 결과를 분류. (거절되면 ws 는 'unexpected-response' 로 HTTP 상태를 알려 준다) */
export function tryConnect(url: string, origin?: string): Promise<{ outcome: Outcome; ws?: WebSocket }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(url, origin ? { origin } : {});
    ws.once('open', () => resolve({ outcome: { kind: 'open' }, ws }));
    ws.once('unexpected-response', (_req, res) => resolve({ outcome: { kind: 'rejected', status: res.statusCode ?? 0 } }));
    ws.once('error', () => {});
  });
}

export function waitClose(ws: WebSocket): Promise<{ code: number; reason: string }> {
  return new Promise((resolve) => ws.once('close', (code, reason) => resolve({ code, reason: reason.toString() })));
}

/** 정상 로그인 흐름: 세션 쿠키로 티켓을 받는다 */
export async function fetchTicket(port: number, sessionId: string): Promise<string | null> {
  const res = await fetch(`http://127.0.0.1:${port}/api/ws-ticket`, { method: 'POST', headers: { cookie: `session=${sessionId}` } });
  if (!res.ok) return null;
  return ((await res.json()) as { ticket: string }).ticket;
}
