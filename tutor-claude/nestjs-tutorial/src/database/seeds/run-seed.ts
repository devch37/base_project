/**
 * run-seed.ts — 시드 실행 엔트리포인트
 * ----------------------------------------------------------------------------
 *   npm run seed
 *
 * data-source.ts 는 synchronize:false 이므로, 시드 전에 스키마가 있어야 합니다.
 * 학습 편의를 위해 여기서는 synchronize 를 켠 임시 DataSource 로 테이블을 보장합니다.
 * (실무라면 마이그레이션을 먼저 실행)
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { seed } from './seed';

loadEnv();

const dataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_DATABASE ?? 'data/dev.sqlite',
  entities: ['src/**/*.entity.ts'],
  synchronize: true, // 시드 스크립트 한정
});

async function main() {
  await dataSource.initialize();
  try {
    await seed(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('시드 실패:', err);
  process.exit(1);
});
