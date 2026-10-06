/**
 * server.ts — 보안이 적용된 WebSocket 서버 (noServer + 업그레이드 시점 인증)
 *
 * 흐름
 *   ① 브라우저가 평소 방식(쿠키 세션)으로 HTTP `POST /api/ws-ticket` 호출 → 30초짜리 1회용 ticket 발급
 *   ② `new WebSocket('wss://host/ws?ticket=...')` 로 접속
 *   ③ 서버는 **업그레이드 요청 단계에서** 아래를 순서대로 검사하고, 하나라도 실패하면 101 대신 HTTP 오류로 거절
 *        경로 → Origin(CSWSH 방어) → ticket 서명/만료 → ticket 1회용(재사용 방지)
 *   ④ 연결 후에도: 메시지 크기 제한(maxPayload), 연결 최대 수명, 로그아웃 시 강제 종료
 *
 * 핵심 개념은 `src/auth.ts` 에 주석으로 자세히 설명되어 있다. 여기서는 그것을 "서버에 꽂는 방법"을 본다.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import { type WebSocket, WebSocketServer } from 'ws';
import { AuthError, CloseCode, MemoryTicketStore, isOriginAllowed, issueTicket, verifyTicket } from '@tutor/ws-kit';
import { isMain, say } from '../../tools/narrate';

export interface SecureServerOptions {
  port?: number;
  secret?: string;
  allowedOrigins?: string[];
  /** 한 연결이 살 수 있는 최대 시간. 지나면 4002(토큰 만료)로 끊어 "재인증"을 강제한다 */
  maxConnectionAgeMs?: number;
}

export async function startSecureServer(opts: SecureServerOptions = {}) {
  const secret = opts.secret ?? 'dev-secret-change-me';
  const allowedOrigins = opts.allowedOrigins ?? ['https://app.example.com'];
  const maxAge = opts.maxConnectionAgeMs ?? 60 * 60 * 1000;

  // 데모용 세션 저장소: 실제로는 DB/Redis 에 있는 로그인 세션이다.
  const sessions = new Map<string, string>([['sess-alice', 'alice'], ['sess-bob', 'bob']]);
  const usedTickets = new MemoryTicketStore(); // 다중 서버면 Redis(SET NX EX)로 교체해야 한다
  const sockets = new Map<string, Set<WebSocket>>(); // userId → 연결들 (로그아웃 시 강제 종료용)

  // ── HTTP: 티켓 발급 API ───────────────────────────────────────────────────────
  const http = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'POST' && req.url === '/api/ws-ticket') {
      // 평소 인증(여기선 쿠키 흉내). 인증된 사용자에게만 티켓을 준다.
      const sid = /(?:^|;\s*)session=([^;]+)/.exec(req.headers.cookie ?? '')?.[1];
      const user = sid ? sessions.get(sid) : undefined;
      if (!user) return void res.writeHead(401).end();
      // ticket 에 담는 정보는 최소로. 권한(role)은 ticket 이 아니라 접속 시점의 DB 조회가 더 안전하다.
      const ticket = issueTicket({ sub: user, ttlSec: 30 }, secret);
      return void res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ticket }));
    }
    res.writeHead(404).end();
  });

  const wss = new WebSocketServer({
    noServer: true, // 업그레이드를 우리가 직접 통제한다
    maxPayload: 1024, // ★ 메시지 1건 최대 1KB. 초과하면 ws 가 1009 로 연결을 닫는다 (메모리 DoS 방어)
  });

  // ── HTTP Upgrade: 여기가 보안의 "정문" ───────────────────────────────────────
  http.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    socket.on('error', () => {}); // 인증 중 클라이언트가 끊어도 프로세스가 죽지 않도록

    const deny = (status: number, text: string, why: string) => {
      say.server(`🚫 업그레이드 거절 ${status} (${why})`);
      socket.write(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
      socket.destroy();
    };

    void (async () => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (url.pathname !== '/ws') return deny(404, 'Not Found', '경로');

      // ① Origin 검사 — CSWSH(Cross-Site WebSocket Hijacking) 방어
      //    쿠키 인증만 쓰는 서비스라면 이것이 "유일한" 방어선이다.
      if (!isOriginAllowed(req.headers.origin, allowedOrigins, false)) {
        return deny(403, 'Forbidden', `허용되지 않은 Origin: ${req.headers.origin ?? '(없음)'}`);
      }

      // ② ticket 검증 (서명 + 만료)
      let claims;
      try {
        claims = verifyTicket(url.searchParams.get('ticket'), secret);
      } catch (e) {
        return deny(401, 'Unauthorized', e instanceof AuthError ? e.code : 'error');
      }

      // ③ 1회용 보장: 같은 ticket 으로 두 번 접속 불가 (URL 이 로그/히스토리에 남아 유출돼도 재사용 불가)
      if (!(await usedTickets.consume(claims.jti, 60_000))) {
        return deny(401, 'Unauthorized', 'ticket 재사용(replay)');
      }

      if (socket.destroyed) return;
      wss.handleUpgrade(req, socket, head, (ws) => onConnection(ws, claims.sub));
    })();
  });

  function onConnection(ws: WebSocket, userId: string): void {
    say.server(`✅ ${userId} 접속 허용`);
    let set = sockets.get(userId);
    if (!set) sockets.set(userId, (set = new Set()));
    set.add(ws);

    // 연결 최대 수명: ticket 은 "접속 순간"만 검증하므로, 연결이 영원히 살면 만료/폐기된 권한이 계속 유효해진다.
    const ageTimer = setTimeout(() => ws.close(CloseCode.TOKEN_EXPIRED, 'token expired'), maxAge);

    ws.on('message', (data) => ws.send(`echo(${userId}): ${data.toString().slice(0, 50)}`));
    ws.on('error', () => {});
    ws.on('close', () => {
      clearTimeout(ageTimer);
      set!.delete(ws);
    });
    ws.send(JSON.stringify({ type: 'welcome', userId }));
  }

  await new Promise<void>((r) => http.listen(opts.port ?? 0, '127.0.0.1', r));
  const port = (http.address() as { port: number }).port;

  return {
    port,
    secret,
    sessions,
    /** 로그아웃/계정 정지 등: 그 사용자의 모든 연결을 즉시 종료 */
    revokeUser(userId: string): number {
      let n = 0;
      for (const ws of sockets.get(userId) ?? []) (ws.close(CloseCode.AUTH_FAILED, 'revoked'), n++);
      return n;
    },
    close: () =>
      new Promise<void>((r) => {
        for (const c of wss.clients) c.terminate();
        wss.close();
        http.close(() => r());
        http.closeAllConnections();
      }),
  };
}

if (isMain(import.meta.url)) {
  const s = await startSecureServer({ port: Number(process.env.PORT ?? 8080) });
  say.server(`5장 보안 서버: http://localhost:${s.port}  (POST /api/ws-ticket, ws://…/ws?ticket=…)`);
}
