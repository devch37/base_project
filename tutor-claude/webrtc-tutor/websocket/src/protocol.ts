/**
 * protocol.ts — 앱 레벨 메시지 규약 ("Envelope")
 *
 * WebSocket 자체는 "문자열/바이너리를 주고받는 파이프"일 뿐 메시지 구조를 정해 주지 않습니다.
 * 그래서 실무에서는 반드시 우리끼리의 규약(프로토콜)을 정해야 합니다.
 *
 *   {
 *     "v": 1,                 ← 프로토콜 버전. 나중에 호환성 깨질 때 분기하려고 처음부터 넣는다
 *     "type": "chat.send",    ← 무슨 메시지인가 (라우팅 키)
 *     "id": "c-17",           ← 요청자가 붙이는 ID (응답과 짝짓기 용도, 선택)
 *     "replyTo": "c-17",      ← 응답일 때만: 어떤 요청에 대한 응답인가
 *     "room": "lobby",        ← 방 메시지일 때 대상 방
 *     "from": "peer-id",      ← 서버가 채워 넣는 발신자 (클라이언트가 보낸 값은 무시!)
 *     "seq": 42,              ← 서버가 채워 넣는 순번 (7장 신뢰성 전달에서 사용)
 *     "payload": { ... },     ← 실제 데이터
 *     "error": {code,message} ← 에러 응답일 때
 *   }
 *
 * 설계 원칙 3가지
 *  1) 모든 입력은 "신뢰하지 않는다" → zod로 런타임 검증 (TypeScript 타입은 런타임엔 사라진다)
 *  2) `from`, `seq`, `ts` 같은 필드는 서버가 덮어쓴다 → 클라이언트가 사칭하지 못하게
 *  3) 에러도 같은 봉투에 담는다 → 클라이언트가 한 가지 방식으로 처리 가능
 */
import { z } from 'zod';

export const PROTOCOL_VERSION = 1 as const;

/** 에러 본문. code는 기계가 읽는 값, message는 사람이 읽는 값 */
export interface ErrorBody {
  code: string;
  message: string;
}

export interface Envelope<T = unknown> {
  v: typeof PROTOCOL_VERSION;
  type: string;
  id?: string;
  replyTo?: string;
  room?: string;
  from?: string;
  seq?: number;
  payload?: T;
  error?: ErrorBody;
  ts?: number;
}

/** type 문자열 규칙: 소문자로 시작, 소문자/숫자/점/하이픈/언더스코어. 예) room.join, signal.offer */
const TYPE_RE = /^[a-z][a-z0-9_.-]*$/;

export const envelopeSchema = z.object({
  v: z.literal(PROTOCOL_VERSION),
  type: z.string().min(1).max(64).regex(TYPE_RE),
  id: z.string().max(64).optional(),
  replyTo: z.string().max(64).optional(),
  room: z.string().min(1).max(128).optional(),
  from: z.string().max(128).optional(),
  seq: z.number().int().nonnegative().optional(),
  payload: z.unknown().optional(),
  error: z.object({ code: z.string().max(64), message: z.string().max(512) }).optional(),
  ts: z.number().optional(),
});

export type ParseResult =
  | { ok: true; env: Envelope }
  | { ok: false; code: 'bad_json' | 'bad_envelope' | 'binary_not_allowed'; message: string };

/**
 * 네트워크에서 받은 원본 데이터를 Envelope로 변환.
 * 실패해도 throw 하지 않고 결과 객체로 돌려준다 (잘못된 입력은 "예외적 상황"이 아니라 "일상"이므로).
 */
export function parseEnvelope(raw: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, code: 'bad_json', message: 'JSON 파싱 실패' };
  }
  const parsed = envelopeSchema.safeParse(json);
  if (!parsed.success) {
    // 에러 상세(issues)는 로그로만 남기고 클라이언트에는 요약만 → 내부 구조 노출 최소화
    const first = parsed.error.issues[0];
    return {
      ok: false,
      code: 'bad_envelope',
      message: `잘못된 메시지 형식: ${first?.path.join('.') || '(root)'} ${first?.message ?? ''}`.trim(),
    };
  }
  return { ok: true, env: parsed.data as Envelope };
}

export function encode(env: Envelope): string {
  return JSON.stringify(env);
}

/** Envelope 생성 헬퍼. v/ts 같은 반복 필드를 채워 준다. */
export function makeEnvelope<T>(type: string, payload?: T, extra: Partial<Envelope<T>> = {}): Envelope<T> {
  return { v: PROTOCOL_VERSION, type, ...(payload !== undefined ? { payload } : {}), ...extra };
}
