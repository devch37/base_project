/**
 * ============================================
 * Main - 애플리케이션 진입점 (3-advanced)
 * ============================================
 *
 * Clean Architecture의 완성:
 * - 각 계층이 독립적으로 테스트 가능
 * - 인프라 교체 용이 (InMemory → TypeORM)
 * - 도메인 로직이 프레임워크와 독립적
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: '*' });

  const port = process.env.PORT || 3003;
  await app.listen(port);

  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║  🏗️  NestJS Advanced (Clean Architecture)       ║
  ╠══════════════════════════════════════════════════╣
  ║  📡 Server: http://localhost:${port}                ║
  ╚══════════════════════════════════════════════════╝
  `);

  console.log('\n🏛️  아키텍처 계층:');
  console.log('  Presentation (Controller) → Application (Use Case) → Domain (Entity/VO) → Infrastructure (Repository)');

  console.log('\n📋 엔드포인트:');
  console.log(`  GET    http://localhost:${port}/api/posts         - 게시글 목록`);
  console.log(`  GET    http://localhost:${port}/api/posts/1       - 게시글 상세`);
  console.log(`  POST   http://localhost:${port}/api/posts         - 게시글 생성`);
  console.log(`  PUT    http://localhost:${port}/api/posts/1       - 게시글 수정`);
  console.log(`  DELETE http://localhost:${port}/api/posts/1       - 게시글 삭제`);

  console.log('\n📋 테스트 명령어:');
  console.log(`  # 목록 조회`);
  console.log(`  curl http://localhost:${port}/api/posts`);
  console.log(`\n  # 게시글 생성 (Clean Architecture 계층 이동 관찰)`);
  console.log(`  curl -X POST http://localhost:${port}/api/posts \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"title":"DDD 실전 가이드","content":"Domain-Driven Design의 핵심 개념과 실전 적용 방법을 알아봅니다."}'`);

  console.log('\n🔍 핵심 학습 포인트:');
  console.log('  1. Value Object: PostTitle, PostContent, Email - 타입 안전성 + 비즈니스 규칙');
  console.log('  2. Domain Entity: Post (Rich Model) - 비즈니스 메서드 포함');
  console.log('  3. Domain Events: PostCreatedEvent - 느슨한 결합');
  console.log('  4. Repository: 인터페이스/구현 분리 - DB 교체 용이');
  console.log('  5. Use Cases: 단일 책임 - 하나의 비즈니스 기능');
  console.log('  6. CQRS: Command/Query 분리 - 확장성\n');
}

bootstrap().catch((error) => {
  console.error('❌ 서버 시작 중 에러 발생:', error);
  process.exit(1);
});
