/**
 * [연습 E2 해답] "입력 중..." 표시 — lossy 브로드캐스트 + 서버 측 throttle
 *
 * 타이핑 표시는 "버려도 되는" 대표적인 메시지다.
 *   - 느린 소비자에게는 건너뛰어도 된다 → lossy: true  (6장)
 *   - 키 입력마다 보내면 폭주한다 → 사용자·방당 최소 간격(throttle)을 서버가 강제한다
 *   - 방에 들어있는 사람만 보낼 수 있다 (not_in_room)
 */
import { type WsServer, WsError, parsePayload } from '@tutor/ws-kit';
import { z } from 'zod';

const schema = z.object({ room: z.string().min(1).max(128), typing: z.boolean() });

export function installTypingIndicator(server: WsServer, minIntervalMs = 1000): void {
  /** `${peerId}:${room}` → 마지막으로 전파한 시각 */
  const last = new Map<string, number>();

  server.on('typing', async (ctx) => {
    const { room, typing } = parsePayload(schema, ctx.msg.payload);
    if (!ctx.conn.rooms.has(room)) throw new WsError('not_in_room', '먼저 방에 입장해야 합니다');

    const key = `${ctx.conn.id}:${room}`;
    const now = Date.now();
    // 시작(true)은 throttle, 종료(false)는 항상 즉시 전달 (안 그러면 "입력 중"이 영원히 남는다)
    if (typing && now - (last.get(key) ?? 0) < minIntervalMs) return; // 조용히 무시 (이건 에러가 아니라 정상적인 절약)
    last.set(key, now);

    await ctx.hub.broadcast(room, { v: 1, type: 'typing', room, from: ctx.conn.id, payload: { typing } }, { except: ctx.conn.id, lossy: true });
  });

  // 연결이 사라진 뒤에도 맵이 커지지 않도록 주기적으로 오래된 항목 청소
  const sweep = setInterval(() => {
    const cutoff = Date.now() - minIntervalMs * 10;
    for (const [k, t] of last) if (t < cutoff) last.delete(k);
  }, 10_000);
  sweep.unref();
}
