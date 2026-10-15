/**
 * 02장 실습: 작은 REST 서버를 띄우고 fetch 로 GET/POST 를 보내 상태 코드·헤더·JSON 을 확인한다.
 *   npm run lab:02
 * (Spring 버전은 05장 server/spring-basics 에 있다. 여기서는 "HTTP 자체"에 집중하려고 Node 로 짧게)
 */
import { createServer, type IncomingMessage } from 'node:http';

const rooms = new Map<string, { id: string; topic: string }>();

async function readBody(req: IncomingMessage): Promise<string> {
  let s = '';
  for await (const chunk of req) s += chunk;
  return s;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const json = (status: number, data: unknown, headers: Record<string, string> = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
    res.end(JSON.stringify(data));
  };

  if (req.method === 'GET' && url.pathname === '/api/rooms') return json(200, [...rooms.values()]);
  if (req.method === 'GET' && url.pathname.startsWith('/api/rooms/')) {
    const room = rooms.get(url.pathname.split('/').pop()!);
    return room ? json(200, room) : json(404, { error: '없는 방' });
  }
  if (req.method === 'POST' && url.pathname === '/api/rooms') {
    if (!req.headers['content-type']?.includes('application/json')) return json(415, { error: 'JSON 만 받습니다' });
    let body: { topic?: string };
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return json(400, { error: 'JSON 형식 오류' });
    }
    if (!body.topic) return json(400, { error: 'topic 필수' });
    const id = `r${rooms.size + 1}`;
    rooms.set(id, { id, topic: body.topic });
    return json(201, rooms.get(id), { Location: `/api/rooms/${id}` });
  }
  json(405, { error: `${req.method} ${url.pathname} 은 지원하지 않습니다` });
});

server.listen(0, async () => {
  const { port } = server.address() as { port: number };
  const base = `http://localhost:${port}`;
  const show = async (label: string, res: Response) => {
    console.log(`\n[${label}] ${res.status} ${res.statusText}`);
    console.log(`  Content-Type: ${res.headers.get('content-type')}${res.headers.get('location') ? `  Location: ${res.headers.get('location')}` : ''}`);
    console.log(`  본문: ${await res.text()}`);
  };

  await show('POST 정상', await fetch(`${base}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: '카드 분실' }) }));
  await show('POST 필수값 누락 → 400', await fetch(`${base}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }));
  await show('POST 깨진 JSON → 400', await fetch(`${base}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{topic:' }));
  await show('POST 형식이 JSON 아님 → 415', await fetch(`${base}/api/rooms`, { method: 'POST', body: 'topic=x' }));
  await show('GET 목록', await fetch(`${base}/api/rooms`));
  await show('GET 없는 자원 → 404', await fetch(`${base}/api/rooms/nope`));
  await show('DELETE 미지원 → 405', await fetch(`${base}/api/rooms/r1`, { method: 'DELETE' }));

  // fetch 의 함정: 404·500 이어도 예외가 아니다! res.ok(200~299)를 직접 확인해야 한다.
  const r = await fetch(`${base}/api/rooms/nope`);
  console.log(`\nfetch 는 404 에도 throw 하지 않는다 → res.ok = ${r.ok}`);
  server.close();
});
