/**
 * ============================================================================
 * JwtStrategy — 액세스 토큰 검증 전략 ('jwt')
 * ----------------------------------------------------------------------------
 * Passport 전략은 "요청에서 자격증명을 추출 → 검증 → 사용자 반환" 을 담당합니다.
 *
 *  1) jwtFromRequest: Authorization: Bearer <token> 헤더에서 토큰 추출
 *  2) passport-jwt 가 secret 으로 서명/만료 검증
 *  3) validate(payload): 검증 통과 시 호출 — 반환값이 request.user 에 담김
 *
 * PassportStrategy(Strategy, 'jwt') 의 두 번째 인자가 전략 이름입니다.
 * AuthGuard('jwt') 가 이 이름으로 전략을 찾습니다.
 * ============================================================================
 */
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../../config/configuration';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessSecret,
    });
  }

  /**
   * 여기서 DB 를 다시 조회할지는 트레이드오프입니다.
   *  - 조회 X: 빠르지만, 토큰 발급 후 권한이 바뀌어도 만료 전까지 반영 안 됨
   *  - 조회 O: 항상 최신 상태지만 매 요청 DB 부하
   * 학습용으로는 payload 를 신뢰하고 그대로 사용합니다.
   */
  validate(payload: AccessTokenPayload): AuthUser {
    if (!payload?.sub) {
      throw new UnauthorizedException('잘못된 토큰입니다.');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
