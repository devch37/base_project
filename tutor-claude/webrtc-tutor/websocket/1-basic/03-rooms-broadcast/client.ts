/** client.ts — 채팅 클라이언트 (Node). 받은 이벤트를 사람이 읽기 좋게 출력한다. */
import WebSocket from 'ws';
import { say } from '../../tools/narrate';

export class ChatClient {
  readonly ws: WebSocket;
  readonly received: Record<string, unknown>[] = [];

  constructor(
    readonly name: string,
    url: string,
  ) {
    this.ws = new WebSocket(url);
    this.ws.on('message', (data) => {
      const m = JSON.parse(data.toString()) as Record<string, unknown>;
      this.received.push(m);
      if (m.type === 'joined') say.client(name, `입장 완료. 현재 멤버: ${(m.members as string[]).join(', ')}`);
      else if (m.type === 'presence') say.client(name, `👤 ${m.name} 님이 ${m.event === 'join' ? '입장' : '퇴장'}했습니다`);
      else if (m.type === 'say') say.client(name, `💬 ${m.name}: ${m.text}`);
      else if (m.type === 'error') say.client(name, `⚠ ${m.message}`);
    });
  }

  opened(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.once('open', () => resolve());
      this.ws.once('error', reject);
    });
  }

  join(room: string): void {
    this.ws.send(JSON.stringify({ type: 'join', room, name: this.name }));
  }
  leave(room: string): void {
    this.ws.send(JSON.stringify({ type: 'leave', room }));
  }
  say(room: string, text: string): void {
    this.ws.send(JSON.stringify({ type: 'say', room, text }));
  }
  close(): void {
    this.ws.close();
  }
}
