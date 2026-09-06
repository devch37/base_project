/**
 * ============================================================================
 * auth.service.ts — 인증 비즈니스 로직
 * ----------------------------------------------------------------------------
 * - register: 사용자 생성 + 환영 메일 + 토큰 발급
 * - login: 자격증명 검증 + 토큰 발급 + 리프레시 해시 저장
 * - refresh: 토큰 회전(rotation)
 * - logout: 리프레시 해시 제거
 *
 * 보안 포인트:
 *  · 로그인 실패 시 "이메일 없음"과 "비밀번호 틀림"을 구분하지 않는다 (열거 공격 방지)
 *  · 리프레시 토큰은 원문이 아니라 해시를 저장한다
 *  · 토큰 회전: refresh 할 때마다 새 refresh 토큰을 발급하고 이전 것을 무효화
 * ============================================================================
 */
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { HashingService } from '../../common/hashing/hashing.service';
import { MailerService } from '../../common/mailer/mailer.service';
import { jwtConfig } from '../../config/configuration';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import {
  AccessTokenPayload,
  AuthTokens,
  RefreshTokenPayload,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly hashing: HashingService,
    private readonly mailer: MailerService,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.usersService.create(dto);
    await this.mailer.sendWelcome(user.email, user.nickname);
    const tokens = await this.issueTokens(user);
    await this.updateRefreshHash(user.id, tokens.refreshToken);
    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const passwordOk = user
      ? await this.hashing.compare(dto.password, user.password)
      : false;

    if (!user || !passwordOk) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const tokens = await this.issueTokens(user);
    await this.updateRefreshHash(user.id, tokens.refreshToken);
    return { user, tokens };
  }

  /** 리프레시 토큰 검증은 JwtRefreshStrategy 가 이미 끝냄 → 여기서는 새 토큰만 발급 */
  async refresh(userId: number): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);
    const tokens = await this.issueTokens(user);
    await this.updateRefreshHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.setHashedRefreshToken(userId, null);
  }

  // --- 내부 헬퍼 --------------------------------------------------------

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const refreshPayload: RefreshTokenPayload = { sub: user.id };

    // expiresIn 은 '15m' 같은 문자열. @nestjs/jwt 타입이 좁은 리터럴을 요구하므로
    // 설정에서 온 string 을 옵션 타입으로 좁혀 준다.
    const accessExpires = this.jwtCfg
      .accessExpiresIn as JwtSignOptions['expiresIn'];
    const refreshExpires = this.jwtCfg
      .refreshExpiresIn as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.jwtCfg.accessSecret,
        expiresIn: accessExpires,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.jwtCfg.refreshSecret,
        expiresIn: refreshExpires,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshHash(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const hash = await this.hashing.hash(refreshToken);
    await this.usersService.setHashedRefreshToken(userId, hash);
  }
}
