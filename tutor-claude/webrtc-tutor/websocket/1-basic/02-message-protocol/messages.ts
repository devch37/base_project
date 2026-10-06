/**
 * messages.ts — 이 장의 "프로토콜 정의서" (서버/클라이언트가 공유)
 *
 * 핵심 아이디어: **스키마 하나를 단일 진실 공급원(single source of truth)** 으로 삼는다.
 *   - zod 스키마  → 런타임 검증 (네트워크에서 온 데이터는 믿을 수 없으니까)
 *   - z.infer     → 같은 스키마에서 TypeScript 타입이 자동 생성 (타입과 검증이 어긋날 일이 없다)
 *
 * 메시지는 모두 "봉투(envelope)" 모양을 가진다.
 *   { v: 1, id?: "요청ID", replyTo?: "응답 대상 요청ID", type: "...", payload: {...} }
 */
import { z } from 'zod';

// ── 클라이언트 → 서버 요청들 ─────────────────────────────────────────────────
// discriminatedUnion 은 `type` 필드를 보고 "어느 스키마로 검증할지" 바로 골라서 빠르고 에러가 명확하다.
export const requestSchema = z.discriminatedUnion('type', [
  z.object({ v: z.literal(1), id: z.string(), type: z.literal('math.add'), payload: z.object({ a: z.number(), b: z.number() }) }),
  z.object({ v: z.literal(1), id: z.string(), type: z.literal('time.now'), payload: z.object({}).optional() }),
  z.object({ v: z.literal(1), id: z.string(), type: z.literal('slow.work'), payload: z.object({ ms: z.number().int().min(0).max(5000) }) }),
  z.object({ v: z.literal(1), id: z.string(), type: z.literal('never.replies'), payload: z.object({}).optional() }),
]);
export type Request = z.infer<typeof requestSchema>;

// ── 서버 → 클라이언트: 응답 / 에러 / 푸시 ───────────────────────────────────────
export type Response =
  | { v: 1; type: 'result'; replyTo: string; payload: unknown }
  | { v: 1; type: 'error'; replyTo?: string; error: { code: ErrorCode; message: string } }
  | { v: 1; type: 'event.tick'; payload: { n: number } }; // 요청과 무관하게 서버가 먼저 보내는 푸시

/** 에러 코드는 "문자열 상수"로 고정한다. 클라이언트가 message(사람용 문장)가 아닌 code 로 분기할 수 있게. */
export type ErrorCode = 'bad_json' | 'bad_envelope' | 'unsupported_version' | 'unknown_type' | 'bad_payload' | 'internal';
