/**
 * serve-chapter.ts — 서버 코드가 필요 없는 장(브라우저만으로 충분한 장)을 띄우는 개발 서버
 *
 *   npx tsx webrtc/tools/serve-chapter.ts webrtc/1-basic/01-loopback [port]
 *   → http://localhost:<port>
 */
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { createStaticHandler } from './static';

const dir = process.argv[2];
if (!dir) {
  console.error('사용법: tsx webrtc/tools/serve-chapter.ts <장 디렉터리> [port]');
  process.exit(1);
}
const port = Number(process.argv[3] ?? process.env.PORT ?? 3000);
const handler = createStaticHandler({ '/': resolve(dir, 'public') });

createServer(async (req, res) => {
  if (!(await handler(req, res))) res.writeHead(404).end('not found');
}).listen(port, () => console.log(`📺 ${dir}\n   http://localhost:${port}`));
