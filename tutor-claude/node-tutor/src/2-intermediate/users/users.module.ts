/**
 * ============================================
 * Users Module - 사용자 모듈 (Intermediate)
 * ============================================
 *
 * AuthModule을 import해서 AuthService 사용
 */

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],  // AuthService를 주입받기 위해 AuthModule import
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
