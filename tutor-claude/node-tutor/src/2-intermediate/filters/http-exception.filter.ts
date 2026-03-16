/**
 * ============================================
 * HTTP Exception Filter - HTTP 예외 필터
 * ============================================
 *
 * Exception Filter (예외 필터)란?
 * - 컨트롤러나 서비스에서 던진 예외를 잡아서 처리
 * - 표준화된 에러 응답 반환
 * - 에러 로깅
 *
 * 처리되지 않은 예외 흐름:
 * Service throws NotFoundException
 *   → ExceptionFilter catches it
 *   → 표준 에러 형식으로 응답
 *
 * NestJS 기본 동작:
 * - HttpException은 자동으로 처리됨
 * - 이 필터로 응답 형식을 커스터마이징
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
 * @Catch(HttpException)
 * - 이 필터가 처리할 예외 타입 지정
 * - HttpException과 그 하위 클래스 모두 처리
 * - NotFoundException, BadRequestException, UnauthorizedException 등
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  /**
   * catch()
   * =======
   * @param exception - 던져진 예외 객체
   * @param host - ArgumentsHost (HTTP 컨텍스트 접근)
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    /**
     * ArgumentsHost
     * - HTTP, WebSocket, RPC 등 다양한 컨텍스트 지원
     * - switchToHttp()로 HTTP 컨텍스트 접근
     */
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    /**
     * 예외 응답에서 메시지 추출
     * - string인 경우: 메시지 자체
     * - object인 경우: message 필드 추출
     */
    let message: string | string[];
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as any;
      message = resObj.message || resObj.error || '오류가 발생했습니다';
    } else {
      message = '오류가 발생했습니다';
    }

    // 표준화된 에러 응답 형식
    const errorResponse = {
      success: false,
      error: {
        statusCode,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    // 에러 로깅
    if (statusCode >= 500) {
      this.logger.error(
        `[${statusCode}] ${request.method} ${request.url} - ${JSON.stringify(message)}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `[${statusCode}] ${request.method} ${request.url} - ${JSON.stringify(message)}`,
      );
    }

    // 응답 전송
    response.status(statusCode).json(errorResponse);
  }
}

/**
 * NestJS 내장 HTTP 예외 목록
 * ===========================
 *
 * throw new BadRequestException('잘못된 요청');     // 400
 * throw new UnauthorizedException('인증 필요');      // 401
 * throw new ForbiddenException('권한 없음');         // 403
 * throw new NotFoundException('리소스 없음');        // 404
 * throw new ConflictException('이미 존재함');        // 409
 * throw new UnprocessableEntityException('처리 불가'); // 422
 * throw new InternalServerErrorException('서버 오류'); // 500
 *
 * 커스텀 예외 만들기:
 * export class PostNotFoundException extends NotFoundException {
 *   constructor(postId: number) {
 *     super(`ID ${postId}번 게시글을 찾을 수 없습니다`);
 *   }
 * }
 */

/**
 * 예외 필터 등록 방법
 * ===================
 *
 * 1. 전역 등록 (main.ts):
 *    app.useGlobalFilters(new HttpExceptionFilter());
 *
 * 2. 모듈 providers에 등록:
 *    providers: [
 *      { provide: APP_FILTER, useClass: HttpExceptionFilter }
 *    ]
 *
 * 3. 컨트롤러 데코레이터:
 *    @UseFilters(HttpExceptionFilter)
 *    @Controller('posts')
 *    export class PostsController { ... }
 *
 * 4. 핸들러 데코레이터:
 *    @UseFilters(HttpExceptionFilter)
 *    @Get(':id')
 *    findOne() { ... }
 */
