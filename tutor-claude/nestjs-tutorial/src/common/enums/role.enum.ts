/**
 * 사용자 권한(역할) — RBAC(Role-Based Access Control)의 기본 단위.
 * 문자열 enum 을 쓰면 DB에 저장된 값과 로그가 사람이 읽기 좋습니다.
 */
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}
