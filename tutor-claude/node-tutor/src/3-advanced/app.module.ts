/**
 * ============================================
 * App Module - 루트 모듈 (3-advanced)
 * ============================================
 *
 * Clean Architecture의 최상위:
 * - 모든 모듈을 조합
 * - 인프라 설정 (DB, 외부 서비스 등)
 * - 전역 설정
 */

import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    PostsModule,
    /**
     * 실무에서 추가될 모듈들:
     * TypeOrmModule.forRoot({ ... }),     // DB 연결
     * ConfigModule.forRoot({ isGlobal: true }), // 환경변수
     * CacheModule.register({ ... }),       // 캐싱
     * UsersModule,
     * AuthModule,
     */
  ],
})
export class AppModule {}
