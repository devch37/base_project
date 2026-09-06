/**
 * ============================================================================
 * @CurrentUser() — 요청 객체(request.user)에서 인증된 사용자를 꺼내 주는 데코레이터
 * ----------------------------------------------------------------------------
 * Passport 전략이 검증에 성공하면 반환값을 request.user 에 넣어 줍니다.
 * 컨트롤러에서 `@Req() req` 를 받아 `req.user` 를 파헤치는 대신,
 * `@CurrentUser() user: AuthUser` 로 깔끔하게 받습니다.
 *
 * 사용 예:
 *   @Get('me')
 *   getMe(@CurrentUser() user: AuthUser) { ... }
 *   @Get('my-id')
 *   getId(@CurrentUser('id') userId: number) { ... }   // 특정 필드만
 * ============================================================================
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Role } from '../enums/role.enum';

/** JWT 전략이 request.user 에 넣어 주는 값의 형태 */
export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | AuthUser[keyof AuthUser] => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    const user = request.user;
    // data 가 주어지면 해당 필드만, 아니면 전체 객체 반환
    return data ? user?.[data] : user;
  },
);
