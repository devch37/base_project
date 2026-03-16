/**
 * ============================================
 * Roles Guard - 역할 기반 접근 제어 가드
 * ============================================
 *
 * RBAC (Role-Based Access Control)
 * - 사용자의 역할(Role)에 따라 리소스 접근을 제어
 * - AuthGuard 이후에 실행됨 (인증 → 인가 순서)
 *
 * 동작 흐름:
 * 1. @Roles() 데코레이터로 허용 역할 지정
 * 2. 요청자의 역할과 비교
 * 3. 일치하면 접근 허용, 아니면 403 Forbidden
 *
 * 사용 예:
 * @Roles(UserRole.ADMIN)         // admin만
 * @Roles(UserRole.ADMIN, UserRole.MODERATOR) // admin 또는 moderator
 * @Delete(':id') adminDelete() { ... }
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, ROLES_KEY } from './roles.decorator';
import { AuthRequest } from '../middleware/auth.middleware';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    /**
     * 1단계: 핸들러에 지정된 역할 목록 읽기
     *
     * getAllAndOverride()
     * - 메서드 레벨 → 클래스 레벨 순서로 메타데이터 읽기
     * - 메서드에 없으면 클래스에서 찾음
     */
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [
        context.getHandler(),  // @Roles()가 붙은 메서드
        context.getClass(),    // @Roles()가 붙은 클래스
      ],
    );

    // @Roles() 데코레이터가 없으면 모든 인증된 사용자 허용
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    /**
     * 2단계: 요청 객체에서 사용자 정보 추출
     * - AuthMiddleware 또는 AuthGuard가 이미 검증한 user
     */
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('접근이 거부되었습니다.');
    }

    /**
     * 3단계: 역할 확인
     * - requiredRoles 중 하나라도 user.role과 일치하면 허용
     * - some(): 하나라도 true이면 true 반환
     */
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `이 작업을 수행하려면 [${requiredRoles.join(', ')}] 역할이 필요합니다. 현재 역할: ${user.role}`,
      );
    }

    return true;
  }
}

/**
 * Guard 여러 개 조합하기
 * ======================
 *
 * @UseGuards(AuthGuard, RolesGuard)
 * @Roles(UserRole.ADMIN)
 * @Delete(':id')
 * async adminDelete(@Param('id') id: string) { ... }
 *
 * 실행 순서:
 * 1. AuthGuard.canActivate() - 인증 확인
 * 2. RolesGuard.canActivate() - 역할 확인
 * → 모두 통과해야 핸들러 실행
 *
 * 전역 Guard 등록 (providers에서):
 * providers: [
 *   { provide: APP_GUARD, useClass: AuthGuard },
 *   { provide: APP_GUARD, useClass: RolesGuard },
 * ]
 * → 순서대로 실행됨
 */

/**
 * Permission 기반 더 세밀한 제어
 * ================================
 *
 * Role 기반은 "어떤 사람인가"에 집중하지만
 * Permission 기반은 "무엇을 할 수 있는가"에 집중합니다.
 *
 * 예시:
 * ROLES.ADMIN = ['create', 'read', 'update', 'delete']
 * ROLES.USER  = ['read', 'update_own']
 * ROLES.GUEST = ['read']
 *
 * 실제 프로젝트에서는 역할별 권한 매핑 테이블을 관리합니다.
 */
