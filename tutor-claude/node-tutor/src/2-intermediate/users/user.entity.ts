/**
 * ============================================
 * User Entity - 사용자 엔티티 (Intermediate)
 * ============================================
 *
 * 1단계 대비 추가된 내용:
 * - passwordHash: 해시된 비밀번호 (원본 저장 금지!)
 * - role: 역할 기반 접근 제어용
 * - isActive: 계정 활성화 상태
 * - lastLoginAt: 마지막 로그인 시간
 */

import { UserRole } from '../guards/roles.decorator';

export class User {
  id: number;
  email: string;
  username: string;

  /**
   * 비밀번호는 반드시 해시로 저장
   * - 절대 평문(원본) 비밀번호 저장 금지!
   * - bcrypt 같은 단방향 해시 함수 사용
   */
  passwordHash: string;

  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  /**
   * 응답 시 비밀번호 해시 제외
   * - toJSON()을 오버라이드하면 JSON.stringify 시 자동 적용
   */
  toJSON() {
    const { passwordHash, ...rest } = this;
    return rest;
  }

  /**
   * 계정 활성화 여부 확인
   */
  isEnabled(): boolean {
    return this.isActive === true;
  }
}
