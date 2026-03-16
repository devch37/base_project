/**
 * ============================================
 * Posts Controller - Presentation Layer
 * ============================================
 *
 * Presentation Layer의 역할:
 * - HTTP 요청 수신
 * - Request DTO 파싱
 * - Use Case 호출 (Application Layer)
 * - Response DTO 변환
 * - HTTP 응답 반환
 *
 * Controller는 최대한 얇게 유지:
 * - 비즈니스 로직 없음
 * - HTTP 관련 로직만
 * - Use Case에 모든 것을 위임
 *
 * Clean Architecture에서 Controller 위치:
 * ┌────────────────────────────────────┐
 * │  Presentation Layer (여기!)        │
 * │  - HTTP, gRPC, WebSocket 어댑터   │
 * │  - Request/Response 변환          │
 * └──────────────┬─────────────────────┘
 *                ↓ 호출
 * ┌────────────────────────────────────┐
 * │  Application Layer                 │
 * │  - Use Cases                       │
 * └────────────────────────────────────┘
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { CreatePostUseCase } from '../../application/use-cases/create-post/create-post.use-case';
import { GetPostUseCase } from '../../application/use-cases/get-post/get-post.use-case';
import { ListPostsUseCase } from '../../application/use-cases/list-posts/list-posts.use-case';
import { UpdatePostUseCase } from '../../application/use-cases/update-post/update-post.use-case';
import { DeletePostUseCase } from '../../application/use-cases/delete-post/delete-post.use-case';
import { CreatePostRequestDto, UpdatePostRequestDto } from '../dtos/create-post.request.dto';

/**
 * 인증 요청 타입 (간략화)
 * 실제로는 2-intermediate의 AuthRequest 사용
 */
interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

@Controller('posts')
export class PostsController {
  /**
   * 여러 Use Case 주입
   * - 각 Use Case는 하나의 기능만 담당
   * - 컨트롤러는 적절한 Use Case로 요청 라우팅
   */
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly getPostUseCase: GetPostUseCase,
    private readonly listPostsUseCase: ListPostsUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
  ) {}

  /**
   * GET /api/posts
   * 게시글 목록 조회
   */
  @Get()
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('published') published?: string,
  ) {
    return this.listPostsUseCase.execute({
      page: page ?? 1,
      limit: limit ?? 10,
      keyword,
      tags: tag ? [tag] : undefined,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
    });
  }

  /**
   * GET /api/posts/:id
   * 게시글 상세 조회
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getPostUseCase.execute({ postId: id });
  }

  /**
   * POST /api/posts
   * 게시글 생성
   *
   * req.user는 실제로 AuthMiddleware/Guard에서 설정됨
   * 이 예제에서는 간략화를 위해 body에서 authorId 받음
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePostRequestDto,
    @Request() req: any,
  ) {
    // 입력 검증
    const errors = CreatePostRequestDto.validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException({ message: '입력값 검증 실패', errors });
    }

    // 실제 앱에서는 req.user에서 가져옴
    const authorId = req.user?.id ?? 1;
    const authorEmail = req.user?.email ?? 'demo@example.com';

    return this.createPostUseCase.execute({
      title: dto.title,
      content: dto.content,
      authorId,
      authorEmail,
      tags: dto.tags,
    });
  }

  /**
   * PUT /api/posts/:id
   * 게시글 수정
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostRequestDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id ?? 1;
    const isAdmin = req.user?.role === 'admin';

    return this.updatePostUseCase.execute({
      postId: id,
      requestUserId: userId,
      isAdmin,
      title: dto.title,
      content: dto.content,
      published: dto.published,
      tags: dto.tags,
    });
  }

  /**
   * PATCH /api/posts/:id/like
   * 좋아요
   */
  @Patch(':id/like')
  async like(@Param('id', ParseIntPipe) id: number) {
    // 간단한 좋아요는 use case 없이 바로 처리할 수도 있음
    // (예: 별도 LikePostUseCase 없이 GetPost → like() → update)
    const post = await this.getPostUseCase.execute({ postId: id });
    return { likes: post.likes + 1 }; // 시뮬레이션
  }

  /**
   * DELETE /api/posts/:id
   * 게시글 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userId = req.user?.id ?? 1;
    const isAdmin = req.user?.role === 'admin';

    await this.deletePostUseCase.execute({
      postId: id,
      requestUserId: userId,
      isAdmin,
    });
  }
}

/**
 * 계층 분리의 장점 실증
 * =====================
 *
 * 이 Controller를 gRPC로 바꾸려면:
 * - GrpcPostsController만 새로 만들면 됨
 * - Use Case 코드는 전혀 변경 없음!
 *
 * Controller 교체 예시:
 * @GrpcMethod('PostService', 'CreatePost')
 * async grpcCreatePost(data: CreatePostRequest) {
 *   return this.createPostUseCase.execute(data); // 동일한 Use Case!
 * }
 *
 * 테스트:
 * - Controller 테스트: HTTP 요청/응답만 확인
 * - Use Case 테스트: 비즈니스 로직만 확인
 * - Repository 테스트: 데이터 접근만 확인
 */
