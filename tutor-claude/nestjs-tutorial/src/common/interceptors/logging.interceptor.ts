/**
 * ============================================================================
 * LoggingInterceptor — 요청/응답 1줄 로깅 + 처리 시간 측정
 * ----------------------------------------------------------------------------
 * "GET /api/posts 200 +23ms" 같은 액세스 로그를 남깁니다.
 * 실무에서는 요청 상관관계 ID(correlation id), 사용자 ID 등을 함께 남깁니다.
 * ============================================================================
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl } = req;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - startedAt;
          this.logger.log(
            `${method} ${originalUrl} ${res.statusCode} +${ms}ms`,
          );
        },
        error: (err: { status?: number }) => {
          const ms = Date.now() - startedAt;
          this.logger.warn(
            `${method} ${originalUrl} ${err.status ?? 500} +${ms}ms (에러)`,
          );
        },
      }),
    );
  }
}
