/** npm run ws:03 — 방 / 브로드캐스트 / 접속자 알림 / 연결 끊김 정리 */
import { say, sleep } from '../../tools/narrate';
import { ChatClient } from './client';
import { startChatServer } from './server';

const server = await startChatServer();
const url = `ws://localhost:${server.port}`;
say.title('3. 방(Room)과 브로드캐스트');

const [alice, bob, carol] = [new ChatClient('alice', url), new ChatClient('bob', url), new ChatClient('carol', url)];
await Promise.all([alice.opened(), bob.opened(), carol.opened()]);

say.step('① alice, bob 은 #lobby 에, carol 은 #dev 에 입장');
alice.join('lobby');
await sleep(30);
bob.join('lobby');
carol.join('dev');
await sleep(50);

say.step('② alice 가 #lobby 에서 말하면 → 같은 방의 bob 만 듣는다 (carol 은 못 듣는다)');
alice.say('lobby', '안녕하세요!');
await sleep(50);

say.step('③ 방에 들어있지 않은 carol 이 #lobby 에 말을 걸면? → 거절');
carol.say('lobby', '몰래 끼어들기');
await sleep(50);

say.step('④ bob 의 연결이 갑자기 끊기면 → 서버가 정리하고 남은 사람에게 알린다');
say.note(`현재 방 목록: ${server.rooms.roomNames().join(', ')} (${server.rooms.roomCount}개)`);
bob.ws.terminate(); // close 프레임 없이 TCP 를 즉시 끊는다 (비정상 종료 흉내)
await sleep(100);

say.step('⑤ 마지막 사람이 나가면 빈 방은 사라진다 (메모리 누수 방지)');
alice.leave('lobby');
await sleep(50);
say.note(`현재 방 목록: ${server.rooms.roomNames().join(', ')} (${server.rooms.roomCount}개)  ← lobby 가 사라졌다`);

[alice, carol].forEach((c) => c.close());
await sleep(50);
await server.close();
say.ok('3장 데모 끝');
