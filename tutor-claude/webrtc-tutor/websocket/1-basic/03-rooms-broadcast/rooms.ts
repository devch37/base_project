/**
 * rooms.ts — 방(Room) 관리의 가장 기본 형태 (단일 프로세스)
 *
 * 방 = "같은 메시지를 받는 연결들의 모임". 채팅방, 게임 룸, 문서 편집 세션, WebRTC 통화방 모두 같은 구조다.
 *
 *   rooms:  Map< 방이름 → Set<연결> >      ← 방 → 멤버 (브로드캐스트에 쓰는 방향)
 *   joined: WeakMap< 연결 → Set<방이름> >  ← 연결 → 소속 방 (연결이 끊길 때 정리하는 방향)
 *
 * 두 방향의 인덱스가 모두 필요하다:
 *   - "이 방 사람들에게 보내" → rooms
 *   - "이 연결이 끊겼다, 어느 방들에서 빼야 하지?" → joined
 *   (한쪽만 있으면 정리할 때 모든 방을 전수 검사해야 한다 — O(방 수))
 */
import type { WebSocket } from 'ws';

export class Rooms {
  private readonly rooms = new Map<string, Set<WebSocket>>();
  private readonly joined = new WeakMap<WebSocket, Set<string>>();

  /** 입장. 이미 들어 있으면 false (Set 이라 중복 입장해도 안전하다 = 멱등) */
  join(ws: WebSocket, room: string): boolean {
    let members = this.rooms.get(room);
    if (!members) this.rooms.set(room, (members = new Set())); // 방은 "첫 입장자"가 만든다
    if (members.has(ws)) return false;
    members.add(ws);

    let mine = this.joined.get(ws);
    if (!mine) this.joined.set(ws, (mine = new Set()));
    mine.add(room);
    return true;
  }

  leave(ws: WebSocket, room: string): boolean {
    const members = this.rooms.get(room);
    if (!members?.delete(ws)) return false;
    this.joined.get(ws)?.delete(room);
    // ★ 빈 방은 반드시 지운다. 안 지우면 방 이름이 무한히 늘어나는 메모리 누수가 된다
    //   (예: 방 이름이 사용자 입력일 때 공격자가 수백만 개의 방을 만들 수 있다)
    if (members.size === 0) this.rooms.delete(room);
    return true;
  }

  /** 연결이 끊겼을 때: 속한 모든 방에서 제거하고, 어느 방들이었는지 돌려준다 */
  leaveAll(ws: WebSocket): string[] {
    const mine = [...(this.joined.get(ws) ?? [])]; // 순회 중 삭제가 일어나므로 복사본으로 순회
    for (const room of mine) this.leave(ws, room);
    return mine;
  }

  members(room: string): ReadonlySet<WebSocket> {
    return this.rooms.get(room) ?? new Set();
  }

  /** 방 전체에게 전송. except 로 보낸 사람 제외 */
  broadcast(room: string, message: string, except?: WebSocket): number {
    const members = this.rooms.get(room);
    if (!members) return 0;
    let sent = 0;
    for (const ws of members) {
      if (ws === except) continue;
      // readyState 확인: 막 닫히는 중인 소켓에 send 하면 에러/예외가 난다
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
        sent++;
      }
    }
    return sent;
  }

  get roomCount(): number {
    return this.rooms.size;
  }

  roomNames(): string[] {
    return [...this.rooms.keys()];
  }
}
