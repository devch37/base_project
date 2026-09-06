/**
 * ============================================================================
 * JwtRefreshStrategy — 리프레시 토큰 검증 전략 ('jwt-refresh')
 * ----------------------------------------------------------------------------
 * 액세스 토큰과 다른 점:
 *  1) 별도의 시크릿(refreshSecret) 사용
 *  2) passReqToCallback: true → validate 에서 원본 요청(req)에 접근
 *     → 요청 본문의 refreshToken 을 꺼내 "DB에 저장된 해시와 일치하는지" 확인
 *  3) 이렇게 하면 "DB에서 해시를 지우면(=로그아웃) 리프레시 불가" 가 됩니다 (토큰 무효화)
 * ============================================================================
 */
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../../config/configuration';
import { HashingService } from '../../../common/hashing/hashing.service';
import { Role } from '../../../common/enums/role.enum';
import { UsersService } from '../../users/users.service';
import { RefreshTokenPayload } from '../auth.types';

export interface RefreshRequestUser {
  id: number;
  email: string;
  role: Role;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    config: ConfigType<typeof jwtConfig>,
    private readonly usersService: UsersService,
    private readonly hashing: HashingService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.refreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: RefreshTokenPayload,
  ): Promise<RefreshRequestUser> {
    const refreshToken = (req.body as { refreshToken?: string })?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 없습니다.');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    const matches = await this.hashing.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!matches) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
