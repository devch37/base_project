/**
 * ============================================================================
 * typeorm.config.ts — NestJS 런타임용 TypeORM 설정 팩토리
 * ----------------------------------------------------------------------------
 * app.module 에서 TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService })
 * 형태로 사용합니다. ConfigService 를 주입받아 .env 값을 반영합니다.
 * ============================================================================
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const synchronize = this.config.get<boolean>('database.synchronize', false);
    const isProd = this.config.get<string>('app.env') === 'production';

    return {
      type: 'better-sqlite3',
      database: this.config.get<string>('database.database', 'data/dev.sqlite'),

      // autoLoadEntities: TypeOrmModule.forFeature 로 등록된 엔티티를 자동 수집.
      // 엔티티 목록을 손으로 관리하지 않아도 됩니다.
      autoLoadEntities: true,

      // synchronize: 엔티티 정의에 맞춰 테이블을 자동 생성/변경.
      // ⚠️ 개발 초기에만 사용. 운영에서 켜면 데이터가 날아갈 수 있습니다.
      //    운영은 반드시 migration 을 사용하세요(docs/05).
      synchronize: synchronize && !isProd,

      logging: this.config.get<boolean>('database.logging', false),

      // 마이그레이션 실행 파일 위치 (컴파일된 dist 기준)
      migrations: ['dist/database/migrations/*.js'],
    };
  }
}
