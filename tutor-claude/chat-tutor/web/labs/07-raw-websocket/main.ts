/**
 * 07장 실습: 브라우저 기본 WebSocket API 만으로 서버와 대화한다.
 * 이 장의 서버는 Vite 프록시를 거치지 않고 8080 에 직접 붙는다 (다른 출처 → 서버의 Origin 검사가 허용해야 함).
 */
import { $, makeLog } from '../shared-log.ts';

const log = makeLog($('log'));
let ws: WebSocket | null = null;
const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

function showState() {
  const s = ws ? states[ws.readyState]! : 'CLOSED';
  $('ready').textContent = s;
  $('ready').className = `badge ${s === 'OPEN' ? 'ok' : s === 'CLOSED' ? '' : 'warn'}`;
}
setInterval(showState, 200);

$('connect').onclick = () => {
  ws?.close();
  const url = `ws://localhost:8080${$<HTMLSelectElement>('path').value}`;
  log('sys', `new WebSocket("${url}") — HTTP GET + Upgrade: websocket 요청이 나간다`);
  ws = new WebSocket(url);
  ws.onopen = () => log('sys', 'open: 101 Switching Protocols 를 받았다. 이제부터는 HTTP 가 아니라 WebSocket 프레임');
  ws.onmessage = (e) => log('in', String(e.data));
  ws.onerror = () => log('err', 'error 이벤트 (브라우저는 보안상 자세한 이유를 알려 주지 않는다. Network 탭을 보자)');
  ws.onclose = (e) =>
    log('sys', `close: code=${e.code} reason="${e.reason}" wasClean=${e.wasClean}  (1000 정상, 1001 떠남, 1006 비정상 — 클로즈 프레임 없이 끊김)`);
};

$('close').onclick = () => ws?.close(1000, 'bye');

$('send').onclick = () => {
  const text = $<HTMLInputElement>('msg').value;
  if (ws?.readyState !== WebSocket.OPEN) return log('err', '연결이 열려 있지 않다 (readyState 확인)');
  ws.send(text);
  log('out', text);
};

document.querySelectorAll<HTMLButtonElement>('[data-fill]').forEach((b) => (b.onclick = () => ($<HTMLInputElement>('msg').value = b.dataset.fill!)));
