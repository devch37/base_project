/**
 * ============================================================================
 * auth.module.ts
 * ----------------------------------------------------------------------------
 * - PassportModule: 전략(Strategy) 인프라 제공
 * - JwtModule: 토큰 서명/검증 (여기서는 sign 옵션을 서비스에서 매번 지정하므로
 *              register 는 비워두고, secret 도 서비스에서 주입)
 * - UsersModule: UsersService 를 주입받기 위해 import (UsersModule 이 export 함)
 * ============================================================================
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}), // 옵션은 signAsync 호출 시 개별 지정
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
