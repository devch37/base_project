/**
 * ============================================
 * Logging Interceptor - 로깅 인터셉터
 * ============================================
 *
 * Interceptor (인터셉터)란?
 * - AOP (Aspect-Oriented Programming) 패턴 구현
 * - 컨트롤러 핸들러 실행 전/후에 추가 로직 삽입
 * - RxJS Observable 스트림을 활용
 *
 * 주요 기능:
 * 1. 메서드 실행 전/후 로직 추가
 * 2. 반환값 변환 (transform)
 * 3. 예외 변환
 * 4. 기능 확장 (캐싱, 타임아웃 등)
 *
 * 요청 흐름에서 위치:
 * Middleware → Guard → Interceptor(before) → Pipe → Controller → Interceptor(after)
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * LoggingInterceptor
 * ==================
 * 각 요청의 실행 시간을 측정하고 로깅
 *
 * NestInterceptor 인터페이스:
 * - intercept(context, next): Observable<any> 구현 필수
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('LoggingInterceptor');

  /**
   * intercept()
   * ===========
   * @param context - ExecutionContext (현재 실행 컨텍스트)
   * @param next - CallHandler (다음 핸들러 실행)
   * @returns Observable<any>
   *
   * RxJS 파이프라인:
   * - next.handle(): 컨트롤러 핸들러 실행 → Observable 반환
   * - tap(): 사이드이펙트 실행 (원본 값 변경 없음)
   * - map(): 반환값 변환
   * - catchError(): 에러 처리
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    const startTime = Date.now();

    this.logger.log(`[시작] ${className}.${handlerName}() - ${method} ${url}`);

    return next
      .handle()  // 컨트롤러 핸들러 실행
      .pipe(
        /**
         * tap(next, error, complete)
         * - next: 성공 시 실행 (원본 데이터 변경 없음)
         * - error: 에러 시 실행
         * - 스트림을 변환하지 않고 사이드이펙트만 실행
         */
        tap({
          next: (data) => {
            const responseTime = Date.now() - startTime;
            this.logger.log(
              `[완료] ${className}.${handlerName}() - ${responseTime}ms - 데이터: ${JSON.stringify(data)?.substring(0, 100)}...`,
            );
          },
          error: (error) => {
            const responseTime = Date.now() - startTime;
            this.logger.error(
              `[에러] ${className}.${handlerName}() - ${responseTime}ms - ${error.message}`,
            );
          },
        }),
      );
  }
}

/**
 * RxJS 기본 개념
 * ==============
 *
 * Observable: 시간에 따라 값을 방출하는 스트림
 * - 동기/비동기 모두 처리 가능
 * - next: 다음 값
 * - error: 에러 발생
 * - complete: 완료
 *
 * 주요 연산자:
 * - tap():       사이드이펙트 (값 변경 없음)
 * - map():       값 변환
 * - catchError(): 에러 처리
 * - timeout():   타임아웃 설정
 * - switchMap():  새 Observable로 전환
 *
 * 예시:
 * return next.handle().pipe(
 *   map(data => ({ success: true, data })),    // 응답 래핑
 *   catchError(err => throwError(() => err)),  // 에러 재던지기
 *   timeout(5000),                             // 5초 타임아웃
 * );
 */
