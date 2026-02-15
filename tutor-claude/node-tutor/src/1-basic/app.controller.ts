/**
 * ============================================
 * App Controller - 루트 컨트롤러
 * ============================================
 *
 * Controller는 HTTP 요청을 받아 처리하는 역할을 합니다.
 * - 라우팅 (어떤 URL로 요청이 오면 어떤 함수를 실행할지)
 * - 요청 데이터 추출 (Body, Query, Param 등)
 * - 응답 반환
 *
 * 실제 비즈니스 로직은 Service에서 처리하고,
 * Controller는 요청과 응답만 담당하는 것이 좋은 설계입니다.
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * @Controller() 데코레이터
 * - 이 클래스가 컨트롤러임을 선언
 * - 인자로 경로 프리픽스를 받을 수 있음
 *
 * @Controller('api') -> /api/* 경로 처리
 * @Controller()      -> /* 경로 처리 (루트)
 */
@Controller()
export class AppController {
  /**
   * 의존성 주입 (Dependency Injection)
   * =================================
   *
   * constructor의 매개변수로 필요한 서비스를 선언하면
   * NestJS가 자동으로 인스턴스를 생성해서 주입해줍니다.
   *
   * private readonly: TypeScript 축약 문법
   * - private: 클래스 내부에서만 접근 가능
   * - readonly: 값 변경 불가 (불변성)
   * - constructor 매개변수에 접근 제어자를 붙이면 자동으로 속성으로 선언됨
   *
   * 이는 다음과 같은 코드와 동일합니다:
   * private readonly appService: AppService;
   * constructor(appService: AppService) {
   *   this.appService = appService;
   * }
   */
  constructor(private readonly appService: AppService) {}

  /**
   * @Get() 데코레이터
   * - HTTP GET 요청을 처리
   * - 인자로 경로를 받을 수 있음
   *
   * @Get()       -> GET /
   * @Get('hello') -> GET /hello
   * @Get('user/:id') -> GET /user/123
   */
  @Get()
  getHello(): string {
    /**
     * Service의 메서드를 호출하여 결과를 반환
     * Controller는 라우팅만 담당하고,
     * 실제 로직은 Service에 위임합니다.
     */
    return this.appService.getHello();
  }

  /**
   * 헬스 체크 엔드포인트
   * - 서버가 정상 작동하는지 확인하는 용도
   * - 로드밸런서나 모니터링 도구에서 사용
   */
  @Get('health')
  healthCheck(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: '서버가 정상 작동 중입니다.'
    };
  }

  /**
   * API 정보 반환
   * - 사용 가능한 엔드포인트 안내
   */
  @Get('info')
  getInfo(): object {
    return {
      name: 'NestJS Learning Project - Basic',
      version: '1.0.0',
      description: 'NestJS 기초 학습을 위한 예제 프로젝트',
      endpoints: {
        posts: '/api/posts',
        users: '/api/users',
        health: '/api/health',
        info: '/api/info'
      }
    };
  }
}

/**
 * 핵심 개념 정리
 * ==============
 *
 * 1. Controller의 역할
 *    - HTTP 요청/응답 처리
 *    - 라우팅 정의
 *    - 요청 데이터 검증 (Pipe 사용)
 *    - 권한 체크 (Guard 사용)
 *
 * 2. Controller는 얇게(Thin) 유지
 *    - 비즈니스 로직은 Service로
 *    - Controller는 단순히 연결만 담당
 *
 * 3. 의존성 주입의 장점
 *    - 테스트 용이성: Mock Service 주입 가능
 *    - 결합도 낮춤: 구현이 아닌 인터페이스에 의존
 *    - 유지보수성: Service 교체가 쉬움
 */

/**
 * 다음 단계
 * =========
 *
 * 이제 posts/posts.controller.ts를 보면서
 * 더 실용적인 CRUD 컨트롤러를 학습하세요!
 *
 * 학습할 내용:
 * - @Post(), @Put(), @Delete() 데코레이터
 * - @Body(), @Param(), @Query() 데코레이터
 * - DTO (Data Transfer Object) 사용
 * - 에러 처리
 */
