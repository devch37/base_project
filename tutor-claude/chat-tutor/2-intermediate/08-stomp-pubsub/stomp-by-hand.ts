/**
 * 08장 실습: STOMP 라이브러리 없이 "프레임을 직접 써서" 채팅해 본다.
 *   1) ./gradlew :server:stomp-chat:bootRun
 *   2) npm run lab:08
 *
 * STOMP 프레임 = 명령 줄 + 헤더 줄들 + 빈 줄 + 본문 + NULL(\0)
 *   SEND
 *   destination:/app/rooms/r1/send
 *   content-type:application/json
 *
 *   {"from":"고객","text":"안녕"}\0
 * HTTP 와 닮았다. 차이는 "한 연결 위에서 계속, 양방향으로" 주고받는다는 것.
 */
const frame = (command: string, headers: Record<string, string>, body = '') =>
  `${command}\n${Object.entries(headers).map(([k, v]) => `${k}:${v}`).join('\n')}\n\n${body}\0`;

const show = (dir: string, f: string) => console.log(`${dir}\n${f.replace(/\0$/, '^@').replace(/^/gm, '   ')}\n`);

const ws = new WebSocket('ws://localhost:8080/ws');
ws.onerror = () => {
  console.error('연결 실패 — stomp-chat 서버를 먼저 띄우세요');
  process.exit(1);
};
ws.onmessage = (e) => {
  const text = String(e.data);
  if (text === '\n') return console.log('◀ (heartbeat: 줄바꿈 한 글자)\n');
  show('◀ 서버', text);
};

const send = (f: string) => {
  show('▶ 나', f);
  ws.send(f);
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

ws.onopen = async () => {
  send(frame('CONNECT', { 'accept-version': '1.2', host: 'localhost', 'heart-beat': '0,0' }));
  await wait(300);
  // 구독: "이 주소로 오는 메시지를 나에게 보내 줘". id 는 내가 붙이는 구독 번호 (나중에 UNSUBSCRIBE 할 때 씀)
  send(frame('SUBSCRIBE', { id: 'sub-0', destination: '/topic/rooms/by-hand' }));
  await wait(300);
  // /app 으로 보내면 컨트롤러(@MessageMapping)가 받아서 처리 → @SendTo 로 /topic 구독자에게
  send(frame('SEND', { destination: '/app/rooms/by-hand/send', 'content-type': 'application/json' }, JSON.stringify({ from: '손으로', text: '프레임을 직접 썼어요' })));
  await wait(500);
  // receipt: "이 프레임 처리했으면 알려 줘" → 서버가 RECEIPT 프레임으로 답한다
  send(frame('DISCONNECT', { receipt: 'bye-1' }));
  await wait(300);
  ws.close();
};
