/**
 * ============================================
 * App Module - 루트 모듈
 * ============================================
 *
 * NestJS의 Module은 애플리케이션의 구성 단위입니다.
 * 관련된 기능들(Controller, Service 등)을 하나로 묶어 관리합니다.
 *
 * 왜 Module을 사용할까?
 * 1. 코드 조직화: 기능별로 코드를 그룹화
 * 2. 의존성 관리: 필요한 모듈만 import하여 사용
 * 3. 캡슐화: 모듈 내부 구현을 숨기고 필요한 것만 export
 * 4. 재사용성: 다른 프로젝트에서도 모듈 단위로 재사용 가능
 */

import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * @Module 데코레이터
 * - 이 클래스가 NestJS 모듈임을 선언
 * - 메타데이터를 통해 모듈의 구성을 정의
 */
@Module({
  /**
   * imports: 이 모듈에서 사용할 다른 모듈들
   * - PostsModule: 게시글 관련 기능
   * - UsersModule: 사용자 관련 기능
   *
   * 다른 모듈을 import하면 해당 모듈에서 export한 providers를 사용할 수 있습니다.
   */
  imports: [
    PostsModule,
    UsersModule,
  ],

  /**
   * controllers: 이 모듈의 컨트롤러들
   * - HTTP 요청을 처리하는 클래스들
   * - 라우팅과 요청/응답 처리를 담당
   *
   * 여기서는 루트 경로(/)를 처리하는 AppController만 포함
   */
  controllers: [
    AppController,
  ],

  /**
   * providers: 이 모듈의 서비스들
   * - 비즈니스 로직을 담당하는 클래스들
   * - @Injectable() 데코레이터가 붙은 클래스들
   * - 의존성 주입(DI)이 가능
   *
   * AppService는 AppController에서 사용됩니다.
   */
  providers: [
    AppService,
  ],

  /**
   * exports: 다른 모듈에서 사용할 수 있도록 내보낼 providers
   * - 현재는 비어있음 (AppService는 이 모듈 내부에서만 사용)
   * - 다른 모듈에서 AppService를 사용하려면 여기에 추가해야 함
   *
   * 예:
   * exports: [AppService]  // 다른 모듈에서 import하면 AppService 사용 가능
   */
  exports: [],
})
export class AppModule {
  /**
   * 모듈 클래스 자체는 보통 비어있습니다.
   * 모든 설정은 @Module 데코레이터에서 처리됩니다.
   *
   * 필요한 경우 constructor에서 의존성을 주입받을 수 있습니다:
   *
   * constructor(private readonly appService: AppService) {
   *   console.log('AppModule이 초기화되었습니다.');
   * }
   */
}

/**
 * 모듈 구조 이해하기
 * ==================
 *
 * AppModule (루트)
 *  ├── PostsModule
 *  │    ├── PostsController
 *  │    └── PostsService
 *  └── UsersModule
 *       ├── UsersController
 *       └── UsersService
 *
 * 이러한 모듈 구조는:
 * 1. 각 기능을 독립적으로 개발 가능
 * 2. 테스트가 용이함
 * 3. 팀 단위로 개발 시 충돌 최소화
 * 4. 마이크로서비스로 분리하기 쉬움
 */

/**
 * 실전 팁
 * ========
 *
 * 1. Feature Module 패턴
 *    - 기능별로 모듈을 나누는 것이 좋습니다.
 *    - 예: UsersModule, PostsModule, AuthModule, PaymentModule
 *
 * 2. Shared Module
 *    - 여러 모듈에서 공통으로 사용하는 기능은 SharedModule로 분리
 *    - 예: 로깅, 설정, 유틸리티 함수
 *
 * 3. Core Module
 *    - 앱 전체에서 한 번만 import되어야 하는 모듈
 *    - 예: 데이터베이스 연결, 전역 설정
 *
 * 4. Dynamic Module
 *    - 런타임에 설정을 받아 모듈을 생성
 *    - 예: ConfigModule.forRoot({ isGlobal: true })
 */
