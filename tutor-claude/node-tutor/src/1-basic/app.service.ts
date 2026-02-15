/**
 * ============================================
 * App Service - 비즈니스 로직 처리
 * ============================================
 *
 * Service는 실제 작업을 수행하는 클래스입니다.
 * - 비즈니스 로직 구현
 * - 데이터베이스 접근
 * - 외부 API 호출
 * - 데이터 가공 및 변환
 *
 * Controller와 Service를 분리하는 이유:
 * 1. 관심사의 분리 (Separation of Concerns)
 *    - Controller: 요청/응답 처리
 *    - Service: 비즈니스 로직
 * 2. 재사용성: 같은 Service를 여러 Controller에서 사용 가능
 * 3. 테스트 용이성: Service만 독립적으로 테스트 가능
 */

import { Injectable } from '@nestjs/common';

/**
 * @Injectable() 데코레이터
 * ========================
 *
 * 이 클래스가 의존성 주입이 가능한 Provider임을 선언합니다.
 *
 * Provider란?
 * - NestJS의 의존성 주입 시스템에서 관리되는 클래스
 * - @Injectable() 데코레이터가 붙은 클래스
 * - 다른 클래스의 constructor에 주입될 수 있음
 *
 * Provider의 종류:
 * - Service: 비즈니스 로직 (가장 흔함)
 * - Repository: 데이터 접근
 * - Factory: 복잡한 객체 생성
 * - Helper: 유틸리티 함수
 */
@Injectable()
export class AppService {
  /**
   * 간단한 환영 메시지 반환
   *
   * 실제 애플리케이션에서는:
   * - 데이터베이스 조회
   * - 복잡한 계산
   * - 외부 API 호출
   * 등의 작업을 여기서 수행합니다.
   */
  getHello(): string {
    return 'NestJS Basic Learning Project에 오신 것을 환영합니다! 🎉';
  }

  /**
   * 서버 정보 조회
   * - 실제로는 환경설정이나 데이터베이스에서 가져올 수 있음
   */
  getServerInfo(): object {
    return {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    };
  }
}

/**
 * Service 작성 가이드
 * ===================
 *
 * 1. 단일 책임 원칙 (Single Responsibility Principle)
 *    - 하나의 Service는 하나의 책임만 가져야 함
 *    - 예: UserService는 사용자 관련 작업만 담당
 *
 * 2. 메서드는 작고 명확하게
 *    - 한 메서드는 하나의 작업만 수행
 *    - 메서드 이름으로 기능을 명확히 표현
 *
 * 3. 비즈니스 로직은 Service에
 *    - Controller에 if문이나 복잡한 로직은 금물
 *    - 모든 로직은 Service로 이동
 *
 * 4. 에러 처리
 *    - 적절한 예외를 던져서 Controller나 Filter가 처리하도록
 *    - try-catch로 예외를 잡아 로깅
 */

/**
 * 실전 예제: 더 복잡한 Service
 * ============================
 */

@Injectable()
export class ExampleService {
  // 이 Service만의 상태 (보통 데이터베이스 대신 사용)
  private cache: Map<string, any> = new Map();

  /**
   * 데이터 조회 (캐시 활용)
   */
  async findData(key: string): Promise<any> {
    // 캐시에서 먼저 찾기
    if (this.cache.has(key)) {
      console.log('✅ 캐시 히트:', key);
      return this.cache.get(key);
    }

    // 캐시에 없으면 "데이터베이스"에서 조회 (시뮬레이션)
    console.log('🔍 데이터베이스 조회:', key);
    const data = await this.fetchFromDatabase(key);

    // 캐시에 저장
    this.cache.set(key, data);

    return data;
  }

  /**
   * 데이터베이스 조회 시뮬레이션
   * - 실제로는 TypeORM, Prisma 등을 사용
   */
  private async fetchFromDatabase(key: string): Promise<any> {
    // 비동기 작업 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: key,
          data: `Data for ${key}`,
          timestamp: new Date()
        });
      }, 100);
    });
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️  캐시 초기화됨');
  }

  /**
   * 여러 Service 간 협력
   * - 다른 Service를 주입받아 사용
   */
  // constructor(
  //   private readonly userService: UserService,
  //   private readonly postService: PostService
  // ) {}
  //
  // async getUserWithPosts(userId: number) {
  //   const user = await this.userService.findOne(userId);
  //   const posts = await this.postService.findByUserId(userId);
  //   return { user, posts };
  // }
}

/**
 * 다음 단계
 * =========
 *
 * posts/posts.service.ts를 보면서
 * 실제 CRUD 작업을 수행하는 Service를 학습하세요!
 *
 * 학습할 내용:
 * - 데이터 생성, 조회, 수정, 삭제 (CRUD)
 * - 에러 처리 (NotFoundException 등)
 * - 비동기 작업 (async/await)
 * - 데이터 검증
 */
