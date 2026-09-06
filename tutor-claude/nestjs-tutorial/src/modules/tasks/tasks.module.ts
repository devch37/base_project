import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { StatsService } from './stats.service';

/**
 * ScheduleModule.forRoot() 는 app.module 에서 한 번만 등록합니다.
 * 이 모듈은 스케줄 잡을 가진 프로바이더(StatsService)만 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Post])],
  providers: [StatsService],
})
export class TasksModule {}
