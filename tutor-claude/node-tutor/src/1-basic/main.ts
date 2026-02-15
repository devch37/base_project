/**
 * ============================================
 * NestJS 애플리케이션 진입점 (Entry Point)
 * ============================================
 *
 * 이 파일은 NestJS 애플리케이션이 시작되는 곳입니다.
 * 서버를 부트스트랩하고 설정을 초기화합니다.
 */

import 'reflect-metadata';  // TypeScript 데코레이터 메타데이터를 위해 필요
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * bootstrap 함수
 * - 애플리케이션을 생성하고 시작하는 비동기 함수
 * - async/await를 사용하여 비동기 작업 처리
 */
async function bootstrap() {
  /**
   * NestFactory.create()
   * - NestJS 애플리케이션 인스턴스 생성
   * - AppModule을 루트 모듈로 사용
   * - Express를 기본 HTTP 서버로 사용 (Fastify로 변경 가능)
   */
  const app = await NestFactory.create(AppModule);

  /**
   * 전역 프리픽스 설정
   * - 모든 라우트 앞에 /api가 붙음
   * - 예: /posts -> /api/posts
   */
  app.setGlobalPrefix('api');

  /**
   * CORS 활성화
   * - 다른 도메인에서 API 호출 허용
   * - 프론트엔드와 백엔드가 다른 포트에서 실행될 때 필요
   */
  app.enableCors({
    origin: 'http://localhost:3000',  // 허용할 도메인
    credentials: true,  // 쿠키 전송 허용
  });

  /**
   * 서버 시작
   * - 환경변수 PORT가 있으면 사용, 없으면 3000번 포트 사용
   * - await를 사용하여 서버가 완전히 시작될 때까지 대기
   */
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════╗
    ║   🚀 NestJS Basic Server Started!   ║
    ╠═══════════════════════════════════════╣
    ║   📡 Server: http://localhost:${port}    ║
    ║   📚 API Docs: http://localhost:${port}/api ║
    ╚═══════════════════════════════════════╝
  `);

  console.log('\n사용 가능한 엔드포인트:');
  console.log('  GET    /api/posts          - 모든 게시글 조회');
  console.log('  GET    /api/posts/:id      - 특정 게시글 조회');
  console.log('  POST   /api/posts          - 게시글 생성');
  console.log('  PUT    /api/posts/:id      - 게시글 수정');
  console.log('  DELETE /api/posts/:id      - 게시글 삭제');
  console.log('\n  GET    /api/users          - 모든 사용자 조회');
  console.log('  GET    /api/users/:id      - 특정 사용자 조회');
  console.log('  POST   /api/users          - 사용자 생성');
  console.log('\n테스트 방법:');
  console.log('  curl http://localhost:3000/api/posts');
  console.log('  또는 브라우저에서 http://localhost:3000/api/posts 접속\n');
}

/**
 * bootstrap 함수 실행
 * - 최상위 레벨에서 실행되므로 catch로 에러 처리 필요
 */
bootstrap().catch((error) => {
  console.error('❌ 서버 시작 중 에러 발생:', error);
  process.exit(1);  // 에러 발생 시 프로세스 종료
});
