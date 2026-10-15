/**
 * 01장 실습: 프레임워크 없이 TCP 소켓 위에서 HTTP 를 "글자 그대로" 본다.
 *
 *   npm run lab:01:server
 *   다른 터미널: curl -v http://localhost:8000/hello?name=kim
 *   브라우저:   http://localhost:8000/hello  (브라우저가 보내는 헤더가 훨씬 많다는 것을 비교)
 *
 * HTTP 는 결국 "약속된 형식의 텍스트"다. 요청 첫 줄(메서드 경로 버전) + 헤더들 + 빈 줄 + 본문.
 */
import { createServer } from 'node:net';

const PORT = 8000;

createServer((socket) => {
  // 포트(8000)는 "이 컴퓨터의 어느 프로그램에게 갈 것인가"를 구분하는 번호다.
  console.log(`\n=== 새 TCP 연결: ${socket.remoteAddress}:${socket.remotePort} → :${PORT} ===`);
  socket.once('data', (buf) => {
    const raw = buf.toString('utf8');
    console.log('--- 받은 요청 원문 ---');
    console.log(raw.replace(/\r\n/g, '⏎\n')); // 줄바꿈이 \r\n(CRLF)라는 것을 눈으로 확인

    const [requestLine] = raw.split('\r\n');
    const [method, target] = (requestLine ?? '').split(' ');
    const body = JSON.stringify({ youSent: { method, target }, note: '이 응답도 직접 쓴 텍스트입니다' });

    // 응답도 텍스트: 상태 줄 + 헤더 + 빈 줄 + 본문. Content-Length 는 "바이트" 수 (14장)
    const response =
      'HTTP/1.1 200 OK\r\n' +
      'Content-Type: application/json; charset=utf-8\r\n' +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      'Connection: close\r\n' +
      '\r\n' +
      body;
    console.log('--- 보낸 응답 원문 ---');
    console.log(response.replace(/\r\n/g, '⏎\n'));
    socket.end(response); // HTTP/1.1 기본은 keep-alive 지만 여기선 단순하게 닫는다
  });
}).listen(PORT, () => console.log(`raw HTTP 서버: http://localhost:${PORT}  (Ctrl+C 로 종료)`));
