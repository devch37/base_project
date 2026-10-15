/**
 * 연습 04 (11장) — HS256 JWT 서명·검증 (node:crypto 만 사용)
 *
 * sign(payload, secret): header {"alg":"HS256","typ":"JWT"} 로 토큰을 만든다 (base64url)
 * verify(token, secret, nowSec): 검증 성공 시 payload, 실패 시 Error 를 던진다. 메시지는 아래 중 하나를 포함:
 *   'format'   — 점(.)으로 나눈 조각이 3개가 아님
 *   'alg'      — alg 가 HS256 이 아님 (none 공격 방지)
 *   'signature'— 서명 불일치
 *   'expired'  — nowSec >= exp
 * 서명 비교는 crypto.timingSafeEqual 로 (길이가 다르면 먼저 거른다).
 */
export function sign(payload: Record<string, unknown>, secret: string): string {
  throw new Error('TODO: sign');
}

export function verify(token: string, secret: string, nowSec: number): Record<string, unknown> {
  throw new Error('TODO: verify');
}
