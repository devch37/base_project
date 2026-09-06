/**
 * @Roles(Role.ADMIN) — 이 라우트에 필요한 역할을 지정.
 * RolesGuard 가 이 메타데이터를 읽어 현재 사용자의 role 과 비교합니다.
 */
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
