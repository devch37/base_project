/**
 * "고객사 백엔드" 흉내 (10·11·12장, 06장의 서버 간 호출).
 *
 * 실제 구조:
 *   [고객 브라우저] ──(고객사 로그인 세션)──▶ [고객사 서버] ──(X-Api-Key)──▶ [우리 채팅 서버 /internal/**]
 *                   ◀────── JWT ─────────────
 *
 * 왜 브라우저가 직접 /internal/tokens 를 부르면 안 되나?
 *   API 키가 JS 번들에 들어가는 순간 전 세계에 공개된다. 누구나 아무 고객·상담사 토큰을 발급받을 수 있다.
 *   API 키는 "서버에만" 있고, 서버는 자기 로그인 세션으로 사용자를 확인한 뒤 그 사람 몫의 토큰만 받아다 준다.
 *
 * 이 실습 서버는 로그인 과정을 생략하고 "누구든 원하는 ID 로" 토큰을 받아 준다 — 실습용이기 때문.
 *
 * 실행: npm run tenant
 *   CHAT_SERVERS=http://localhost:8081,http://localhost:8082 npm run tenant   (클러스터 실습, 23장)
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

const PORT = Number(process.env.TENANT_PORT ?? 3000);
const API_KEY = process.env.TENANT_API_KEY ?? 'dev-acme-key';
const CHAT_SERVERS = (process.env.CHAT_SERVERS ?? 'http://localhost:8080').split(',').map((s) => s.trim());

/** 고객 ID → 방 ID. 고객이 새로고침해도 같은 방으로 돌아가게 (24장: 페이지 이동 후 재연결) */
const customerRooms = new Map<string, string>();

class UpstreamError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/**
 * 채팅 서버 내부 API 호출 (06장 실전판).
 *  - 타임아웃 3초 (AbortSignal.timeout)
 *  - 서버가 여러 대면 연결 실패 시 다음 서버로 (4xx 는 "내 요청이 틀림"이라 다른 서버로 가도 같다 → 즉시 실패)
 */
async function chatApi<T>(method: string, path: string, body?: unknown): Promise<T> {
  let lastError: unknown;
  for (const base of CHAT_SERVERS) {
    try {
      const res = await fetch(base + path, {
        method,
        headers: { 'X-Api-Key': API_KEY, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      });
      const text = await res.text();
      if (res.status >= 400 && res.status < 500) throw new UpstreamError(res.status, text);
      if (!res.ok) {
        lastError = new UpstreamError(res.status, text);
        continue; // 5xx → 다른 서버 시도
      }
      return (text ? JSON.parse(text) : {}) as T;
    } catch (e) {
      if (e instanceof UpstreamError && e.status < 500) throw e;
      lastError = e; // 연결 거부·타임아웃 → 다음 서버
    }
  }
  throw new UpstreamError(502, `채팅 서버에 연결할 수 없습니다: ${(lastError as Error)?.message ?? lastError}`);
}

type Handler = (req: IncomingMessage, body: Record<string, unknown>, url: URL) => Promise<unknown>;

const routes: Record<string, Handler> = {
  // 고객: 상담 시작 (방이 없으면 만들고, 있으면 재사용) + 토큰
  'POST /tenant/customer/session': async (_req, body) => {
    const customerId = String(body.customerId ?? 'customer-1');
    let roomId = customerRooms.get(customerId);
    if (body.newRoom || !roomId) {
      roomId = (await chatApi<{ roomId: string }>('POST', '/internal/rooms', { customerId })).roomId;
      customerRooms.set(customerId, roomId);
    }
    const t = await chatApi<{ token: string; expiresAt: string }>('POST', '/internal/tokens', {
      userId: customerId, role: 'CUSTOMER', roomId, ttlSeconds: body.ttlSeconds,
    });
    return { roomId, ...t };
  },
  // 고객: 재연결·만료 시 새 토큰
  'POST /tenant/customer/token': async (_req, body) =>
    chatApi('POST', '/internal/tokens', { userId: body.customerId, role: 'CUSTOMER', roomId: body.roomId, ttlSeconds: body.ttlSeconds }),

  // 상담사: 토큰 (상담사는 방이 토큰에 없다 — 배정은 서버가 관리)
  'POST /tenant/agent/token': async (_req, body) =>
    chatApi('POST', '/internal/tokens', { userId: body.agentId ?? 'agent-1', role: 'AGENT', ttlSeconds: body.ttlSeconds }),

  'GET /tenant/rooms': async () => chatApi('GET', '/internal/rooms'),
  'POST /tenant/rooms/assign': async (_req, body) =>
    chatApi('POST', `/internal/rooms/${encodeURIComponent(String(body.roomId))}/agents`, { agentId: body.agentId }),
  'POST /tenant/rooms/unassign': async (_req, body) =>
    chatApi('DELETE', `/internal/rooms/${encodeURIComponent(String(body.roomId))}/agents/${encodeURIComponent(String(body.agentId))}`),
  'POST /tenant/kick': async (_req, body) => chatApi('POST', `/internal/users/${encodeURIComponent(String(body.userId))}/kick`),
};

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

function send(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const handler = routes[`${req.method} ${url.pathname}`];
  if (!handler) return send(res, 404, { error: 'not found' });
  try {
    send(res, 200, await handler(req, await readJson(req), url));
  } catch (e) {
    const status = e instanceof UpstreamError ? e.status : 500;
    console.error(`[tenant] ${req.method} ${url.pathname} → ${status}`, (e as Error).message);
    send(res, status, { error: (e as Error).message });
  }
}).listen(PORT, () => {
  console.log(`[tenant] 고객사 백엔드 http://localhost:${PORT}  → 채팅 서버 ${CHAT_SERVERS.join(', ')}`);
});
