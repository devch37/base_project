/**
 * 21장 실습: 아주 작은 리버스 프록시. nginx 가 하는 일을 눈으로 보기 위한 것.
 *
 *   npm run lab:21:proxy -- --mode=good                 정상: HTTP + WebSocket Upgrade 를 그대로 전달
 *   npm run lab:21:proxy -- --mode=no-upgrade           Upgrade 를 모르는 프록시 흉내 → WebSocket 실패
 *   npm run lab:21:proxy -- --mode=idle --idle=15       15초 동안 조용한 연결을 끊는 프록시 흉내 → heartbeat 의 필요성
 *   npm run lab:21:proxy -- --targets=8081,8082          여러 서버로 라운드로빈 (23장 로드밸런싱)
 *
 * 프록시 주소: http://localhost:8888  → 뒤의 서버(기본 8080)
 */
import { createServer, request, type IncomingMessage } from 'node:http';
import { connect, type Socket } from 'node:net';

const arg = (name: string, def: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? def;
const MODE = arg('mode', 'good');
const IDLE_SEC = Number(arg('idle', '15'));
const TARGETS = arg('targets', '8080').split(',').map(Number);
const PORT = 8888;
let rr = 0;
const pick = () => TARGETS[rr++ % TARGETS.length]!;

const server = createServer((req, res) => {
  // 일반 HTTP: 요청을 그대로 뒤로 보내고 응답을 그대로 돌려준다
  const port = pick();
  const upstream = request(
    { host: '127.0.0.1', port, path: req.url, method: req.method, headers: { ...req.headers, 'x-forwarded-for': req.socket.remoteAddress ?? '' } },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502);
    res.end('bad gateway');
  });
  req.pipe(upstream);
  console.log(`[http] ${req.method} ${req.url} → :${port}`);
});

// WebSocket: 클라이언트가 "Upgrade: websocket" 을 보내면 Node 는 'upgrade' 이벤트를 준다
server.on('upgrade', (req: IncomingMessage, client: Socket, head: Buffer) => {
  if (MODE === 'no-upgrade') {
    // Upgrade 를 모르는 프록시: 뒤 서버에 일반 요청처럼 보내 버리거나(헤더 누락) 거절한다
    console.log(`[ws] ${req.url} → Upgrade 전달 안 함 (Connection/Upgrade 헤더를 버리는 프록시 흉내)`);
    client.end('HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n');
    return;
  }
  const port = pick();
  const upstream = connect(port, '127.0.0.1', () => {
    // 받은 핸드셰이크를 그대로 다시 써서 뒤 서버에 보낸다 — Upgrade/Connection 헤더 포함 (hop-by-hop 이지만 WebSocket 은 명시적으로 전달해야 함)
    const headers = Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n');
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\nX-Forwarded-For: ${client.remoteAddress}\r\n\r\n`);
    if (head.length) upstream.write(head);
    upstream.pipe(client);
    client.pipe(upstream);
  });
  console.log(`[ws] ${req.url} → :${port} (터널 연결)`);

  if (MODE === 'idle') {
    // 양쪽 모두 IDLE_SEC 동안 바이트가 안 흐르면 끊는다 (nginx proxy_read_timeout 흉내)
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        console.log(`[ws] ${IDLE_SEC}초 동안 조용함 → 프록시가 연결을 끊음`);
        client.destroy();
        upstream.destroy();
      }, IDLE_SEC * 1000);
    };
    client.on('data', reset);
    upstream.on('data', reset);
    reset();
  }
  const close = () => {
    client.destroy();
    upstream.destroy();
  };
  client.on('error', close);
  upstream.on('error', close);
  client.on('close', close);
  upstream.on('close', close);
});

server.listen(PORT, () => console.log(`프록시 :${PORT} → ${TARGETS.map((t) => `:${t}`).join(', ')}  mode=${MODE}${MODE === 'idle' ? ` idle=${IDLE_SEC}s` : ''}`));
