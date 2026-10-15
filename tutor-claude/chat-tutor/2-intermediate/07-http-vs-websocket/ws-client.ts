/**
 * 07장 실습: WebSocket 핸드셰이크를 "손으로" 보내 보고, 그다음 WebSocket API 로 에코를 해 본다.
 *   1) ./gradlew :server:raw-websocket:bootRun
 *   2) npm run lab:07
 */
import { connect } from 'node:net';
import { createHash, randomBytes } from 'node:crypto';

const HOST = 'localhost';
const PORT = 8080;

function handshakeByHand(): Promise<void> {
  return new Promise((resolve) => {
    const key = randomBytes(16).toString('base64'); // 매번 새 무작위 값
    const socket = connect(PORT, HOST, () => {
      const request =
        'GET /ws/echo HTTP/1.1\r\n' +
        `Host: ${HOST}:${PORT}\r\n` +
        'Upgrade: websocket\r\n' + // "이 연결을 WebSocket 으로 바꾸자"
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Key: ${key}\r\n` +
        'Sec-WebSocket-Version: 13\r\n' +
        'Origin: http://localhost:5173\r\n' +
        '\r\n';
      console.log('--- 보낸 핸드셰이크 (평범한 HTTP GET) ---\n' + request.replace(/\r\n/g, '⏎\n'));
      socket.write(request);
    });
    socket.once('data', (buf) => {
      const head = buf.toString('latin1').split('\r\n\r\n')[0]!;
      console.log('--- 받은 응답 ---\n' + head + '\n');
      // 서버는 Key + 고정 GUID 를 SHA-1 해서 돌려준다 → "WebSocket 을 아는 서버"임을 증명 (캐시 프록시의 엉뚱한 응답 방지)
      const expected = createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
      console.log(`Sec-WebSocket-Accept 기대값 = ${expected}  → ${head.includes(expected) ? '일치 ✓' : '불일치'}`);
      console.log('101 이후 이 TCP 연결은 더 이상 HTTP 가 아니다. 이후 바이트는 WebSocket "프레임" 형식이다.\n');
      socket.destroy();
      resolve();
    });
    socket.on('error', (e) => {
      console.error(`연결 실패: ${e.message} — raw-websocket 서버를 먼저 띄우세요`);
      process.exit(1);
    });
  });
}

async function echoWithApi(): Promise<void> {
  // Node 22+ 에는 브라우저와 같은 WebSocket 이 내장돼 있다
  const ws = new WebSocket(`ws://${HOST}:${PORT}/ws/echo`);
  ws.onmessage = (e) => console.log(`◀ ${e.data}`);
  await new Promise((r) => (ws.onopen = r));
  console.log('open (readyState=1). 서버가 먼저 보낸 welcome 이 보일 것이다');
  for (const text of ['안녕', 'WebSocket']) {
    console.log(`▶ ${text}`);
    ws.send(text);
    await new Promise((r) => setTimeout(r, 200));
  }
  ws.onclose = (e) => console.log(`close code=${e.code} reason=${e.reason}`);
  ws.close(1000, 'bye');
  await new Promise((r) => setTimeout(r, 200));
  console.log('\n참고: 이 Node 클라이언트는 Origin 헤더를 보내지 않는데도 연결된다.');
  console.log('Origin 검사는 "브라우저가 다른 사이트에서 몰래 여는 것"만 막는다. 인증(12장)은 여전히 필요하다.');
}

await handshakeByHand();
await echoWithApi();
