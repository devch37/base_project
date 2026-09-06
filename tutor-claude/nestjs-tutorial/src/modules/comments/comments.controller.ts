/**
 * ============================================================================
 * comments.controller.ts
 * ----------------------------------------------------------------------------
 * 중첩 리소스 라우팅 패턴:
 *   POST   /posts/:postId/comments   댓글 작성
 *   GET    /posts/:postId/comments   특정 글의 댓글 목록
 *   PATCH  /comments/:id             댓글 수정
 *   DELETE /comments/:id             댓글 삭제
 *
 * 하나의 컨트롤러에서 두 경로 접두어를 다루기 위해 @Controller() 를 경로 없이 두고
 * 각 핸들러에 전체 경로를 적었습니다. (규모가 커지면 컨트롤러를 분리)
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
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('posts/:postId/comments')
  @ApiOperation({ summary: '게시글의 댓글 목록' })
  findByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.commentsService.findByPost(postId, query);
  }

  @ApiBearerAuth()
  @Post('posts/:postId/comments')
  @ApiOperation({ summary: '댓글 작성' })
  create(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.commentsService.create(postId, dto, userId);
  }

  @ApiBearerAuth()
  @Patch('comments/:id')
  @ApiOperation({ summary: '댓글 수정 (작성자 또는 관리자)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '댓글 삭제 (작성자 또는 관리자)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.commentsService.remove(id, user);
  }
}
