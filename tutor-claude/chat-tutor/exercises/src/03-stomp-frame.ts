/**
 * 연습 03 (08장) — STOMP 프레임 직접 만들고 읽기
 *
 * 프레임 형식: COMMAND\n header:value\n ... \n\n BODY \0
 *  - 서버가 보내는 heartbeat 는 프레임이 아니라 줄바꿈 한 글자("\n")다 → 무시
 *  - 한 번의 WebSocket 메시지에 프레임이 여러 개 붙어 올 수 있다 → 전부 돌려준다
 *  - 헤더 값의 특수문자는 이스케이프: \  → \\ ,  줄바꿈 → \n ,  콜론 → \c   (CONNECT/CONNECTED 프레임은 예외지만 여기선 무시)
 *  - 같은 헤더가 두 번 나오면 "처음 것"이 이긴다 (STOMP 1.2 규칙)
 */
export interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

export function encodeFrame(f: StompFrame): string {
  throw new Error('TODO: encodeFrame');
}

export function decodeFrames(data: string): StompFrame[] {
  throw new Error('TODO: decodeFrames');
}
