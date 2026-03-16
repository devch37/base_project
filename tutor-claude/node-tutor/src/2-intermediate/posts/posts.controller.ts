/**
 * ============================================
 * Posts Controller - 게시글 컨트롤러 (Intermediate)
 * ============================================
 *
 * 1단계 대비 추가된 내용:
 * - @UseGuards(): 인증/인가 가드 적용
 * - @Roles(): 역할 기반 접근 제어
 * - @Public(): 인증 없이 접근 가능한 엔드포인트
 * - @UseInterceptors(): 인터셉터 적용
 * - request.user: 현재 로그인 사용자 정보 활용
 *
 * 중요 개념:
 * - Controller는 얇게 유지 (thin controller)
 * - 비즈니스 로직은 Service에 위임
 * - Guard, Pipe 활용으로 코드 중복 제거
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles, Public, UserRole } from '../guards/roles.decorator';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { CustomParseIntPipe } from '../pipes/parse-int.pipe';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * @UseGuards(AuthGuard, RolesGuard)
 * - 컨트롤러 전체에 가드 적용
 * - AuthGuard: 인증 확인
 * - RolesGuard: 역할 확인
 *
 * @UseInterceptors(LoggingInterceptor)
 * - 모든 요청에 로깅 적용
 */
@Controller('posts')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * 모든 게시글 조회 (공개)
   * @Public() - 인증 없이 접근 가능
   */
  @Get()
  @Public()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
  ) {
    if (keyword) {
      return this.postsService.search(keyword);
    }
    if (tag) {
      return this.postsService.findByTag(tag);
    }
    return this.postsService.findAll();
  }

  /**
   * Admin 전용: 삭제된 게시글 포함 전체 조회
   * @Roles(UserRole.ADMIN) - admin만 접근 가능
   */
  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async findAllIncludeDeleted() {
    return this.postsService.findAllIncludeDeleted();
  }

  /**
   * 내 게시글 조회
   * - 로그인한 사용자의 게시글만
   * - @Request() req: 요청 객체 (req.user 접근)
   */
  @Get('my')
  async findMine(@Request() req: AuthRequest) {
    return this.postsService.findAll(req.user!.id);
  }

  /**
   * 특정 게시글 조회 (공개)
   * - CustomParseIntPipe: '1' → 1 변환 + 양수 검증
   */
  @Get(':id')
  @Public()
  async findOne(@Param('id', CustomParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  /**
   * 게시글 생성
   * - 인증된 사용자만 가능
   * - authorId는 토큰에서 자동으로 설정
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: AuthRequest,
  ) {
    return this.postsService.create(createPostDto, req.user!.id);
  }

  /**
   * 게시글 수정
   * - 본인 게시글만 수정 가능 (Service에서 검증)
   */
  @Put(':id')
  async update(
    @Param('id', CustomParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: AuthRequest,
  ) {
    return this.postsService.update(id, updatePostDto, req.user!.id);
  }

  /**
   * 게시글 좋아요
   * - 인증된 사용자만
   */
  @Patch(':id/like')
  async like(@Param('id', CustomParseIntPipe) id: number) {
    return this.postsService.like(id);
  }

  /**
   * 게시글 삭제
   * - 본인 게시글만 삭제 가능 (Service에서 검증)
   * - Soft Delete (isDeleted = true)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', CustomParseIntPipe) id: number,
    @Request() req: AuthRequest,
  ) {
    return this.postsService.remove(id, req.user!.id);
  }

  /**
   * Admin 전용: 강제 삭제
   */
  @Delete(':id/force')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  async forceRemove(
    @Param('id', CustomParseIntPipe) id: number,
    @Request() req: AuthRequest,
  ) {
    // Admin은 authorId 검증 없이 삭제 (0은 모든 게시글에 대한 admin 접근을 의미)
    return this.postsService.remove(id, 0);
  }
}

/**
 * 컨트롤러 데코레이터 조합 정리
 * ==============================
 *
 * 클래스 레벨:
 * @Controller('posts')   - 기본 경로
 * @UseGuards(...)        - 모든 핸들러에 가드 적용
 * @UseInterceptors(...)  - 모든 핸들러에 인터셉터 적용
 * @UseFilters(...)       - 모든 핸들러에 필터 적용
 * @UsePipes(...)         - 모든 핸들러에 파이프 적용
 * @SetMetadata(...)      - 메타데이터 설정
 *
 * 메서드 레벨:
 * @Get()/@Post()/@Put()/@Delete()/@Patch()
 * @HttpCode(204)         - 응답 상태 코드
 * @Header('key', 'val')  - 응답 헤더 설정
 * @Redirect('url', 301)  - 리다이렉트
 * @Public()              - 인증 제외
 * @Roles(UserRole.ADMIN) - 역할 지정
 */
