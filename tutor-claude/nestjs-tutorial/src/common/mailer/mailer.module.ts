/**
 * ============================================================================
 * MailerModule — 동적 모듈(Dynamic Module) 예제
 * ----------------------------------------------------------------------------
 * 일반 모듈은 @Module({...}) 데코레이터만으로 정의가 끝납니다.
 * 하지만 "사용하는 쪽에서 설정값을 주입"해야 하는 모듈(DB, JWT, 메일러 등)은
 * `static forRoot(options)` 같은 정적 메서드가 DynamicModule 을 반환하게 만듭니다.
 *
 *   // 동기 설정
 *   MailerModule.forRoot({ from: 'no-reply@x.com', preview: true })
 *
 *   // 비동기 설정 (ConfigService 등 다른 프로바이더에 의존)
 *   MailerModule.forRootAsync({
 *     inject: [ConfigService],
 *     useFactory: (cfg: ConfigService) => ({ from: cfg.get('MAIL_FROM') }),
 *   })
 *
 * @Global() 을 붙였으므로 한 번 forRoot 하면 어느 모듈에서든 MailerService 주입 가능.
 * (실무에서는 남용하지 말 것 — 정말 전역적인 것에만)
 *
 * 참고: NestJS 최신 버전은 ConfigurableModuleBuilder 로 이 보일러플레이트를
 *       상당 부분 자동 생성할 수 있습니다. docs/12 참고.
 * ============================================================================
 */
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { MailerService } from './mailer.service';
import {
  MAILER_OPTIONS,
  MailerAsyncOptions,
  MailerOptions,
} from './mailer.types';

@Global()
@Module({})
export class MailerModule {
  /** 동기 설정 */
  static forRoot(options: MailerOptions): DynamicModule {
    return {
      module: MailerModule,
      providers: [
        { provide: MAILER_OPTIONS, useValue: options },
        MailerService,
      ],
      exports: [MailerService],
    };
  }

  /** 비동기 설정 (다른 프로바이더에 의존하는 팩토리) */
  static forRootAsync(options: MailerAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: MAILER_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
    return {
      module: MailerModule,
      imports: options.imports ?? [],
      providers: [optionsProvider, MailerService],
      exports: [MailerService],
    };
  }
}
