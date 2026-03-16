/**
 * ============================================
 * All Exceptions Filter - 전체 예외 처리 필터
 * ============================================
 *
 * HttpExceptionFilter와 차이:
 * - HttpExceptionFilter: HttpException 타입만 처리
 * - AllExceptionsFilter: 모든 예외 처리 (예상치 못한 에러 포함)
 *
 * @Catch() - 인자 없음 → 모든 예외 캐치
 *
 * 실무에서의 역할:
 * - 예상치 못한 500 에러를 친절한 메시지로 변환
 * - 내부 에러 세부 정보를 클라이언트에 노출하지 않음
 * - 모든 에러를 로깅
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * @Catch() - 인자 없으면 모든 예외를 잡음
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    /**
     * 예외 유형에 따라 상태 코드와 메시지 결정
     */
    let statusCode: number;
    let message: string;

    if (exception instanceof HttpException) {
      // NestJS HTTP 예외 (NotFoundException, BadRequestException 등)
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = (exceptionResponse as any).message || exception.message;
      }
    } else if (exception instanceof TypeError) {
      // JavaScript 타입 에러 (undefined 접근 등)
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '서버 내부 오류가 발생했습니다';
      this.logger.error('TypeError 발생', (exception as Error).stack);
    } else if (exception instanceof Error) {
      // 일반 JavaScript 에러
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '예상치 못한 오류가 발생했습니다';
      this.logger.error('Unexpected Error', (exception as Error).stack);
    } else {
      // 알 수 없는 예외
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '알 수 없는 오류가 발생했습니다';
      this.logger.error('Unknown exception', JSON.stringify(exception));
    }

    // 개발 환경에서는 상세 정보 포함
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const errorDetail = isDevelopment && exception instanceof Error
      ? { stack: exception.stack }
      : {};

    const errorResponse = {
      success: false,
      error: {
        statusCode,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        ...errorDetail,
      },
    };

    // 500 에러는 error 레벨로 로깅
    if (statusCode >= 500) {
      this.logger.error(
        `[${statusCode}] ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(`[${statusCode}] ${request.method} ${request.url} - ${message}`);
    }

    response.status(statusCode).json(errorResponse);
  }
}

/**
 * HttpExceptionFilter vs AllExceptionsFilter 조합 방법
 * ====================================================
 *
 * main.ts에서 두 필터를 함께 등록:
 *
 * app.useGlobalFilters(
 *   new AllExceptionsFilter(),  // 모든 예외 처리 (마지막 안전망)
 *   new HttpExceptionFilter(),  // HTTP 예외 우선 처리
 * );
 *
 * 또는 providers에서:
 * providers: [
 *   { provide: APP_FILTER, useClass: AllExceptionsFilter },
 *   { provide: APP_FILTER, useClass: HttpExceptionFilter }, // 나중에 등록한 게 먼저 실행
 * ]
 *
 * 주의: 마지막에 등록된 필터가 먼저 실행됨!
 */

/**
 * 커스텀 예외 클래스 만들기
 * =========================
 *
 * // 비즈니스 예외
 * export class InsufficientFundsException extends BadRequestException {
 *   constructor(required: number, available: number) {
 *     super({
 *       code: 'INSUFFICIENT_FUNDS',
 *       message: `잔액이 부족합니다. 필요: ${required}원, 보유: ${available}원`,
 *     });
 *   }
 * }
 *
 * // 도메인 예외
 * export class PostAlreadyPublishedException extends ConflictException {
 *   constructor(postId: number) {
 *     super(`게시글 ${postId}는 이미 공개되어 있습니다`);
 *   }
 * }
 */
