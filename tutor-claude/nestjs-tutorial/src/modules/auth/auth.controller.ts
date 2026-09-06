/**
 * ============================================================================
 * auth.controller.ts — /auth 라우트
 * ----------------------------------------------------------------------------
 * register/login/refresh 는 인증 전이므로 @Public() 으로 전역 가드를 우회합니다.
 * refresh 는 @Public() + JwtRefreshGuard 조합: 액세스 토큰은 없지만 리프레시 토큰은 검증.
 * ============================================================================
 */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTransform } from '../../common/interceptors/skip-transform.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입 (가입 후 토큰 발급)' })
  async register(@Body() dto: RegisterDto) {
    const { user, tokens } = await this.authService.register(dto);
    return { user: this.publicUser(user), ...tokens };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK) // POST 지만 "생성"이 아니므로 201 대신 200
  @ApiOperation({ summary: '로그인' })
  async login(@Body() dto: LoginDto) {
    const { user, tokens } = await this.authService.login(dto);
    return { user: this.publicUser(user), ...tokens };
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '액세스 토큰 갱신 (본문에 refreshToken 필요)' })
  refresh(@Req() req: Request & { user: { id: number } }) {
    return this.authService.refresh(req.user.id);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipTransform()
  @ApiOperation({ summary: '로그아웃 (서버의 리프레시 토큰 무효화)' })
  async logout(@CurrentUser('id') userId: number): Promise<void> {
    await this.authService.logout(userId);
  }

  /** 응답에 노출해도 되는 사용자 필드만 추림 */
  private publicUser(user: {
    id: number;
    email: string;
    nickname: string;
    role: string;
  }) {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    };
  }
}
