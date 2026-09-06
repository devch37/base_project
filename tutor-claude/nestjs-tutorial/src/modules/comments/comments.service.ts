/**
 * ============================================================================
 * comments.service.ts
 * ----------------------------------------------------------------------------
 * 다른 모듈(Post)의 데이터가 필요할 때, Repository 를 직접 쓰지 않고
 * PostsService 를 주입받아 사용합니다 (도메인 경계 존중 → 결합도 낮춤).
 * ============================================================================
 */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, Paginated } from '../../common/dto/paginated.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../common/enums/role.enum';
import { PostsService } from '../posts/posts.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';

interface Actor {
  id: number;
  role: Role;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
    private readonly postsService: PostsService,
  ) {}

  async create(
    postId: number,
    dto: CreateCommentDto,
    authorId: number,
  ): Promise<Comment> {
    await this.postsService.findOne(postId); // 존재하지 않으면 404
    const comment = this.commentsRepo.create({
      content: dto.content,
      postId,
      authorId,
    });
    return this.commentsRepo.save(comment);
  }

  async findByPost(
    postId: number,
    query: PaginationQueryDto,
  ): Promise<Paginated<Comment>> {
    await this.postsService.findOne(postId);
    const [items, total] = await this.commentsRepo.findAndCount({
      where: { postId },
      relations: { author: true },
      order: { createdAt: query.order },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query);
  }

  async update(
    id: number,
    dto: UpdateCommentDto,
    actor: Actor,
  ): Promise<Comment> {
    const comment = await this.getOwnedComment(id, actor);
    if (dto.content !== undefined) comment.content = dto.content;
    return this.commentsRepo.save(comment);
  }

  async remove(id: number, actor: Actor): Promise<void> {
    const comment = await this.getOwnedComment(id, actor);
    await this.commentsRepo.remove(comment);
  }

  private async getOwnedComment(id: number, actor: Actor): Promise<Comment> {
    const comment = await this.commentsRepo.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`댓글(#${id})을 찾을 수 없습니다.`);
    }
    if (comment.authorId !== actor.id && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('본인 댓글만 수정/삭제할 수 있습니다.');
    }
    return comment;
  }
}
