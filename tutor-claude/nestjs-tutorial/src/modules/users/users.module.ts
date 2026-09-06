/**
 * users.module.ts
 * ----------------------------------------------------------------------------
 * - TypeOrmModule.forFeature([User]) → 이 모듈 스코프에서 Repository<User> 주입 가능
 * - exports: [UsersService] → auth 모듈이 UsersService 를 쓸 수 있도록 공개
 * ============================================================================
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
