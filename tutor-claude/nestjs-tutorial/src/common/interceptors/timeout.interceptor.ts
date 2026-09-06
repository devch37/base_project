/**
 * ============================================================================
 * TimeoutInterceptor — 너무 오래 걸리는 요청을 강제 종료
 * ----------------------------------------------------------------------------
 * 외부 API/DB 가 응답하지 않을 때 요청이 무한정 매달리는 것을 막습니다.
 * RxJS 의 timeout() 연산자를 사용합니다.
 * ============================================================================
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

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly ms: number = 10_000) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.ms),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException('요청 처리 시간이 초과되었습니다.'),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
