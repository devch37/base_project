/**
 * 21장 실습: 프록시(8888)를 거쳐 STOMP 로 연결하고, heartbeat 유무에 따라 살아남는 시간을 잰다.
 *   (stomp-chat 서버 + proxy-demo 가 떠 있어야 한다)
 *   npm run lab:21:client -- --hb=0        heartbeat 끔
 *   npm run lab:21:client -- --hb=2000     2초 heartbeat
 */
import { Client } from '@stomp/stompjs';

const hb = Number(process.argv.find((a) => a.startsWith('--hb='))?.split('=')[1] ?? '0');
const started = Date.now();
const elapsed = () => `${((Date.now() - started) / 1000).toFixed(1)}s`;

const client = new Client({
  brokerURL: 'ws://localhost:8888/ws',
  heartbeatIncoming: hb,
  heartbeatOutgoing: hb,
  reconnectDelay: 0,
  debug: () => {},
});
client.onConnect = (f) => console.log(`[${elapsed()}] CONNECTED (heart-beat ${f.headers['heart-beat']}) — 이제 아무것도 보내지 않고 기다린다`);
client.onWebSocketClose = (e) => {
  console.log(`[${elapsed()}] 연결 종료 code=${e.code}`);
  process.exit(0);
};
client.onWebSocketError = () => console.log(`[${elapsed()}] WebSocket 오류 (프록시가 Upgrade 를 전달하지 않으면 여기로)`);
client.activate();
setTimeout(() => {
  console.log(`[${elapsed()}] 30초 동안 살아 있음 → heartbeat 가 프록시의 idle timeout 을 막았다`);
  process.exit(0);
}, 30_000);
