/** npm run ws:05 — 인증 / Origin / 재사용 방지 / 크기 제한 / 강제 종료 */
import { issueTicket } from '@tutor/ws-kit';
import { say, sleep } from '../../tools/narrate';
import { fetchTicket, tryConnect, waitClose } from './attacks';
import { startSecureServer } from './server';

const GOOD_ORIGIN = 'https://app.example.com';
const server = await startSecureServer();
const base = `ws://127.0.0.1:${server.port}/ws`;
const show = (o: Awaited<ReturnType<typeof tryConnect>>['outcome']) =>
  o.kind === 'open' ? '연결됨(101)' : o.kind === 'rejected' ? `거절됨 HTTP ${o.status}` : `종료 code=${o.code}`;

say.title('5. WebSocket 인증과 보안');

say.step('① 로그인 없이 티켓을 요청하면?');
say.client('attacker', `티켓: ${(await fetchTicket(server.port, 'wrong-session')) ?? '발급 거절(401)'}`);

say.step('② 티켓 없이 접속 시도 → 401');
say.client('attacker', show((await tryConnect(base, GOOD_ORIGIN)).outcome));

say.step('③ 정상 흐름: 세션 → 티켓 → 접속');
const ticket = (await fetchTicket(server.port, 'sess-alice'))!;
say.client('alice', `티켓 발급: ${ticket.slice(0, 24)}…`);
const ok = await tryConnect(`${base}?ticket=${ticket}`, GOOD_ORIGIN);
say.client('alice', show(ok.outcome));

say.step('④ 같은 티켓을 다시 쓰면? (URL 이 로그에 남아 유출됐다고 가정) → 재사용 거절');
say.client('attacker', show((await tryConnect(`${base}?ticket=${ticket}`, GOOD_ORIGIN)).outcome));

say.step('⑤ CSWSH: 악성 사이트(evil.com)의 스크립트가 로그인된 사용자의 브라우저로 접속을 시도 → Origin 으로 차단');
const t2 = (await fetchTicket(server.port, 'sess-bob'))!;
say.client('evil.com', show((await tryConnect(`${base}?ticket=${t2}`, 'https://evil.com')).outcome));
say.note('티켓이 유효해도 Origin 이 허용 목록에 없으면 거절. (브라우저는 Origin 헤더를 스크립트가 위조할 수 없다)');

say.step('⑥ 서명을 위조/만료시킨 티켓 → 401');
const forged = issueTicket({ sub: 'admin' }, 'attacker-guess-secret');
const expired = issueTicket({ sub: 'alice', ttlSec: 1, now: Date.now() - 60_000 }, server.secret);
say.client('attacker', `위조 서명: ${show((await tryConnect(`${base}?ticket=${forged}`, GOOD_ORIGIN)).outcome)}`);
say.client('attacker', `만료 티켓: ${show((await tryConnect(`${base}?ticket=${expired}`, GOOD_ORIGIN)).outcome)}`);

say.step('⑦ 거대한 메시지(maxPayload=1KB 초과) → 서버가 1009 로 연결을 끊는다');
{
  const t = (await fetchTicket(server.port, 'sess-bob'))!;
  const { ws } = await tryConnect(`${base}?ticket=${t}`, GOOD_ORIGIN);
  ws!.send('x'.repeat(5000));
  const c = await waitClose(ws!);
  say.client('attacker', `종료 code=${c.code} (1009 = Message Too Big)`);
}

say.step('⑧ 로그아웃/계정 정지 → 서버가 그 사용자의 연결을 즉시 종료 (4001)');
{
  const closing = waitClose(ok.ws!);
  say.server(`alice 연결 ${server.revokeUser('alice')}개 강제 종료`);
  const c = await closing;
  say.client('alice', `종료 code=${c.code} reason="${c.reason}" → 클라이언트는 재연결하지 않고 로그인 화면으로`);
}

say.step('⑨ 연결 최대 수명(0.4초로 짧게 설정한 서버) 초과 → 4002 로 끊어 재인증을 강제');
{
  const short = await startSecureServer({ maxConnectionAgeMs: 400 });
  const t = (await fetchTicket(short.port, 'sess-bob'))!;
  const { ws } = await tryConnect(`ws://127.0.0.1:${short.port}/ws?ticket=${t}`, GOOD_ORIGIN);
  const c = await waitClose(ws!);
  say.client('bob', `종료 code=${c.code} reason="${c.reason}" → 클라이언트는 새 티켓을 받아 재연결`);
  await short.close();
}

await sleep(50);
await server.close();
say.ok('5장 데모 끝');
