/**
 * ============================================
 * Timeout Interceptor - 타임아웃 인터셉터
 * ============================================
 *
 * 요청이 너무 오래 걸리면 자동으로 에러 반환
 *
 * 실무 사용 사례:
 * - 외부 API 호출이 응답 없이 대기하는 상황 방지
 * - 데이터베이스 쿼리가 오래 걸리는 경우
 * - 전체 서버 성능 보호
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * TimeoutInterceptor
 * ==================
 * 설정된 시간(기본 5초) 내에 응답이 없으면
 * 408 Request Timeout 에러 반환
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  /**
   * @param timeoutMs - 타임아웃 시간 (밀리초), 기본 5000ms
   */
  constructor(private readonly timeoutMs: number = 5000) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      /**
       * timeout() 연산자
       * - 지정된 시간 내에 값이 방출되지 않으면 TimeoutError 발생
       * - RxJS의 timeout operator
       */
      timeout(this.timeoutMs),

      /**
       * catchError() 연산자
       * - 에러를 잡아 변환
       * - TimeoutError를 NestJS 예외로 변환
       */
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException(
                `요청이 ${this.timeoutMs / 1000}초를 초과했습니다. 나중에 다시 시도해주세요.`,
              ),
          );
        }
        // 다른 에러는 그대로 전달
        return throwError(() => error);
      }),
    );
  }
}

/**
 * 사용 예시
 * =========
 *
 * 1. 전역 적용 (main.ts):
 *    app.useGlobalInterceptors(new TimeoutInterceptor(10000)); // 10초
 *
 * 2. 컨트롤러에 적용:
 *    @UseInterceptors(new TimeoutInterceptor(3000)) // 3초
 *    @Controller('posts')
 *    export class PostsController { ... }
 *
 * 3. 특정 핸들러에 적용:
 *    @UseInterceptors(new TimeoutInterceptor(30000)) // 30초 (파일 업로드 등)
 *    @Post('upload')
 *    async upload() { ... }
 *
 * 타임아웃 값 가이드:
 * - 일반 API: 5초
 * - 파일 업로드: 30-60초
 * - 리포트 생성: 120초
 * - 외부 API 호출: 10-30초
 */

/**
 * Custom Decorator와 조합 (라우트별 타임아웃)
 * ============================================
 *
 * export const Timeout = (ms: number) => SetMetadata('timeout', ms);
 *
 * @Injectable()
 * export class DynamicTimeoutInterceptor implements NestInterceptor {
 *   constructor(private reflector: Reflector) {}
 *
 *   intercept(context: ExecutionContext, next: CallHandler) {
 *     const timeoutMs = this.reflector.get<number>('timeout', context.getHandler()) ?? 5000;
 *     return next.handle().pipe(
 *       timeout(timeoutMs),
 *       catchError(err => {
 *         if (err instanceof TimeoutError)
 *           return throwError(() => new RequestTimeoutException());
 *         return throwError(() => err);
 *       })
 *     );
 *   }
 * }
 *
 * // 사용:
 * @Timeout(30000) // 이 핸들러만 30초
 * @Post('export')
 * async exportData() { ... }
 */
