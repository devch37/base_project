/**
 * ============================================================================
 * data-source.ts — TypeORM CLI 전용 DataSource
 * ----------------------------------------------------------------------------
 * NestJS 런타임은 TypeOrmModule 설정(typeorm.config.ts)을 사용합니다.
 * 하지만 `typeorm migration:generate` 같은 CLI 명령은 Nest 컨텍스트 밖에서
 * 돌기 때문에, 순수 DataSource 정의가 별도로 필요합니다.
 *
 *   npm run migration:generate -- src/database/migrations/AddXxx
 *   npm run migration:run
 *   npm run migration:revert
 * ============================================================================
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

loadEnv(); // .env 로드 (CLI 실행 시)

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_DATABASE ?? 'data/dev.sqlite',
  // CLI 에서는 컴파일 전 .ts 를 직접 읽으므로 .ts 글로브를 사용
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, // 마이그레이션을 쓸 때는 항상 false
  logging: process.env.DB_LOGGING === 'true',
});
