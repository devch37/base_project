/**
 * ============================================================================
 * main.ts — 애플리케이션 부트스트랩(진입점)
 * ----------------------------------------------------------------------------
 * NestFactory 로 앱을 만들고, "전역 설정"을 적용한 뒤 포트를 엽니다.
 *   · 보안 헤더(helmet), 응답 압축(compression), CORS
 *   · 전역 ValidationPipe (DTO 자동 검증/변환)
 *   · API 프리픽스 (/api)
 *   · Swagger 문서 (/api/docs)
 *   · Graceful shutdown (SIGTERM 시 리소스 정리)
 *
 * 전역 가드/인터셉터/필터는 app.module 에서 프로바이더로 등록했습니다(DI 때문).
 * ============================================================================
 */
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Nest 기본 로거 사용. 실무에서는 pino/winston 로 교체(docs/08)
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  const isProd = config.get<string>('app.env') === 'production';

  // --- 보안/성능 미들웨어 -------------------------------------------
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: isProd ? ['https://example.com'] : true, // 개발은 전체 허용
    credentials: true,
  });

  // --- 라우팅 --------------------------------------------------------
  app.setGlobalPrefix(apiPrefix); // 모든 라우트에 /api 접두어

  // API 버저닝: 이 튜토리얼은 URL을 단순하게 유지하려고 끄지만,
  // 실무에서 v1 → v2 마이그레이션이 필요하면 아래처럼 켭니다. (경로가 /api/v1/... 로 바뀜)
  //   import { VersioningType } from '@nestjs/common';
  //   app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  //   그 뒤 컨트롤러/핸들러에 @Version('2') 로 특정 버전만 오버라이드

  // --- 전역 검증 파이프 -------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 속성은 제거
      forbidNonWhitelisted: true, // 없는 속성이 오면 400 에러
      transform: true, // 페이로드를 DTO 클래스 인스턴스로 변환
      transformOptions: { enableImplicitConversion: true }, // "3" → 3
    }),
  );

  // --- Graceful shutdown ------------------------------------------
  // onModuleDestroy / beforeApplicationShutdown 훅이 호출되도록 활성화
  app.enableShutdownHooks();

  // --- Swagger (OpenAPI) ----------------------------------------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Tutorial API')
    .setDescription('게시판 예제 — 인증/게시글/댓글')
    .setVersion('1.0')
    .addBearerAuth() // Authorize 버튼에 JWT 입력란
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 서버 실행: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 API 문서:  http://localhost:${port}/${apiPrefix}/docs`);
}

// void: 부트스트랩 프로미스를 의도적으로 기다리지 않음(최상위)
void bootstrap();
