/**
 * client.ts — Node.js 에서 WebSocket 서버에 접속하는 가장 단순한 클라이언트
 *
 * 직접 실행:   npx tsx websocket/1-basic/01-handshake-echo/client.ts
 *
 * 브라우저의 `WebSocket` 과 Node 의 `ws` 는 이벤트 이름이 거의 같다 (open / message / close / error).
 * 다만 ws 는 EventEmitter 스타일(on), 브라우저는 EventTarget 스타일(onmessage, addEventListener)이다.
 */
import WebSocket from 'ws';
import { isMain, say } from '../../tools/narrate';

export async function runEchoClient(url: string): Promise<void> {
  const ws = new WebSocket(url);

  await new Promise<void>((resolve, reject) => {
    ws.on('open', resolve); // 핸드셰이크 완료. 이제부터 send() 가능
    ws.on('error', reject);
  });
  say.client('echo', '연결 성공 (readyState=OPEN)');

  // 텍스트 메시지 — JS 문자열은 UTF-8 로 인코딩되어 전송된다
  ws.send('안녕하세요 👋');
  // 바이너리 메시지 — Buffer/ArrayBuffer 는 바이너리 프레임(opcode 0x2)으로 전송된다
  ws.send(Buffer.from([0xde, 0xad, 0xbe, 0xef]));

  let received = 0;
  await new Promise<void>((resolve) => {
    ws.on('message', (data, isBinary) => {
      if (isBinary) say.client('echo', `응답(바이너리): ${(data as Buffer).toString('hex')}`);
      else say.client('echo', `응답(텍스트): ${data.toString()}`);
      if (++received === 2) resolve();
    });
  });

  // 정상 종료는 close(1000). 인자 없이 close() 해도 1005(코드 없음)가 전달된다
  ws.close(1000, '작업 끝');
  await new Promise<void>((r) => ws.on('close', (code, reason) => (say.client('echo', `종료: code=${code} reason="${reason.toString()}"`), r())));
}

if (isMain(import.meta.url)) await runEchoClient(process.env.URL ?? 'ws://localhost:8080');
