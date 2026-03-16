/**
 * ============================================
 * Users Controller - 사용자 컨트롤러 (Intermediate)
 * ============================================
 *
 * 주요 엔드포인트:
 * POST /api/auth/register - 회원가입 (공개)
 * POST /api/auth/login    - 로그인 (공개)
 * GET  /api/users         - 사용자 목록 (Admin만)
 * GET  /api/users/profile - 내 프로필 (인증 필요)
 * GET  /api/users/:id     - 특정 사용자 (Admin만)
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles, Public, UserRole } from '../guards/roles.decorator';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { CustomParseIntPipe } from '../pipes/parse-int.pipe';
import { AuthRequest } from '../middleware/auth.middleware';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 회원가입
   * - 인증 불필요 (@Public)
   * - 201 Created 반환
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.register(createUserDto);
    // toJSON()이 passwordHash를 제외하고 직렬화
    return user;
  }

  /**
   * 로그인
   * - 인증 불필요 (@Public)
   * - accessToken 반환
   *
   * 응답 예시:
   * {
   *   "accessToken": "eyJ...",
   *   "user": { "id": 1, "email": "user@example.com", "role": "user" },
   *   "expiresIn": 3600
   * }
   *
   * 이후 요청 시 헤더에 포함:
   * Authorization: Bearer eyJ...
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  /**
   * 내 프로필 조회
   * - 인증 필요 (AuthGuard가 자동 적용)
   * - @Request()로 req.user 접근
   */
  @Get('profile')
  async getProfile(@Request() req: AuthRequest) {
    return this.usersService.findOne(req.user!.id);
  }

  /**
   * 전체 사용자 목록 (Admin만)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * 특정 사용자 조회 (Admin만)
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id', CustomParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}

/**
 * 인증 흐름 요약
 * ==============
 *
 * 1. 회원가입:
 *    POST /api/users/register
 *    Body: { email, username, password }
 *
 * 2. 로그인:
 *    POST /api/users/login
 *    Body: { email, password }
 *    → Response: { accessToken: "eyJ...", user: {...} }
 *
 * 3. 인증이 필요한 요청:
 *    GET /api/posts (내 게시글)
 *    Headers: Authorization: Bearer eyJ...
 *
 * 4. 토큰 만료 시:
 *    → 401 Unauthorized 응답
 *    → 다시 로그인 필요
 *
 * 실무: Refresh Token으로 자동 재발급
 */
