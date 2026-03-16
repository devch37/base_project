/**
 * ============================================
 * Auth Module - 인증 모듈
 * ============================================
 *
 * AuthService를 다른 모듈에서 사용할 수 있도록 exports
 * - UsersModule: 로그인 시 AuthService 사용
 * - AuthMiddleware: 토큰 검증 시 AuthService 사용
 */

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService],
  /**
   * exports에 AuthService를 포함하면
   * 다른 모듈에서 import 후 사용 가능
   */
  exports: [AuthService],
})
export class AuthModule {}
