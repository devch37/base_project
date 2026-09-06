/**
 * ============================================================================
 * RolesGuard — 인가(authorization) 가드
 * ----------------------------------------------------------------------------
 * @Roles(Role.ADMIN) 이 붙은 라우트에서, request.user.role 을 확인합니다.
 * JwtAuthGuard 다음에 실행되어야 하므로 app.module 의 APP_GUARD 등록 순서가 중요합니다.
 * (APP_GUARD 는 배열에 등록된 순서대로 실행됨)
 * ============================================================================
 */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // @Roles 가 없는 라우트 → 역할 제한 없음(통과)
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role: Role } }>();
    if (!user) {
      throw new ForbiddenException(
        '인증 정보가 없어 권한을 확인할 수 없습니다.',
      );
    }

    const allowed = requiredRoles.includes(user.role);
    if (!allowed) {
      throw new ForbiddenException(
        `이 작업에는 [${requiredRoles.join(', ')}] 권한이 필요합니다.`,
      );
    }
    return true;
  }
}
