/**
 * raw-handshake.ts — WebSocket 의 정체를 직접 만져 보기 (라이브러리 없이!)
 *
 * "WebSocket = HTTP 업그레이드 + 길이가 붙은 프레임" 이라는 말을 코드로 확인합니다.
 *   1) HTTP 서버가 `Upgrade: websocket` 요청을 받아 직접 101 응답을 쓴다
 *   2) 그 뒤로는 HTTP 가 아니라 "프레임(frame)" 이라는 바이너리 규격으로 대화한다
 *   3) 클라이언트→서버 프레임은 반드시 "마스킹(XOR)" 되어 있다
 *
 * 실행:  npm run ws:01   (또는  npx tsx websocket/1-basic/01-handshake-echo/raw-handshake.ts)
 *
 * ※ 이 코드는 "이해용 미니 구현"입니다. 조각난(fragmented) 메시지, 압축, 확장 등은 처리하지 않습니다.
 *   실무에서는 반드시 검증된 라이브러리(ws 등)를 쓰세요.
 */
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import net from 'node:net';
import { say } from '../../tools/narrate';

// RFC 6455 가 정한 "마법의 문자열". 모든 WebSocket 서버가 똑같이 사용한다.
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/**
 * Sec-WebSocket-Accept 계산
 *   accept = base64( SHA1( Sec-WebSocket-Key + GUID ) )
 *
 * 왜 이런 번거로운 해시를 할까?
 *  → "이 서버가 진짜 WebSocket 을 이해하는 서버인가?"를 확인하려는 장치입니다.
 *    일반 HTTP 서버/캐시 프록시가 우연히 101 을 흉내 내는 사고를 막는 용도이지, 보안(인증) 기능이 아닙니다.
 */
export function computeAccept(secWebSocketKey: string): string {
  return createHash('sha1')
    .update(secWebSocketKey + WS_GUID)
    .digest('base64');
}

// ─────────────────────────────────────────────────────────────────────────────
// 프레임 인코딩/디코딩
//
//   0                   1                   2                   3
//   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
//  +-+-+-+-+-------+-+-------------+-------------------------------+
//  |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
//  |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
//  |N|V|V|V|       |S|             |                               |
//  | |1|2|3|       |K|             |                               |
//  +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
//  |  Masking-key (클라이언트→서버일 때만 4 bytes)  |  Payload Data   |
//  +-----------------------------------------------+-----------------+
//
//  opcode: 0x1 텍스트 · 0x2 바이너리 · 0x8 close · 0x9 ping · 0xA pong
//  len   : 0~125 → 그 값이 길이 / 126 → 뒤 2바이트가 길이 / 127 → 뒤 8바이트가 길이
// ─────────────────────────────────────────────────────────────────────────────

