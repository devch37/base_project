/**
 * ============================================================================
 * posts.controller.ts — /posts 라우트
 * ----------------------------------------------------------------------------
 * · 목록/단건 조회는 로그인 없이 허용 (@Public)
 * · 생성/수정/삭제는 인증 필요 (전역 가드가 처리)
 * · 소유권 검사는 서비스에서 (actor 를 넘겨줌)
 * ============================================================================
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post as HttpPost,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '게시글 목록 (검색/필터/페이지네이션)' })
  findAll(@Query() query: QueryPostsDto) {
    return this.postsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '게시글 단건 조회 (조회수 +1)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id, true);
  }

  @ApiBearerAuth()
  @HttpPost()
  @ApiOperation({ summary: '게시글 작성' })
  create(@Body() dto: CreatePostDto, @CurrentUser('id') userId: number) {
    return this.postsService.create(dto, userId);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: '게시글 수정 (작성자 또는 관리자)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.postsService.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '게시글 삭제 (작성자 또는 관리자)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.postsService.remove(id, user);
  }
}
