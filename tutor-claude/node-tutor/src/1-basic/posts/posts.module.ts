/**
 * ============================================
 * Posts Module - 게시글 기능 모듈
 * ============================================
 *
 * Feature Module 패턴
 * - 특정 기능을 담당하는 독립적인 모듈
 * - 관련된 Controller, Service, Entity 등을 하나로 묶음
 */

import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],  // 다른 모듈에서 사용 가능하도록 export
})
export class PostsModule {}
