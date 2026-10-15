/**
 * 08~09장 실습: @stomp/stompjs 로 STOMP 를 쓴다. debug 로그에 "날것의 프레임"이 그대로 찍힌다.
 */
import { Client } from '@stomp/stompjs';
import { backoffDelay } from '../../sdk/src/backoff.ts';
import { $, makeLog } from '../shared-log.ts';

const log = makeLog($('log'));
let client: Client | null = null;
let attempt = 0;
let lastSeq = 0; // 마지막으로 받은 seq → 재연결 후 history 에 after-seq 로 보낸다 (놓친 것만 받기)
let manualStop = false;

const room = () => $<HTMLInputElement>('room').value.trim();

function setState(s: string, cls = '') {
  $('state').textContent = s;
  $('state').className = `badge ${cls}`;
}

function connect() {
  manualStop = false;
  const hb = Number($<HTMLInputElement>('hb').value);
  client = new Client({
    brokerURL: `ws://${location.host}/ws`, // Vite 가 8080 으로 프록시 (ws: true)
    heartbeatIncoming: hb,
    heartbeatOutgoing: hb,
    reconnectDelay: 0, // 재연결은 아래에서 직접 (09장)
    debug: (m) => {
      // stompjs 가 주고받는 프레임을 보여 준다. heartbeat 는 "<<< PONG"/">>> PING" 처럼 보인다
      if (/^(>>>|<<<)/.test(m)) log(m.startsWith('>>>') ? 'out' : 'in', m.replace(/\n/g, '⏎ '));
      else if (/PING|PONG|heart/i.test(m)) log('sys', m);
    },
  });
  client.onConnect = (frame) => {
    attempt = 0;
    setState('connected', 'ok');
    log('sys', `CONNECTED heart-beat=${frame.headers['heart-beat']} (서버가 보낼 주기, 서버가 기대하는 주기)`);
    // 구독은 "연결"에 묶여 있다 → 재연결할 때마다 다시 구독해야 한다
    client!.subscribe(`/topic/rooms/${room()}`, (m) => {
      const body = JSON.parse(m.body);
      lastSeq = Math.max(lastSeq, body.seq ?? 0);
      log('in', `[${body.type}] #${body.seq} ${body.from}: ${body.text}`);
    });
    client!.subscribe('/user/queue/errors', (m) => log('err', `개인 오류 큐: ${m.body}`));
    if (lastSeq > 0) loadHistory(); // 재연결이면 끊긴 동안 놓친 메시지를 채운다
  };
  client.onStompError = (f) => log('err', `ERROR 프레임: ${f.headers.message}`);
  client.onWebSocketClose = (e) => {
    setState(`closed ${e.code}`, 'bad');
    if (manualStop || !$<HTMLInputElement>('auto').checked) return;
    const delay = backoffDelay(attempt++);
    log('sys', `연결 끊김(code ${e.code}). ${delay}ms 뒤 재연결 시도 #${attempt}`);
    setState(`reconnect in ${delay}ms`, 'warn');
    setTimeout(() => {
      void client?.deactivate();
      connect();
    }, delay);
  };
  setState('connecting', 'warn');
  client.activate();
}

function loadHistory() {
  // @SubscribeMapping: 구독하면 "한 번" 응답이 오고 끝난다 (요청-응답 흉내)
  const sub = client!.subscribe(`/app/rooms/${room()}/history`, (m) => {
    const list = JSON.parse(m.body) as Array<{ seq: number; type: string; from: string; text: string }>;
    log('sys', `history (after-seq=${lastSeq}) → ${list.length}건`);
    list.forEach((x) => log('in', `[history] #${x.seq} ${x.from}: ${x.text}`));
    if (list.length) lastSeq = list[list.length - 1]!.seq;
    sub.unsubscribe();
  }, { 'after-seq': String(lastSeq) });
}

$('connect').onclick = () => {
  void client?.deactivate();
  connect();
};
$('disconnect').onclick = () => {
  manualStop = true;
  void client?.deactivate(); // DISCONNECT 프레임을 보내고 정상 종료
  setState('disconnected');
};
$('send').onclick = () => {
  client?.publish({
    destination: `/app/rooms/${room()}/send`,
    body: JSON.stringify({ from: $<HTMLInputElement>('name').value, text: $<HTMLInputElement>('text').value }),
  });
  $<HTMLInputElement>('text').value = '';
};
$<HTMLInputElement>('text').addEventListener('keydown', (e) => e.key === 'Enter' && $('send').click());
$('history').onclick = () => loadHistory();
$('empty').onclick = () => client?.publish({ destination: `/app/rooms/${room()}/send`, body: JSON.stringify({ from: 'x', text: ' ' }) });
$('bypass').onclick = () =>
  client?.publish({
    destination: `/topic/rooms/${room()}`,
    body: JSON.stringify({ type: 'notice', seq: 0, from: '관리자(사칭)', text: '컨트롤러를 우회한 가짜 공지' }),
  });
