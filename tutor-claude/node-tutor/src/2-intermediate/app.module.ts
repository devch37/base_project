/**
 * ============================================
 * App Module - 루트 모듈 (Intermediate)
 * ============================================
 *
 * 1단계 대비 추가된 내용:
 * - NestModule 구현으로 Middleware 설정
 * - AuthModule import
 * - 전역 Guard, Interceptor, Filter는 main.ts에서 설정
 *
 * NestModule.configure():
 * - MiddlewareConsumer를 통해 미들웨어 적용 범위 설정
 * - 라우트별, 컨트롤러별, 전역 적용 가능
 */

import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';

@Module({
  imports: [
    AuthModule,
    PostsModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  /**
   * configure()
   * ===========
   * 미들웨어를 라우트에 연결하는 메서드
   *
   * MiddlewareConsumer API:
   * .apply(Middleware1, Middleware2) - 미들웨어 지정 (순서대로 실행)
   * .forRoutes('*')                  - 모든 라우트에 적용
   * .forRoutes(Controller)          - 특정 컨트롤러에 적용
   * .forRoutes({ path: 'posts', method: RequestMethod.ALL })
   * .exclude({ path: 'users/login', method: RequestMethod.POST })
   */
  configure(consumer: MiddlewareConsumer): void {
    // 1. 모든 요청에 로거 미들웨어 적용
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // 2. 모든 요청에 인증 미들웨어 적용
    //    (토큰이 있으면 req.user에 설정, 없으면 그냥 통과)
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

/**
 * 미들웨어 설정 패턴 예시
 * ========================
 *
 * // 특정 경로에만 적용
 * consumer
 *   .apply(RateLimitMiddleware)
 *   .forRoutes({ path: 'auth/login', method: RequestMethod.POST });
 *
 * // 특정 컨트롤러에 적용
 * consumer
 *   .apply(AuthMiddleware)
 *   .forRoutes(PostsController, UsersController);
 *
 * // 특정 경로 제외
 * consumer
 *   .apply(AuthMiddleware)
 *   .exclude(
 *     { path: 'users/login', method: RequestMethod.POST },
 *     { path: 'users/register', method: RequestMethod.POST },
 *   )
 *   .forRoutes('*');
 *
 * // 여러 미들웨어 순서대로 적용
 * consumer
 *   .apply(LoggerMiddleware, AuthMiddleware, RateLimitMiddleware)
 *   .forRoutes('*');
 */
