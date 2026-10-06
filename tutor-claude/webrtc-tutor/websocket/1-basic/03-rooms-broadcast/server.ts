/**
 * server.ts — 채팅 서버: 방 입장/퇴장/메시지/접속자 알림
 *
 * 메시지(클라이언트→서버)
 *   { type:'join',  room, name }       방 입장
 *   { type:'leave', room }             방 퇴장
 *   { type:'say',   room, text }       방에 말하기
 * 이벤트(서버→클라이언트)
 *   { type:'joined',  room, members:[이름] }   내가 입장한 결과(현재 멤버 목록)
 *   { type:'presence', room, event:'join'|'leave', name }  다른 사람의 입장/퇴장
 *   { type:'say', room, name, text }           누군가의 발언
 *   { type:'error', message }
 */
import { type WebSocket, WebSocketServer } from 'ws';
import { isMain, say } from '../../tools/narrate';
import { Rooms } from './rooms';

export function startChatServer(port = 0): Promise<{ port: number; rooms: Rooms; close(): Promise<void> }> {
  const wss = new WebSocketServer({ port });
  const rooms = new Rooms();
  /** 연결 → 닉네임. 연결에 속성을 직접 붙이는 대신 WeakMap 을 쓰면 연결이 GC 될 때 자동으로 사라진다 */
  const names = new WeakMap<WebSocket, string>();

  const send = (ws: WebSocket, obj: unknown) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(obj));

  wss.on('connection', (ws) => {
    ws.on('error', () => {});

    ws.on('message', (data) => {
      let msg: { type?: string; room?: string; name?: string; text?: string };
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return send(ws, { type: 'error', message: 'bad json' });
      }
      const room = typeof msg.room === 'string' ? msg.room.slice(0, 64) : ''; // 방 이름 길이 제한 (메모리/로그 보호)

      switch (msg.type) {
        case 'join': {
          if (!room) return send(ws, { type: 'error', message: 'room required' });
          const name = String(msg.name ?? 'anonymous').slice(0, 32);
          names.set(ws, name);
          if (!rooms.join(ws, room)) return; // 이미 입장해 있음
          const memberNames = [...rooms.members(room)].map((m) => names.get(m)!);
          send(ws, { type: 'joined', room, members: memberNames });
          // 다른 사람들에게 "새 사람이 들어왔어요" 알림 (보낸 사람 본인 제외)
          rooms.broadcast(room, JSON.stringify({ type: 'presence', room, event: 'join', name }), ws);
          break;
        }
        case 'leave': {
          if (rooms.leave(ws, room)) {
            rooms.broadcast(room, JSON.stringify({ type: 'presence', room, event: 'leave', name: names.get(ws) }));
          }
          break;
        }
        case 'say': {
          // 보안: 방에 들어 있지 않은 연결이 그 방에 말하면 안 된다 (권한 검사의 가장 기본)
          if (!rooms.members(room).has(ws)) return send(ws, { type: 'error', message: 'not in room' });
          rooms.broadcast(room, JSON.stringify({ type: 'say', room, name: names.get(ws), text: String(msg.text ?? '').slice(0, 500) }));
          break;
        }
        default:
          send(ws, { type: 'error', message: `unknown type: ${msg.type}` });
      }
    });

    // ★ 연결이 끊기면 반드시 모든 방에서 빼고, 남은 사람들에게 알린다.
    //   (정상 종료든, 네트워크 단절로 인한 비정상 종료든 'close' 이벤트는 결국 발생한다)
    ws.on('close', () => {
      const name = names.get(ws);
      for (const room of rooms.leaveAll(ws)) {
        rooms.broadcast(room, JSON.stringify({ type: 'presence', room, event: 'leave', name }));
      }
    });
  });

  return new Promise((resolve) => {
    wss.on('listening', () => {
      const p = (wss.address() as { port: number }).port;
      resolve({
        port: p,
        rooms,
        close: () =>
          new Promise<void>((r) => {
            for (const c of wss.clients) c.terminate();
            wss.close(() => r());
          }),
      });
    });
  });
}

if (isMain(import.meta.url)) {
  const s = await startChatServer(Number(process.env.PORT ?? 8080));
  say.server(`3장 채팅 서버: ws://localhost:${s.port}`);
}
