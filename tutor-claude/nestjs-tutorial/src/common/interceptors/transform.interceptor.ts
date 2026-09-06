/**
 * ============================================================================
 * TransformInterceptor — 모든 성공 응답을 표준 봉투로 감싼다
 * ----------------------------------------------------------------------------
 * 컨트롤러는 순수 데이터(예: User, Post[])만 반환하게 두고,
 * "success / timestamp / path" 같은 공통 필드는 여기서 한 번에 붙입니다.
 *
 * 인터셉터 = 요청 전/후를 가로채는 AOP 도구. RxJS 파이프라인으로 응답을 변형합니다.
 *   - next.handle() 이 컨트롤러 실행 결과를 Observable 로 반환
 *   - map() 으로 그 결과를 감싼다
 *
 * @Res() 로 직접 응답을 보내는 컨트롤러에는 적용되지 않습니다(그럴 땐 인터셉터 우회).
 * ============================================================================
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

/** 특정 라우트에서 봉투 감싸기를 끄고 싶을 때 사용할 데코레이터용 키 */
export const SKIP_TRANSFORM_KEY = 'skipTransform';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data): ApiResponse<T> | T => {
        if (skip) return data;

        // 서비스가 { items, meta } 형태(페이지네이션)를 주면 meta 를 위로 올린다
        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          'meta' in data
        ) {
          const { items, meta } = data as unknown as {
            items: T;
            meta: Record<string, unknown>;
          };
          return {
            success: true,
            data: items,
            meta,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
