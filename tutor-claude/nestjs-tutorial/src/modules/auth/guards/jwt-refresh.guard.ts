import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 'jwt-refresh' 전략을 실행하는 가드.
 * @Public() 을 통해 전역 JwtAuthGuard 를 우회한 뒤, 이 가드로 리프레시 토큰만 검증합니다.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
