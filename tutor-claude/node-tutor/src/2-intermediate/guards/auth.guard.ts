/**
 * ============================================
 * Auth Guard - 인증 가드
 * ============================================
 *
 * Guard란?
 * - 특정 조건에 따라 라우트 핸들러 실행을 허용/거부
 * - canActivate() 메서드가 true를 반환하면 진행
 * - false를 반환하면 403 Forbidden 응답
 *
 * Middleware vs Guard:
 * - Middleware: 라우트 정보를 모름 (어떤 컨트롤러인지)
 * - Guard: ExecutionContext로 라우트 정보 접근 가능
 *
 * 요청 흐름에서 위치:
 * Middleware → Guard → Interceptor → Pipe → Controller
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './roles.decorator';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * AuthGuard
 * =========
 * JWT 토큰 인증을 처리하는 가드
 *
 * 동작 방식:
 * 1. @Public() 데코레이터가 있으면 → 통과
 * 2. req.user가 있으면 (미들웨어가 토큰 검증 완료) → 통과
 * 3. 그 외 → UnauthorizedException
 */
@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Reflector
   * - 메타데이터를 읽는 도구
   * - @Public(), @Roles() 같은 데코레이터의 값을 읽음
   */
  constructor(private reflector: Reflector) {}

  /**
   * canActivate()
   * =============
   * @param context - 현재 실행 컨텍스트
   * @returns true → 접근 허용 / false → 403 Forbidden
   *
   * ExecutionContext를 통해:
   * - HTTP 요청/응답 객체 접근
   * - 현재 핸들러와 클래스 정보 접근
   * - 메타데이터 접근
   */
  canActivate(context: ExecutionContext): boolean {
    /**
     * 1단계: @Public() 체크
     * - 클래스 또는 메서드에 @Public()이 붙어있으면 인증 스킵
     * - getAllAndOverride: 메서드 → 클래스 순서로 메타데이터 읽기
     */
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),  // 메서드 레벨 확인
      context.getClass(),    // 클래스 레벨 확인
    ]);

    if (isPublic) {
      return true;  // 공개 라우트는 통과
    }

    /**
     * 2단계: 요청 객체에서 user 확인
     * - AuthMiddleware가 토큰을 검증하고 req.user를 설정
     * - req.user가 없으면 인증 실패
     */
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    if (!user) {
      /**
       * UnauthorizedException
       * - 401 Unauthorized 상태 코드로 응답
       * - 인증이 필요한 리소스에 미인증 접근 시 사용
       * - 403 Forbidden: 인증은 됐지만 권한 없음
       */
      throw new UnauthorizedException('인증이 필요합니다. 로그인 후 토큰을 헤더에 포함하세요.');
    }

    return true;  // 인증 성공
  }
}

/**
 * Guard 등록 방법
 * ===============
 *
 * 1. 전역 등록 (main.ts):
 *    app.useGlobalGuards(new AuthGuard(new Reflector()));
 *    → 모든 라우트에 적용
 *
 * 2. 모듈 등록:
 *    providers: [{ provide: APP_GUARD, useClass: AuthGuard }]
 *    → 전역으로 등록되지만 DI 가능
 *
 * 3. 컨트롤러에 직접:
 *    @UseGuards(AuthGuard)
 *    @Controller('posts')
 *    → 해당 컨트롤러의 모든 핸들러에 적용
 *
 * 4. 특정 핸들러에:
 *    @UseGuards(AuthGuard)
 *    @Get('private')
 *    → 해당 핸들러에만 적용
 */

/**
 * 실전 JWT 가드 구현 (참고)
 * =========================
 *
 * import { JwtService } from '@nestjs/jwt';
 *
 * @Injectable()
 * export class JwtAuthGuard implements CanActivate {
 *   constructor(
 *     private jwtService: JwtService,
 *     private reflector: Reflector,
 *   ) {}
 *
 *   canActivate(context: ExecutionContext): boolean {
 *     const isPublic = this.reflector.getAllAndOverride<boolean>(
 *       IS_PUBLIC_KEY,
 *       [context.getHandler(), context.getClass()]
 *     );
 *     if (isPublic) return true;
 *
 *     const request = context.switchToHttp().getRequest();
 *     const token = this.extractTokenFromHeader(request);
 *     if (!token) throw new UnauthorizedException();
 *
 *     try {
 *       const payload = this.jwtService.verifyAsync(token, { secret: 'JWT_SECRET' });
 *       request.user = payload;
 *     } catch {
 *       throw new UnauthorizedException();
 *     }
 *     return true;
 *   }
 *
 *   private extractTokenFromHeader(request: Request): string | undefined {
 *     const [type, token] = request.headers.authorization?.split(' ') ?? [];
 *     return type === 'Bearer' ? token : undefined;
 *   }
 * }
 */
