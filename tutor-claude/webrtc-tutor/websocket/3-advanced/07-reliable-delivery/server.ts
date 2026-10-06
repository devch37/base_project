/**
 * server.ts — "끊겼다 다시 붙어도 놓치지 않는" 스트림 서버
 *
 * 두 가지 신뢰성 도구를 보여 준다.
 *   A) 이벤트 스트림 resume : seq + 링 버퍼(ReplayLog) → 재연결한 클라이언트에게 놓친 구간을 재전송
 *   B) 멱등성 키(idempotency key) : 응답이 유실되어 클라이언트가 재시도해도 "실행은 한 번만"
 *
 * 요약하면 이 장의 공식은
 *      at-least-once 전달 (seq + resume, 재시도)  +  멱등 처리 (seq 중복 제거, 멱등 키)  =  "정확히 한 번"의 효과
 * "exactly-once 전달"은 네트워크에선 불가능하지만, "exactly-once 효과"는 이렇게 만들 수 있다.
 */
import { type Envelope, ReplayLog, WsServer, parsePayload } from '@tutor/ws-kit';
import { z } from 'zod';

export interface ReliableServerOptions {
  port?: number;
  /** 재생 버퍼 크기. 이보다 오래 끊겨 있으면 resume 대신 "전체 재동기화"가 필요하다 */
  replayCapacity?: number;
}

const STREAM_ROOM = 'stream:events';

export async function startReliableServer(opts: ReliableServerOptions = {}) {
  const server = new WsServer({ port: opts.port ?? 0, heartbeat: false, rateLimit: false });
  const log = new ReplayLog<Envelope>(opts.replayCapacity ?? 1000);

  /** 현재 상태의 스냅샷 (버퍼 범위를 벗어난 클라이언트가 "전체 상태"를 다시 받는 용도) */
  const state = { total: 0 };

  /** 서버가 이벤트를 발행: seq 부여 → 버퍼에 보관 → 방에 브로드캐스트 */
  async function publish(data: unknown): Promise<Envelope> {
    state.total++;
    const env = log.append((seq) => ({ v: 1, type: 'stream.event', room: STREAM_ROOM, seq, payload: data }));
    await server.hub.broadcast(STREAM_ROOM, env);
    return env;
  }

  // ── A) 구독 + resume ────────────────────────────────────────────────────────
  const subscribeSchema = z.object({ afterSeq: z.number().int().nonnegative().optional() });

  server.on('stream.subscribe', async (ctx) => {
    const { afterSeq } = parsePayload(subscribeSchema, ctx.msg.payload);

    // 순서가 중요하다: ① 먼저 방에 들어가서 "이후의 실시간 이벤트"를 받기 시작하고
    await ctx.hub.join(ctx.conn, STREAM_ROOM);

    // ② 그 시점 이전에 놓친 구간을 버퍼에서 찾아 보낸다.
    //    (①과 ② 사이에 발행된 이벤트는 실시간으로도, 재생으로도 올 수 있다 → 중복 가능 → 클라이언트가 seq 로 걸러낸다)
    if (afterSeq === undefined) {
      ctx.reply({ lastSeq: log.lastSeq, mode: 'fresh' }); // 처음 구독: 지금부터 받는다
      return;
    }
    const r = log.since(afterSeq);
    if (!r.ok) {
      // 너무 오래 끊겨 있었다 → 버퍼에 이어 붙일 부분이 없다. 클라이언트는 스냅샷을 받아 처음부터 다시 맞춰야 한다.
      ctx.reply({ mode: 'gap', oldestSeq: r.oldestSeq, lastSeq: log.lastSeq });
      return;
    }
    ctx.reply({ mode: 'resumed', replayed: r.items.length, lastSeq: log.lastSeq });
    for (const ev of r.items) ctx.conn.send(ev); // 순서대로 재전송
  });

  server.on('stream.snapshot', (ctx) => {
    ctx.reply({ state: { ...state }, lastSeq: log.lastSeq });
  });

  // ── B) 멱등성 키 ────────────────────────────────────────────────────────────
  const orders: { id: number; item: string }[] = [];
  const processed = new Map<string, unknown>(); // idempotencyKey → 이미 만든 결과 (실무: Redis/DB 에 TTL 과 함께 저장)
  const control = { dropNextReply: false }; // 데모용: 응답 유실 흉내

  const orderSchema = z.object({ idempotencyKey: z.string().min(8).max(64), item: z.string().min(1).max(100) });
  server.on('order.create', (ctx) => {
    const { idempotencyKey, item } = parsePayload(orderSchema, ctx.msg.payload);

    let result = processed.get(idempotencyKey);
    if (result === undefined) {
      const order = { id: orders.length + 1, item };
      orders.push(order); // ← 부수효과(주문 생성)는 키당 "딱 한 번"만 일어난다
      result = { orderId: order.id, duplicate: false };
      processed.set(idempotencyKey, result);
    } else {
      result = { ...(result as object), duplicate: true }; // 재시도 → 새로 만들지 않고 이전 결과를 그대로 돌려준다
    }

    if (control.dropNextReply) {
      control.dropNextReply = false;
      return; // 처리는 됐지만 응답이 네트워크에서 사라진 상황 (클라이언트는 실패했는지 성공했는지 모른다!)
    }
    ctx.reply(result);
  });

  server.on('order.count', (ctx) => ctx.reply({ count: orders.length }));
  // 데모 전용 훅: 다음 order.create 의 응답을 유실시킨다 (type 은 소문자/점/하이픈만 허용 → drop-next-reply)
  server.on('debug.drop-next-reply', (ctx) => {
    control.dropNextReply = true;
    ctx.reply({ ok: true });
  });

  const port = await server.start();
  return { server, port, publish, log, orders, state };
}
