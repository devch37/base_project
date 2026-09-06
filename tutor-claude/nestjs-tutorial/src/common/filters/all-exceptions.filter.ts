/**
 * ============================================================================
 * AllExceptionsFilter — 전역 예외 필터
 * ----------------------------------------------------------------------------
 * 앱 어디서든 던져진 예외를 "하나의 표준 에러 응답 형태"로 변환합니다.
 *   - HttpException (NestJS 표준: NotFoundException 등) → status/message 그대로 사용
 *   - QueryFailedError (TypeORM: unique 제약 위반 등) → 409/400 로 매핑
 *   - 그 외 알 수 없는 에러 → 500 (상세 내용은 로그에만, 클라이언트엔 숨김)
 *
 * @Catch() 를 인자 없이 쓰면 "모든 예외"를 잡습니다.
 * ============================================================================
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, error, message } = this.normalize(exception);

    // 5xx 는 스택까지, 4xx 는 한 줄만 로깅 (로그 노이즈 줄이기)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${status} ${JSON.stringify(message)}`,
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    response.status(status).json(body);
  }

  private normalize(exception: unknown): {
    status: number;
    error: string;
    message: string | string[];
  } {
    // 1) NestJS 표준 예외
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { status, error: exception.name, message: res };
      }
      const r = res as { message?: string | string[]; error?: string };
      return {
        status,
        error: r.error ?? exception.name,
        message: r.message ?? exception.message,
      };
    }

    // 2) TypeORM 쿼리 실패 (예: UNIQUE 제약 위반)
    if (exception instanceof QueryFailedError) {
      const driverMsg = (exception as QueryFailedError & { message: string })
        .message;
      const isUnique = /UNIQUE constraint failed/i.test(driverMsg);
      return {
        status: isUnique ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST,
        error: isUnique ? 'Conflict' : 'Bad Request',
        message: isUnique
          ? '이미 존재하는 값입니다. (고유 제약 위반)'
          : '잘못된 데이터베이스 요청입니다.',
      };
    }

    // 3) 알 수 없는 에러 → 내부 사정은 감춘다
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: '서버 내부 오류가 발생했습니다.',
    };
  }
}
