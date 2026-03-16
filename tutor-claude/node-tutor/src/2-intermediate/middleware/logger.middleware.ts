/**
 * ============================================
 * Logger Middleware - 요청 로깅 미들웨어
 * ============================================
 *
 * Middleware란?
 * - 요청(Request)과 응답(Response) 사이에서 실행되는 함수
 * - Express의 미들웨어와 동일한 개념
 * - 요청이 컨트롤러에 도달하기 전에 실행됨
 *
 * 주요 사용 사례:
 * 1. 요청 로깅
 * 2. 인증 토큰 검증 (Guard 이전)
 * 3. 요청 데이터 변환
 * 4. CORS 처리
 * 5. Rate Limiting
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LoggerMiddleware
 * ================
 * NestMiddleware 인터페이스를 구현하는 클래스형 미들웨어
 *
 * 클래스형 vs 함수형 미들웨어:
 * - 클래스형: @Injectable() 사용 가능, 의존성 주입 가능
 * - 함수형: 더 간단하지만 DI 불가
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  /**
   * NestJS 내장 Logger
   * - console.log 대신 구조화된 로깅 제공
   * - 'LoggerMiddleware'는 로그의 컨텍스트(출처) 표시
   */
  private readonly logger = new Logger('LoggerMiddleware');

  /**
   * use() 메서드
   * - NestMiddleware 인터페이스의 필수 구현 메서드
   * - Express 미들웨어와 동일한 시그니처
   *
   * @param req - HTTP 요청 객체
   * @param res - HTTP 응답 객체
   * @param next - 다음 미들웨어 또는 컨트롤러로 제어 이전
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '알 수 없음';
    const startTime = Date.now();

    // 요청 시작 로그
    this.logger.log(`[요청 시작] ${method} ${originalUrl} - IP: ${ip}`);

    /**
     * res.on('finish')
     * - 응답이 완료된 후 실행되는 이벤트 핸들러
     * - 응답 시간 계산에 사용
     */
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const responseTime = Date.now() - startTime;

      // 상태 코드에 따라 다른 로그 레벨 사용
      const logMessage = `[응답 완료] ${method} ${originalUrl} ${statusCode} - ${responseTime}ms - ${contentLength}bytes - ${userAgent}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    /**
     * next() 호출
     * - 반드시 호출해야 다음 단계로 진행됨
     * - 호출하지 않으면 요청이 멈춤
     */
    next();
  }
}

/**
 * 함수형 미들웨어 예제 (비교용)
 * ==============================
 *
 * export function simpleLoggerMiddleware(
 *   req: Request,
 *   res: Response,
 *   next: NextFunction
 * ): void {
 *   console.log(`${req.method} ${req.url}`);
 *   next();
 * }
 *
 * 차이점:
 * - 클래스형: @Injectable(), 의존성 주입 가능
 * - 함수형: 더 간단하지만 서비스 주입 불가
 */

/**
 * 미들웨어 적용 순서 (app.module.ts 참고)
 * =========================================
 *
 * 요청 흐름:
 * Client Request
 *   → Middleware (LoggerMiddleware)
 *   → Guards (AuthGuard, RolesGuard)
 *   → Interceptors (before)
 *   → Pipes (ValidationPipe)
 *   → Controller Handler
 *   → Interceptors (after)
 *   → Exception Filters (에러 발생 시)
 *   → Response
 */
