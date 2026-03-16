/**
 * ============================================
 * Transform Interceptor - 응답 변환 인터셉터
 * ============================================
 *
 * API 응답을 표준화하는 인터셉터
 *
 * 문제: 각 컨트롤러가 서로 다른 형식으로 응답
 *   GET /posts  → [{ id: 1, title: '...' }]
 *   GET /users  → { data: [...], total: 10 }
 *
 * 해결: 인터셉터로 모든 응답을 동일한 형식으로 변환
 *   모든 응답 → { success: true, data: ..., timestamp: '...' }
 *
 * 이점:
 * - 프론트엔드에서 일관된 응답 처리
 * - 코드 중복 제거
 * - API 표준화
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 표준 API 응답 형식
 * ==================
 * - success: 성공 여부
 * - data: 실제 데이터
 * - timestamp: 응답 시간
 * - path: 요청 경로
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

/**
 * TransformInterceptor
 * ====================
 *
 * 제네릭 타입 T:
 * - 컨트롤러에서 반환하는 데이터의 타입
 * - 인터셉터가 이를 ApiResponse<T>로 감쌈
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      /**
       * map() 연산자
       * - 스트림의 각 값을 변환
       * - 원본 데이터(data)를 ApiResponse 형식으로 래핑
       */
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}

/**
 * 응답 형식 예시
 * ==============
 *
 * 변환 전 (컨트롤러에서 반환):
 * { id: 1, title: 'NestJS', content: '...' }
 *
 * 변환 후 (클라이언트가 받는 응답):
 * {
 *   "success": true,
 *   "data": { "id": 1, "title": "NestJS", "content": "..." },
 *   "timestamp": "2024-01-01T12:00:00.000Z",
 *   "path": "/api/posts/1"
 * }
 *
 * 배열 응답:
 * {
 *   "success": true,
 *   "data": [
 *     { "id": 1, "title": "NestJS" },
 *     { "id": 2, "title": "TypeScript" }
 *   ],
 *   "timestamp": "...",
 *   "path": "/api/posts"
 * }
 */

/**
 * 에러 응답은 ExceptionFilter에서 처리
 * =====================================
 *
 * TransformInterceptor: 성공 응답 표준화
 * HttpExceptionFilter: 에러 응답 표준화
 *
 * 에러 응답 형식 (HttpExceptionFilter에서 설정):
 * {
 *   "success": false,
 *   "error": {
 *     "code": 404,
 *     "message": "게시글을 찾을 수 없습니다"
 *   },
 *   "timestamp": "...",
 *   "path": "/api/posts/999"
 * }
 */
