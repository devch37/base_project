/**
 * ============================================================================
 * JwtAuthGuard — 전역 인증 가드
 * ----------------------------------------------------------------------------
 * AuthGuard('jwt') 를 상속하되, @Public() 이 달린 라우트는 통과시킵니다.
 * app.module 에서 APP_GUARD 로 등록하면 "기본 전부 인증 필요" 정책이 됩니다.
 *
 * 동작 순서:
 *   1) canActivate 에서 @Public 메타데이터 확인 → 있으면 즉시 true
 *   2) 아니면 부모(AuthGuard)가 'jwt' 전략(JwtStrategy)을 실행
 *   3) 전략의 validate() 반환값이 request.user 에 담김
 * ============================================================================
 */
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 핸들러(메서드) 또는 컨트롤러(클래스) 어느 쪽에 붙어도 인식
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  /**
   * 전략 실행 결과를 후처리. err 가 있거나 user 가 없으면 401.
   * (Passport 는 실패 시 err 에 Error 를, 성공 시 user 에 전략 validate() 반환값을 넘김)
   */
  handleRequest<TUser = any>(err: Error | null, user: TUser | false): TUser {
    if (err) throw err;
    if (!user) {
      throw new UnauthorizedException('유효한 인증 토큰이 필요합니다.');
    }
    return user;
  }
}
