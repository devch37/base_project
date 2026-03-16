/**
 * ============================================
 * Auth Middleware - 인증 미들웨어
 * ============================================
 *
 * 이 미들웨어는 요청 헤더에서 토큰을 추출하고
 * request 객체에 사용자 정보를 추가합니다.
 *
 * Guard vs Middleware 차이:
 * - Middleware: 토큰 파싱, request 객체에 정보 추가
 * - Guard: canActivate()로 최종 접근 허용/거부 결정
 *
 * 실무에서는:
 * - Middleware: 토큰 디코딩 + request에 user 정보 삽입
 * - Guard: user 정보 확인 + 권한 체크
 */

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';

/**
 * Request 타입 확장
 * - Express의 Request에 user 속성 추가
 * - TypeScript에서 타입 안정성 확보
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  use(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // 토큰이 없어도 일단 통과 (Guard에서 최종 결정)
      return next();
    }

    /**
     * Bearer 토큰 형식: "Bearer <token>"
     * - split(' ')[1]로 토큰 부분만 추출
     */
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return next();
    }

    try {
      // 토큰 검증 및 페이로드 추출
      const payload = this.authService.verifyToken(token);

      // request 객체에 사용자 정보 추가
      // Guard와 Controller에서 req.user로 접근 가능
      req.user = payload;
    } catch {
      // 잘못된 토큰은 무시 (Guard에서 처리)
    }

    next();
  }
}

/**
 * 전역 미들웨어 vs 모듈 미들웨어
 * ================================
 *
 * 1. 모듈에서 적용 (app.module.ts):
 *    export class AppModule implements NestModule {
 *      configure(consumer: MiddlewareConsumer) {
 *        consumer
 *          .apply(AuthMiddleware)
 *          .forRoutes('*');  // 모든 라우트에 적용
 *      }
 *    }
 *
 * 2. 특정 라우트에만 적용:
 *    consumer
 *      .apply(AuthMiddleware)
 *      .forRoutes({ path: 'posts', method: RequestMethod.ALL });
 *
 * 3. 특정 컨트롤러에 적용:
 *    consumer
 *      .apply(AuthMiddleware)
 *      .forRoutes(PostsController);
 */
