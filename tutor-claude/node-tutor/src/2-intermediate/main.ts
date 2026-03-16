/**
 * ============================================
 * Main - 애플리케이션 진입점 (Intermediate)
 * ============================================
 *
 * 1단계 대비 추가된 내용:
 * - 전역 Guard 등록 (모든 라우트에 인증 적용)
 * - 전역 Interceptor 등록 (응답 표준화)
 * - 전역 Filter 등록 (에러 처리 표준화)
 * - 전역 Pipe 등록은 선택 (컨트롤러에서 개별 적용)
 *
 * 전역 설정 vs 모듈/컨트롤러 레벨:
 * - 전역: 모든 라우트에 적용, 코드 중복 제거
 * - 모듈/컨트롤러: 세밀한 제어 가능
 * - 실무: 보통 전역으로 기본 설정 + 특정 라우트에서 오버라이드
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  /**
   * 전역 Exception Filter 등록
   * - AllExceptionsFilter: 모든 예외 (마지막 안전망)
   * - HttpExceptionFilter: HTTP 예외 (우선 처리)
   *
   * 순서 중요: 나중에 등록한 필터가 먼저 실행됨
   * AllExceptions → HttpException 순서로 등록하면
   * HttpException이 먼저 처리됨
   */
  const reflector = app.get(Reflector);

  app.useGlobalFilters(
    new AllExceptionsFilter(),    // HTTP가 아닌 예외 처리
    new HttpExceptionFilter(),    // HTTP 예외 처리 (나중에 등록 = 먼저 실행)
  );

  /**
   * 전역 Interceptor 등록
   * - 모든 응답을 { success, data, timestamp, path } 형식으로 변환
   */
  app.useGlobalInterceptors(new TransformInterceptor());

  /**
   * 전역 Guard 등록
   * - 기본적으로 모든 라우트에 인증 적용
   * - @Public() 데코레이터로 특정 라우트 인증 제외
   *
   * 주의: APP_GUARD providers 방식과 다름
   * - app.useGlobalGuards(): DI 컨테이너 밖 (Reflector 직접 주입 필요)
   * - providers [APP_GUARD]: DI 컨테이너 안 (Reflector 자동 주입)
   */
  app.useGlobalGuards(
    new AuthGuard(reflector),
    new RolesGuard(reflector),
  );

  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`
  ╔══════════════════════════════════════════════╗
  ║  🔐 NestJS Intermediate Server Started!     ║
  ╠══════════════════════════════════════════════╣
  ║  📡 Server: http://localhost:${port}            ║
  ║  📚 API:    http://localhost:${port}/api        ║
  ╚══════════════════════════════════════════════╝
  `);

  console.log('\n📌 기본 테스트 계정:');
  console.log('  Admin: admin@example.com / Admin1234!');
  console.log('  User:  user@example.com  / User1234!');

  console.log('\n📋 인증 흐름:');
  console.log('  1. 로그인:');
  console.log('     curl -X POST http://localhost:3002/api/users/login \\');
  console.log('       -H "Content-Type: application/json" \\');
  console.log('       -d \'{"email":"user@example.com","password":"User1234!"}\'');
  console.log('\n  2. 토큰 사용:');
  console.log('     curl http://localhost:3002/api/posts/my \\');
  console.log('       -H "Authorization: Bearer <access_token>"');

  console.log('\n📋 주요 엔드포인트:');
  console.log('  [공개]');
  console.log('  POST /api/users/register    - 회원가입');
  console.log('  POST /api/users/login       - 로그인 (토큰 발급)');
  console.log('  GET  /api/posts             - 게시글 목록');
  console.log('  GET  /api/posts/:id         - 게시글 상세');
  console.log('\n  [인증 필요]');
  console.log('  GET  /api/users/profile     - 내 프로필');
  console.log('  GET  /api/posts/my          - 내 게시글');
  console.log('  POST /api/posts             - 게시글 작성');
  console.log('  PUT  /api/posts/:id         - 게시글 수정');
  console.log('  DELETE /api/posts/:id       - 게시글 삭제');
  console.log('\n  [Admin만]');
  console.log('  GET  /api/users             - 전체 사용자 목록');
  console.log('  GET  /api/posts/admin/all   - 삭제 포함 전체 목록\n');
}

bootstrap().catch((error) => {
  console.error('❌ 서버 시작 중 에러 발생:', error);
  process.exit(1);
});