/** 서버→클라이언트 프레임: 마스킹 없음 */
export function encodeServerFrame(opcode: number, payload: Buffer): Buffer {
  const len = payload.length;
  let header: Buffer;
  if (len < 126) {
    header = Buffer.from([0x80 | opcode, len]); // 0x80 = FIN(마지막 조각) 비트
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

/** 클라이언트→서버 프레임: 반드시 마스킹 (브라우저/ws 클라이언트가 자동으로 해 주는 일) */
export function encodeClientFrame(opcode: number, payload: Buffer, maskKey = Buffer.from([0x37, 0xfa, 0x21, 0x3d])): Buffer {
  const len = payload.length;
  if (len > 125) throw new Error('이 데모는 125 bytes 이하만 지원');
  const masked = Buffer.from(payload);
  for (let i = 0; i < masked.length; i++) masked[i] = masked[i]! ^ maskKey[i % 4]!; // XOR 마스킹
  return Buffer.concat([Buffer.from([0x80 | opcode, 0x80 | len]), maskKey, masked]); // 0x80 | len = MASK 비트
}

export interface Frame {
  fin: boolean;
  opcode: number;
  masked: boolean;
  payload: Buffer;
  /** 이 프레임이 차지한 총 바이트 수 */
  size: number;
}

/** 버퍼 앞부분에서 프레임 1개를 읽는다. 아직 다 안 왔으면 null (TCP 는 "스트림"이라 프레임이 쪼개져 올 수 있다!) */
export function decodeFrame(buf: Buffer): Frame | null {
  if (buf.length < 2) return null;
  const fin = (buf[0]! & 0x80) !== 0;
  const opcode = buf[0]! & 0x0f;
  const masked = (buf[1]! & 0x80) !== 0;
  let len = buf[1]! & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    len = Number(buf.readBigUInt64BE(2));
    offset = 10;
  }
  let maskKey: Buffer | null = null;
  if (masked) {
    if (buf.length < offset + 4) return null;
    maskKey = buf.subarray(offset, offset + 4);
    offset += 4;
  }
  if (buf.length < offset + len) return null; // 페이로드가 아직 다 안 옴
  const payload = Buffer.from(buf.subarray(offset, offset + len));
  if (maskKey) for (let i = 0; i < payload.length; i++) payload[i] = payload[i]! ^ maskKey[i % 4]!;
  return { fin, opcode, masked, payload, size: offset + len };
}

const hex = (b: Buffer) => [...b].map((x) => x.toString(16).padStart(2, '0')).join(' ');

// ─────────────────────────────────────────────────────────────────────────────
// 직접 만든 WebSocket 서버: HTTP 서버의 'upgrade' 이벤트를 받아 101 을 직접 쓴다
// ─────────────────────────────────────────────────────────────────────────────
export function startRawServer(): Promise<{ port: number; close(): void }> {
  const server = createServer((_req, res) => {
    // 일반 HTTP 요청은 여기로 온다. WebSocket 요청은 'upgrade' 이벤트로 간다.
    res.writeHead(426, { Upgrade: 'websocket' }).end('Upgrade Required');
  });

  server.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    if (typeof key !== 'string') return void socket.destroy();

    // ① 핸드셰이크 응답: HTTP 101 Switching Protocols
    socket.write(
      ['HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${computeAccept(key)}`, '', ''].join('\r\n'),
    );
    say.server('101 응답을 보냈다. 이제 이 TCP 연결은 HTTP 가 아니라 WebSocket 프레임 전용이다.');

    // ② 이후 들어오는 바이트는 프레임으로 해석
    let pending: Buffer = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      pending = Buffer.concat([pending, chunk]);
      for (;;) {
        const f = decodeFrame(pending);
        if (!f) break; // 프레임이 덜 왔다 → 더 받아서 다시 시도
        pending = pending.subarray(f.size);

        if (f.opcode === 0x1) {
          const text = f.payload.toString('utf8');
          say.server(`텍스트 프레임 수신: "${text}" (masked=${f.masked})`);
          socket.write(encodeServerFrame(0x1, Buffer.from(`echo: ${text}`)));
        } else if (f.opcode === 0x9) {
          socket.write(encodeServerFrame(0xa, f.payload)); // ping 에는 같은 내용으로 pong
        } else if (f.opcode === 0x8) {
          // close 프레임: 앞 2바이트가 close code
          const code = f.payload.length >= 2 ? f.payload.readUInt16BE(0) : 1005;
          say.server(`close 프레임 수신 (code=${code}) → 같은 코드로 응답 후 TCP 종료`);
          socket.write(encodeServerFrame(0x8, f.payload));
          socket.end();
        }
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo;
      resolve({ port, close: () => (server.close(), server.closeAllConnections()) });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 데모: net 소켓으로 "손으로" 핸드셰이크와 프레임을 보내 본다
// ─────────────────────────────────────────────────────────────────────────────
export async function runRawDemo(): Promise<void> {
  say.title('0. WebSocket 의 정체: HTTP 업그레이드 + 프레임');
  const { port, close } = await startRawServer();

  // RFC 6455 문서에 나오는 예시 키 → 정답은 s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
  const exampleKey = 'dGhlIHNhbXBsZSBub25jZQ==';
  const expected = 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=';
  say.step('Sec-WebSocket-Accept 계산 검증 (RFC 예제)');
  say.note(`accept = base64(sha1(key + GUID))  →  ${computeAccept(exampleKey)}`);
  if (computeAccept(exampleKey) !== expected) throw new Error('accept 계산이 RFC 와 다릅니다');
  say.ok('RFC 6455 의 예제 값과 일치');

  await new Promise<void>((resolve, reject) => {
    const sock = net.connect(port, '127.0.0.1');
    let stage: 'handshake' | 'frames' = 'handshake';
    let buf: Buffer = Buffer.alloc(0);

    sock.on('connect', () => {
      say.step('① 클라이언트가 보내는 HTTP 업그레이드 요청 (사람이 읽을 수 있는 텍스트!)');
      const req = [
        'GET /chat HTTP/1.1',
        `Host: 127.0.0.1:${port}`,
        'Upgrade: websocket', // "HTTP 말고 WebSocket 으로 바꾸자"
        'Connection: Upgrade',
        `Sec-WebSocket-Key: ${exampleKey}`, // 랜덤 nonce (서버가 해시해서 돌려줄 것)
        'Sec-WebSocket-Version: 13',
        '',
        '',
      ].join('\r\n');
      req.split('\r\n').filter(Boolean).forEach((l) => say.net(`→ ${l}`));
      sock.write(req);
    });

    sock.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (stage === 'handshake') {
        const end = buf.indexOf('\r\n\r\n');
        if (end < 0) return;
        say.step('② 서버의 101 응답');
        buf.subarray(0, end).toString().split('\r\n').forEach((l) => say.net(`← ${l}`));
        if (!buf.toString().includes(expected)) return reject(new Error('Accept 헤더 불일치'));
        say.ok('Accept 값이 일치 → 핸드셰이크 성공');
        buf = buf.subarray(end + 4);
        stage = 'frames';

        // 이제부터는 프레임
        const hello = Buffer.from('Hello');
        const frame = encodeClientFrame(0x1, hello);
        say.step('③ 텍스트 프레임 전송 — "Hello" 는 5바이트인데 프레임은 몇 바이트일까?');
        say.net(`→ ${hex(frame)}   (${frame.length} bytes)`);
        say.note('81 = FIN(1)+텍스트(0x1) / 85 = MASK(1)+길이(5) / 다음 4바이트 = 마스킹 키 / 나머지 = XOR 된 페이로드');
        sock.write(frame);
      }
      if (stage === 'frames') {
        const f = decodeFrame(buf);
        if (!f) return;
        buf = buf.subarray(f.size);
        if (f.opcode === 0x1) {
          say.step('④ 서버의 응답 프레임');
          say.net(`← ${hex(encodeServerFrame(0x1, f.payload))}`);
          say.client('raw', `디코딩: "${f.payload.toString()}"  (서버→클라이언트 프레임은 마스킹하지 않는다: masked=${f.masked})`);
          say.step('⑤ 종료: close 프레임(1000)을 보내 우아하게 닫는다');
          const code = Buffer.alloc(2);
          code.writeUInt16BE(1000);
          sock.write(encodeClientFrame(0x8, code));
        } else if (f.opcode === 0x8) {
          say.ok('서버도 close 로 응답 → 양쪽이 합의하여 종료 (close handshake)');
          sock.end();
        }
      }
    });
    sock.on('close', () => resolve());
    sock.on('error', reject);
  });

  close();
  say.note('요약: WebSocket = "HTTP 로 협상 → TCP 연결을 그대로 재사용 → 2~14바이트 헤더의 프레임으로 양방향 통신"');
}
