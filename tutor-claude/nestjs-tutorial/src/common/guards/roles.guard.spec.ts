/**
 * roles.guard.spec.ts — 가드 단위 테스트 (Nest 컨테이너 없이 순수하게)
 * ----------------------------------------------------------------------------
 * ExecutionContext 와 Reflector 를 최소한으로 흉내 내서 분기만 검증합니다.
 */
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { RolesGuard } from './roles.guard';

function mockContext(user: unknown) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}

describe('RolesGuard', () => {
  it('@Roles 메타데이터가 없으면 통과시킨다', () => {
    const reflector = {
      getAllAndOverride: () => undefined,
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(mockContext({ role: Role.USER }))).toBe(true);
  });

  it('필요한 역할을 가진 사용자는 통과한다', () => {
    const reflector = {
      getAllAndOverride: () => [Role.ADMIN],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(mockContext({ role: Role.ADMIN }))).toBe(true);
  });

  it('역할이 부족하면 ForbiddenException', () => {
    const reflector = {
      getAllAndOverride: () => [Role.ADMIN],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(mockContext({ role: Role.USER }))).toThrow(
      ForbiddenException,
    );
  });
});
