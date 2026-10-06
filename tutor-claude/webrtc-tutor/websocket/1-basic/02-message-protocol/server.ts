/**
 * server.ts — 타입 안전한 메시지 라우팅 서버
 *
 * 흐름:  raw 문자열 → JSON.parse → zod 검증 → type 별 핸들러 → 응답(replyTo = 요청 id)
 *
 * 보너스: `slow.work` 는 서로 다른 시간 뒤에 응답해서 "응답이 요청 순서와 다르게 도착"하는 상황을 만든다.
 *         이때 replyTo(상관관계 ID) 없이는 어느 응답이 어느 요청의 것인지 알 수 없다.
 */
import { type WebSocket, WebSocketServer } from 'ws';
import { isMain, say, sleep } from '../../tools/narrate';
import { type ErrorCode, type Request, type Response, requestSchema } from './messages';

/** 핸들러 맵: 요청 type → 처리 함수. 키가 requestSchema 의 type 과 어긋나면 컴파일 에러가 나도록 타입을 건다 */
type Handlers = { [T in Request['type']]: (req: Extract<Request, { type: T }>) => Promise<unknown> | unknown };

const handlers: Handlers = {
  'math.add': (req) => req.payload.a + req.payload.b,
  'time.now': () => new Date().toISOString(),
  'slow.work': async (req) => {
    await sleep(req.payload.ms);
    return { workedMs: req.payload.ms };
  },
  // 서버가 응답을 깜빡한 상황(버그/장애)을 흉내 → 클라이언트 타임아웃 데모용
  'never.replies': () => new Promise(() => {}),
};

function send(ws: WebSocket, res: Response): void {
  ws.send(JSON.stringify(res));
}
const fail = (ws: WebSocket, code: ErrorCode, message: string, replyTo?: string) =>
  send(ws, { v: 1, type: 'error', ...(replyTo ? { replyTo } : {}), error: { code, message } });

export function startServer(port = 0): Promise<{ port: number; close(): Promise<void> }> {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    // 서버가 먼저 푸시하는 이벤트도 같은 연결로 보낼 수 있다 (WebSocket 이 HTTP 와 다른 점)
    let n = 0;
    const ticker = setInterval(() => send(ws, { v: 1, type: 'event.tick', payload: { n: ++n } }), 250);
    ws.on('close', () => clearInterval(ticker));
    ws.on('error', () => {});

    ws.on('message', async (data) => {
      // 1) JSON 파싱 — 실패는 "예외"가 아니라 "흔한 입력 오류"
      let json: unknown;
      try {
        json = JSON.parse(data.toString());
      } catch {
        return fail(ws, 'bad_json', 'JSON 이 아닙니다');
      }

      // 2) 버전 확인 — 프로토콜을 바꿀 때 구버전 클라이언트를 정중히 거절하기 위해
      const ver = (json as { v?: unknown } | null)?.v;
      if (ver !== 1) return fail(ws, 'unsupported_version', `지원하지 않는 버전: ${String(ver)}`);

      // 3) 스키마 검증
      const parsed = requestSchema.safeParse(json);
      if (!parsed.success) {
        const type = (json as { type?: unknown }).type;
        const id = (json as { id?: string }).id;
        const known = ['math.add', 'time.now', 'slow.work', 'never.replies'].includes(String(type));
        // 이슈 상세는 클라이언트 개발자에게 도움이 되지만, 내부 구현 정보를 과하게 노출하지 않도록 첫 이슈만 요약
        const issue = parsed.error.issues[0];
        return fail(ws, known ? 'bad_payload' : 'unknown_type', known ? `${issue?.path.join('.')}: ${issue?.message}` : `알 수 없는 type: ${String(type)}`, id);
      }

      // 4) 라우팅 + 실행. 핸들러 예외는 "서버 버그"이므로 상세를 숨기고 internal 로만 알린다.
      const req = parsed.data;
      try {
        const handler = handlers[req.type] as (r: Request) => unknown;
        const result = await handler(req);
        send(ws, { v: 1, type: 'result', replyTo: req.id, payload: result });
      } catch (e) {
        say.server(`핸들러 예외: ${(e as Error).message}`);
        fail(ws, 'internal', '서버 내부 오류', req.id);
      }
    });
  });

  return new Promise((resolve) => {
    wss.on('listening', () => {
      const port = (wss.address() as { port: number }).port;
      resolve({
        port,
        close: () =>
          new Promise<void>((r) => {
            for (const c of wss.clients) c.terminate();
            wss.close(() => r());
          }),
      });
    });
  });
}

if (isMain(import.meta.url)) {
  const s = await startServer(Number(process.env.PORT ?? 8080));
  say.server(`2장 서버: ws://localhost:${s.port}`);
}
