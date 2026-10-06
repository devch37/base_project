/**
 * server.ts — 하트비트(ping/pong) 서버
 *
 * ── 문제: 반쯤 죽은 연결 (half-open connection) ─────────────────────────────────
 *  TCP 는 "상대가 사라졌다"는 사실을 스스로 알아채지 못한다. 상대가
 *   - 와이파이에서 LTE 로 전환되었거나, 노트북 뚜껑을 덮었거나, 전원이 나갔거나
 *   - 중간 NAT/방화벽이 유휴 연결의 매핑을 지워 버렸다면
 *  FIN/RST 패킷이 오지 않으므로 서버는 연결이 멀쩡하다고 믿고 **수 분~수 시간** 동안 붙잡고 있다.
 *  (그동안 소켓, 메모리, 방 멤버십이 새고 "온라인" 표시가 거짓이 된다)
 *
 * ── 해결: 주기적으로 물어보고, 대답이 없으면 끊는다 ───────────────────────────────
 *   매 interval 마다
 *     1) 지난 라운드에 pong 이 안 왔다면(isAlive === false) → 죽은 연결. terminate()
 *     2) 아니면 isAlive = false 로 표시하고 ping 을 보낸다
 *     3) 상대가 pong 을 보내면 isAlive = true
 *   → 최대 2 interval 안에 죽은 연결이 정리된다.
 *
 * ── 프로토콜 ping vs 앱 레벨 ping ────────────────────────────────────────────────
 *   프로토콜 ping(opcode 0x9): 서버→클라이언트. 브라우저가 자동으로 pong 해 준다. 서버 쪽 감지용.
 *   앱 레벨 ping({"type":"ping"}): 브라우저 JS 는 ping 프레임을 못 보내므로, *클라이언트 쪽 감지*와
 *      RTT 측정은 JSON 메시지로 한다. 또한 일부 프록시는 제어 프레임을 무시하지만 데이터 프레임은 "활동"으로 본다.
 */
import { type WebSocket, WebSocketServer } from 'ws';
import { isMain, say } from '../../tools/narrate';

export interface HeartbeatServerOptions {
  port?: number;
  intervalMs?: number;
  /** false 면 하트비트를 끈다 (좀비 연결이 얼마나 오래 남는지 비교하기 위한 용도) */
  heartbeat?: boolean;
}

export function startHeartbeatServer(opts: HeartbeatServerOptions = {}): Promise<{ port: number; wss: WebSocketServer; terminated: () => number; close(): Promise<void> }> {
  const { port = 0, intervalMs = 1000, heartbeat = true } = opts;
  const wss = new WebSocketServer({ port });
  const isAlive = new WeakMap<WebSocket, boolean>();
  let terminatedCount = 0;

  wss.on('connection', (ws) => {
    isAlive.set(ws, true);
    ws.on('pong', () => isAlive.set(ws, true)); // 프로토콜 pong 이 오면 살아 있다
    ws.on('error', () => {});

    ws.on('message', (data) => {
      isAlive.set(ws, true); // 어떤 메시지든 받았다는 것은 살아 있다는 증거 → 불필요한 오판 방지
      const msg = JSON.parse(data.toString()) as { type: string; t?: number };
      if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong', t: msg.t })); // 앱 레벨 ping → pong
    });
  });

  const timer = heartbeat
    ? setInterval(() => {
        for (const ws of wss.clients) {
          if (isAlive.get(ws) === false) {
            say.server(`⏱ 하트비트 응답 없음 → 연결 강제 종료 (현재 ${wss.clients.size}명 → ${wss.clients.size - 1}명)`);
            terminatedCount++;
            ws.terminate(); // close 핸드셰이크를 기다리지 않고 소켓을 즉시 파괴 (상대가 죽었으니 응답이 올 리 없다)
            continue;
          }
          isAlive.set(ws, false); // "다음 라운드까지 pong 이 와야 한다"
          ws.ping();
        }
      }, intervalMs)
    : undefined;

  return new Promise((resolve) => {
    wss.on('listening', () => {
      resolve({
        port: (wss.address() as { port: number }).port,
        wss,
        terminated: () => terminatedCount,
        close: () =>
          new Promise<void>((r) => {
            if (timer) clearInterval(timer);
            for (const c of wss.clients) c.terminate();
            wss.close(() => r());
          }),
      });
    });
  });
}

if (isMain(import.meta.url)) {
  const s = await startHeartbeatServer({ port: Number(process.env.PORT ?? 8080) });
  say.server(`4장 하트비트 서버: ws://localhost:${s.port}`);
}
