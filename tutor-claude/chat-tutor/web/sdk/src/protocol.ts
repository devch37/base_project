/**
 * co-browsing 프로토콜 정의 (고객 SDK ↔ 서버 ↔ 상담사 콘솔이 공유하는 "약속").
 *
 * 왜 버전 번호(v)가 있나? (20장)
 *   SDK 는 고객사 웹사이트에 심겨 배포된다. 상담사 콘솔을 새 버전으로 올려도
 *   고객 브라우저에는 며칠 전 버전 SDK 가 캐시돼 있을 수 있다.
 *   메시지에 버전이 있어야 "모르는 버전이면 무시하거나 안내" 같은 처리를 할 수 있다.
 */
export const PROTOCOL_VERSION = 1 as const;

// ─────────────────────────────────────────────────────────────
// 1) DOM 직렬화 결과 (15장)
// ─────────────────────────────────────────────────────────────

/** 직렬화된 노드. id 는 "이 epoch 동안" 고객 쪽과 상담사 쪽이 같은 노드를 가리키는 번호다. */
export type SerializedNode = SerializedElement | SerializedText;

export interface SerializedElement {
  id: number;
  t: 'el';
  tag: string; // 소문자 태그명
  ns?: 'svg'; // SVG 는 createElementNS 로 만들어야 그려진다
  attrs: Record<string, string>;
  children: SerializedNode[];
  /** 폼 요소의 "현재 값" (attribute 가 아니라 property! 15장 함정) */
  value?: string;
  checked?: boolean;
}

export interface SerializedText {
  id: number;
  t: 'text';
  text: string;
}

export interface SnapshotData {
  root: SerializedElement; // <html>
  url: string; // 고객이 보고 있는 페이지 주소 (상담사 화면 상단 표시용)
  viewport: { w: number; h: number };
  scroll: { x: number; y: number };
}

/** MutationObserver 기록을 "재생 가능한 연산"으로 바꾼 것 */
export type MutationOp =
  | { op: 'add'; parentId: number; beforeId: number | null; node: SerializedNode }
  | { op: 'remove'; id: number }
  | { op: 'attr'; id: number; name: string; value: string | null }
  | { op: 'text'; id: number; text: string };

// ─────────────────────────────────────────────────────────────
// 2) 고객 → 상담사 프레임
// ─────────────────────────────────────────────────────────────

export type Frame =
  | { type: 'snapshot'; data: SnapshotData }
  | { type: 'mutation'; ops: MutationOp[] }
  | { type: 'input'; id: number; value?: string; checked?: boolean }
  | { type: 'scroll'; id: number; x: number; y: number } // id 0 = 창(window) 전체
  | { type: 'viewport'; w: number; h: number }
  | { type: 'pointer'; x: number; y: number }
  /** 원격 명령 처리 결과. 에코 루프 방지의 핵심 (17장) */
  | { type: 'ack'; cmdId: string; ok: boolean; reason?: string; id?: number; value?: string; checked?: boolean };

/**
 * 순서 정보가 붙은 프레임 (19장).
 *  epoch: 스냅샷마다 새로 만드는 ID. "어느 스냅샷 기준의 변경분인가"
 *  seq  : epoch 안에서 1, 2, 3 ... 빈 번호가 있으면 무언가 빠졌다는 뜻
 */
export interface FrameEnvelope {
  v: typeof PROTOCOL_VERSION;
  epoch: string;
  seq: number;
  t: number; // 고객 브라우저 시각(ms) — 지연 측정용
  frame: Frame;
}

// ─────────────────────────────────────────────────────────────
// 3) 선(wire) 위의 모양 (14장·18장)
//   f: 작은 프레임 그대로     z: gzip+base64 로 압축     c: 큰 메시지의 조각
// ─────────────────────────────────────────────────────────────

export type Wire =
  | { k: 'f'; e: FrameEnvelope }
  | { k: 'z'; d: string }
  | { k: 'c'; id: string; i: number; n: number; d: string };

// ─────────────────────────────────────────────────────────────
// 4) 상담사 → 고객 명령 (17장). by/at 은 서버가 찍는다.
// ─────────────────────────────────────────────────────────────

export type Command =
  | { type: 'click'; cmdId: string; id: number; by?: string }
  | { type: 'input'; cmdId: string; id: number; value?: string; checked?: boolean; by?: string }
  | { type: 'scroll'; cmdId: string; id: number; x: number; y: number; by?: string }
  | { type: 'highlight'; cmdId: string; id: number; by?: string }
  | { type: 'resync'; reason: string; by?: string };

// ─────────────────────────────────────────────────────────────
// 5) 방 상태·채팅 (서버가 만든다)
// ─────────────────────────────────────────────────────────────

export type RoomStatus =
  | { type: 'presence'; roomId: string; customerSharing: boolean; agentsViewing: string[]; nodes: string[] }
  | { type: 'consent'; remoteControl: boolean }
  | { type: 'closed'; by: string };

export interface ChatMessage {
  type: 'chat';
  id: string;
  from: string;
  role: 'CUSTOMER' | 'AGENT';
  text: string;
  at: number;
}

/** STOMP 주소 모음 — 문자열을 여기저기 흩어 두면 오타 하나로 "아무 메시지도 안 오는" 버그가 난다 */
export const dest = {
  frameSend: (room: string) => `/app/cobrowse/${room}/frame`,
  commandSend: (room: string) => `/app/cobrowse/${room}/command`,
  resyncSend: (room: string) => `/app/cobrowse/${room}/resync`,
  consentSend: (room: string) => `/app/cobrowse/${room}/consent`,
  chatSend: (room: string) => `/app/rooms/${room}/chat`,
  closeSend: (room: string) => `/app/rooms/${room}/close`,
  tokenRefresh: '/app/token/refresh',
  screen: (room: string) => `/topic/cobrowse/${room}/screen`,
  commands: (room: string) => `/topic/cobrowse/${room}/commands`,
  status: (room: string) => `/topic/rooms/${room}/status`,
  chat: (room: string) => `/topic/rooms/${room}/chat`,
  errors: '/user/queue/errors',
  token: '/user/queue/token',
} as const;
