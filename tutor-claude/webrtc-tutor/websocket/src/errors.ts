/**
 * errors.ts — WebSocket Close Code 와 앱 에러
 *
 * WebSocket을 닫을 때는 "숫자 코드 + 사유 문자열"을 함께 보냅니다 (RFC 6455 §7.4).
 * 클라이언트는 이 코드를 보고 "재연결해야 하나? 포기해야 하나?"를 결정합니다.
 *
 *   1000  정상 종료              → 재연결 불필요
 *   1001  Going Away (서버 종료/페이지 이동) → 재연결(지터 포함)
 *   1006  비정상 종료(코드 없음)  → 네트워크 단절. 라이브러리가 내부적으로 쓰는 값이며 직접 보낼 수 없다
 *   1008  Policy Violation       → 정책 위반
 *   1009  Message Too Big        → 메시지가 maxPayload 초과 (ws 라이브러리가 자동 전송)
 *   1011  Internal Error         → 서버 내부 오류
 *   1012  Service Restart        → 서버 재시작 중. "잠시 후 다시 접속하세요"
 *   1013  Try Again Later        → 과부하. 천천히 재시도
 *
 *   4000~4999 는 "애플리케이션이 자유롭게 정의"하는 영역입니다. 아래가 이 튜토리얼의 정의.
 */
export const CloseCode = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,

  // ↓ 앱 정의 코드 — 클라이언트가 "재연결 해야 하는지" 판단하는 기준이 된다
  AUTH_FAILED: 4001, // 인증 실패       → 재연결해도 소용없음. 로그인 화면으로
  TOKEN_EXPIRED: 4002, // 토큰 만료     → 새 토큰 받아서 재연결
  KICKED: 4003, // 중복 로그인 등으로 쫓겨남 → 재연결하면 서로 쫓아내는 핑퐁 발생! 하지 말 것
  RATE_LIMITED: 4008, // 너무 많은 요청  → 한참 뒤 재시도
  SLOW_CONSUMER: 4009, // 수신이 너무 느려 서버 메모리 보호를 위해 끊음 → 재연결 허용
  HEARTBEAT_TIMEOUT: 4010, // 하트비트 응답 없음
} as const;

/** 재연결해도 되는 close code 인가? (클라이언트 정책의 기본값) */
export function isRetryableClose(code: number): boolean {
  switch (code) {
    case CloseCode.NORMAL: // 서버가 정상 종료했다면 보통 의도된 종료
    case CloseCode.POLICY_VIOLATION:
    case CloseCode.AUTH_FAILED:
    case CloseCode.KICKED:
      return false;
    default:
      return true; // 1001, 1006, 1011, 1012, 1013, 4002, 4008, 4009, 4010 ...
  }
}

/** 핸들러/인증에서 던지는 "예상된" 에러. code는 클라이언트에 그대로 전달된다. */
export class WsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'WsError';
  }
}

/** 인증 단계 에러. httpStatus는 업그레이드 거절 시 응답 코드로 쓰인다. */
export class AuthError extends WsError {
  constructor(
    code: string,
    message: string,
    public readonly httpStatus: 401 | 403 = 401,
  ) {
    super(code, message);
    this.name = 'AuthError';
  }
}
