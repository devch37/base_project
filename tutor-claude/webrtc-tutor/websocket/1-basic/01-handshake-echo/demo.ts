/**
 * demo.ts — 1장 한 방에 보기:  npm run ws:01
 *   ① 라이브러리 없이 핸드셰이크/프레임을 손으로 → ② ws 라이브러리 에코 서버/클라이언트
 */
import { say } from '../../tools/narrate';
import { runEchoClient } from './client';
import { runRawDemo } from './raw-handshake';
import { startEchoServer } from './server';

await runRawDemo();

say.title('1. ws 라이브러리로 만든 에코 서버/클라이언트');
const server = await startEchoServer(0); // 0 = 빈 포트 자동 선택
await runEchoClient(`ws://localhost:${server.port}`);
await server.close();
say.ok('1장 데모 끝');
