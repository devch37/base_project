/**
 * server.ts — 가장 단순한 WebSocket 에코 서버 (ws 라이브러리)
 *
 * 직접 실행:   npx tsx websocket/1-basic/01-handshake-echo/server.ts
 * 브라우저에서 시험하려면 개발자도구 콘솔에서:
 *     const ws = new WebSocket('ws://localhost:8080'); ws.onmessage = e => console.log(e.data); ws.onopen = () => ws.send('hi')
 */
import { type WebSocket, WebSocketServer } from 'ws';
import { isMain, say } from '../../tools/narrate';

export function startEchoServer(port = 8080): Promise<{ port: number; wss: WebSocketServer; close(): Promise<void> }> {
  // port 를 주면 ws 가 내부적으로 HTTP 서버를 만들어 준다 (가장 간편한 방식).
  // 실무에서는 인증/Origin 검사를 위해 { noServer: true } 방식을 쓴다 → 5장
  const wss = new WebSocketServer({ port });

  // 'connection' 은 "핸드셰이크가 끝나 WebSocket 이 열린 순간"에 발생한다.
  wss.on('connection', (socket: WebSocket, req) => {
    say.server(`연결됨: ${req.socket.remoteAddress}:${req.socket.remotePort}  (현재 ${wss.clients.size}명)`);

    // 'message' : 클라이언트가 보낸 한 "메시지"(프레임이 아니라 메시지 단위)
    // ws v8 부터 data 는 Buffer 이고, 텍스트인지 바이너리인지는 두 번째 인자 isBinary 로 알려 준다.
    socket.on('message', (data, isBinary) => {
      say.server(`받음: ${isBinary ? `[바이너리 ${(data as Buffer).length}B]` : data.toString()}`);
      // 받은 그대로 되돌려 준다. isBinary 를 넘겨야 텍스트/바이너리 타입이 보존된다.
      socket.send(data, { binary: isBinary });
    });

    // 'close' : 연결이 닫힐 때. code 는 close code(1000=정상), reason 은 사유 문자열
    socket.on('close', (code, reason) => {
      say.server(`종료됨: code=${code} reason="${reason.toString()}"`);
    });

    // ★ 'error' 핸들러가 없으면 소켓 에러가 uncaught exception 이 되어 프로세스 전체가 죽는다
    socket.on('error', (err) => say.server(`소켓 에러: ${err.message}`));
  });

  return new Promise((resolve) => {
    wss.on('listening', () => {
      const addr = wss.address();
      const actual = typeof addr === 'object' && addr ? addr.port : port;
      say.server(`에코 서버 시작: ws://localhost:${actual}`);
      resolve({
        port: actual,
        wss,
        close: () =>
          new Promise<void>((r) => {
            for (const c of wss.clients) c.terminate();
            wss.close(() => r());
          }),
      });
    });
  });
}

if (isMain(import.meta.url)) await startEchoServer(Number(process.env.PORT ?? 8080));
