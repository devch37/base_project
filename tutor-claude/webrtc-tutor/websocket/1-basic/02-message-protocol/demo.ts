/** npm run ws:02 — 메시지 프로토콜: 검증 / 에러 모델 / 순서 뒤바뀐 응답 / 타임아웃 */
import { say, sleep } from '../../tools/narrate';
import { RpcClient, RpcError } from './client';
import { startServer } from './server';

const server = await startServer();
const client = new RpcClient();
await client.connect(`ws://localhost:${server.port}`);

say.title('2. 메시지 프로토콜 설계');

say.step('① 정상 요청/응답');
say.client('rpc', `math.add(2, 3) = ${await client.call('math.add', { a: 2, b: 3 })}`);
say.client('rpc', `time.now() = ${await client.call('time.now', {})}`);

say.step('② 검증 실패는 "에러 응답"으로 돌아온다 (연결은 끊기지 않는다)');
for (const [label, run] of [
  ['payload 타입이 틀림', () => client.callUntyped('math.add', { a: 'x', b: 1 })],
  ['알 수 없는 type', () => client.callUntyped('hack.me', {})],
] as const) {
  try {
    await run();
  } catch (e) {
    if (e instanceof RpcError) say.warn(`${label} → code=${e.code} message="${e.message}"`);
  }
}
await sleep(50);

say.step('③ 응답이 요청 순서와 다르게 도착해도 replyTo 덕분에 정확히 짝지어진다');
const t0 = Date.now();
const [slow, fast] = await Promise.all([client.call('slow.work', { ms: 300 }), client.call('slow.work', { ms: 50 })]);
say.client('rpc', `먼저 보낸 느린 요청(300ms) → ${JSON.stringify(slow)}`);
say.client('rpc', `나중에 보낸 빠른 요청(50ms)  → ${JSON.stringify(fast)}   (총 ${Date.now() - t0}ms, 직렬이면 350ms)`);
say.note('두 요청은 동시에 진행(파이프라이닝)되었고, 빠른 응답이 먼저 도착했지만 각자 올바른 Promise 가 resolve 되었다.');

say.step('④ 응답이 영영 안 오면? → 타임아웃으로 반드시 끝낸다');
try {
  await client.call('never.replies', {}, 300);
} catch (e) {
  say.warn(`code=${(e as RpcError).code} (대기 중 요청 수 = ${client.pendingCount}  ← 0 이어야 메모리 누수가 없다)`);
}

say.step('⑤ 서버가 요청과 무관하게 보내는 푸시 이벤트');
client.onEvent = (e) => say.client('rpc', `푸시 수신: ${e.type} #${e.payload.n}`);
await sleep(600);

client.close();
await server.close();
say.ok('2장 데모 끝');
