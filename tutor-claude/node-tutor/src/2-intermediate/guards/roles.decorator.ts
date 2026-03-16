/**
 * ============================================
 * Roles Decorator - 역할 기반 데코레이터
 * ============================================
 *
 * Custom Decorator (커스텀 데코레이터)란?
 * - NestJS에서 직접 만드는 데코레이터
 * - 메타데이터를 컨트롤러나 핸들러에 붙여두는 역할
 * - Guard에서 이 메타데이터를 읽어 접근 제어
 *
 * 사용 예:
 * @Roles('admin')                   // admin만 접근
 * @Roles('admin', 'moderator')      // admin 또는 moderator 접근
 * @Get('admin')
 * adminOnly() { ... }
 */

import { SetMetadata } from '@nestjs/common';

/**
 * 역할 상수 정의
 * ==============
 * 문자열 대신 상수를 사용하면 오타 방지
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

/**
 * ROLES_KEY
 * - 메타데이터를 저장할 키 (유니크한 문자열)
 * - Guard에서 Reflector로 이 키를 통해 메타데이터 읽기
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles() 데코레이터
 * ==================
 *
 * SetMetadata(key, value):
 * - 클래스나 메서드에 메타데이터를 저장
 * - Guard의 Reflector를 통해 나중에 읽을 수 있음
 *
 * @param roles - 허용할 역할 목록 (variadic parameter)
 *
 * 사용 예:
 * @Roles(UserRole.ADMIN)
 * @Roles(UserRole.ADMIN, UserRole.MODERATOR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Public 데코레이터
 * ================
 * - 인증이 필요 없는 엔드포인트를 표시
 * - Guard에서 이 메타데이터를 확인해 인증 스킵
 *
 * 사용 예:
 * @Public()
 * @Get('health')
 * healthCheck() { return 'ok'; }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * 커스텀 데코레이터 패턴 정리
 * ===========================
 *
 * 1. SetMetadata 기반 (이 파일):
 *    Guard에서 읽어 로직 처리
 *
 * 2. createParamDecorator 기반:
 *    Controller 파라미터에서 값 추출
 *
 *    import { createParamDecorator, ExecutionContext } from '@nestjs/common';
 *
 *    export const CurrentUser = createParamDecorator(
 *      (data: string, ctx: ExecutionContext) => {
 *        const request = ctx.switchToHttp().getRequest();
 *        const user = request.user;
 *        return data ? user?.[data] : user;
 *      },
 *    );
 *
 *    // 사용:
 *    @Get('profile')
 *    getProfile(@CurrentUser() user: User) { ... }
 *    @Get('profile')
 *    getProfile(@CurrentUser('email') email: string) { ... }
 */
