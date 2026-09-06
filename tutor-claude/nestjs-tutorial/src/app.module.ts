/**
 * ============================================================================
 * app.module.ts — 루트 모듈 (모든 것을 조립하는 곳)
 * ----------------------------------------------------------------------------
 * NestJS 앱은 "모듈의 트리"입니다. 여기서 인프라 모듈(설정/DB/캐시/스케줄/rate limit)과
 * 도메인 모듈(users/auth/posts/comments)을 한데 모읍니다.
 *
 * APP_GUARD / APP_INTERCEPTOR / APP_FILTER 로 전역 컴포넌트를 "프로바이더로" 등록하면
 * DI 를 온전히 쓸 수 있습니다. (main.ts 의 app.useGlobalXxx 는 DI 주입이 제한적)
 *
 * ⚠️ APP_GUARD 는 배열 등록 순서대로 실행됩니다:
 *    1) ThrottlerGuard  (요청 수 제한 — 인증보다 먼저)
 *    2) JwtAuthGuard    (인증 — @Public 이면 통과)
 *    3) RolesGuard      (인가 — @Roles 검사)
 * ============================================================================
 */
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HashingModule } from './common/hashing/hashing.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { MailerModule } from './common/mailer/mailer.module';
import { configurations } from './config/configuration';
import { validationSchema } from './config/env.validation';
import { TypeOrmConfigService } from './database/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { HealthModule } from './modules/health/health.module';
import { PostsModule } from './modules/posts/posts.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // --- 설정 (전역) ---------------------------------------------------
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: configurations, // 네임스페이스별 타입 있는 설정 팩토리
      validationSchema, // 부팅 시 .env 검증 (Joi)
      validationOptions: { abortEarly: false },
    }),

    // --- 데이터베이스 -------------------------------------------------
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),

    // --- 캐시 (전역, 인메모리) --------------------------------------
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        ttl: cfg.get<number>('cache.ttl', 5000),
      }),
    }),

    // --- 요청 수 제한 (rate limiting) ------------------------------
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        throttlers: [
          {
            ttl: cfg.get<number>('throttle.ttl', 60000),
            limit: cfg.get<number>('throttle.limit', 100),
          },
        ],
      }),
    }),

    // --- 스케줄러 --------------------------------------------------
    ScheduleModule.forRoot(),

    // --- 공통(전역) 유틸 모듈 -----------------------------------
    HashingModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        from: 'no-reply@nestjs-tutorial.local',
        preview: cfg.get<string>('app.env') !== 'production',
      }),
    }),

    // --- 도메인 모듈 --------------------------------------------
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    HealthModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    // 전역 가드 (순서 중요)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },

    // 전역 인터셉터 (등록 순서 = 요청 진행 방향, 응답은 역순)
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    // 전역 예외 필터
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
