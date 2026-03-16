/**
 * ============================================
 * CQRS: Create Post Command & Handler
 * ============================================
 *
 * Command 패턴:
 * - 요청을 객체로 캡슐화
 * - 실행 시점과 정의 시점 분리
 * - 취소(Undo), 큐잉, 로깅이 용이
 */

import { Injectable, Inject } from '@nestjs/common';
import { ICommand, ICommandHandler, CommandBus } from '../command-bus';
import { IPostRepository, POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { PostDomainService } from '../../domain/services/post.domain-service';
import { Post } from '../../domain/entities/post.entity';

/**
 * CreatePostCommand
 * =================
 * "게시글을 생성하라"는 명령
 * - 불변 객체 (readonly 필드)
 * - 과거형이 아닌 명령형 이름
 */
export class CreatePostCommand implements ICommand {
  readonly commandName = 'CreatePost';

  constructor(
    readonly title: string,
    readonly content: string,
    readonly authorId: number,
    readonly authorEmail: string,
    readonly tags?: string[],
  ) {}
}

/**
 * CreatePostCommandHandler
 * ========================
 * CreatePostCommand를 처리하는 핸들러
 * - 단일 책임: 게시글 생성만
 */
@Injectable()
export class CreatePostCommandHandler
  implements ICommandHandler<CreatePostCommand, Post>
{
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly postDomainService: PostDomainService,
  ) {}

  async execute(command: CreatePostCommand): Promise<Post> {
    // 중복 제목 검사
    const existing = await this.postRepository.findAll({ authorId: command.authorId });
    if (this.postDomainService.hasDuplicateTitle(existing, command.title, command.authorId)) {
      throw new Error('같은 제목의 게시글이 이미 존재합니다');
    }

    const id = await this.postRepository.nextId();

    const post = Post.create({
      id,
      title: command.title,
      content: command.content,
      authorId: command.authorId,
      authorEmail: command.authorEmail,
      tags: command.tags,
    });

    const saved = await this.postRepository.save(post);

    // 이벤트 처리
    const events = saved.pullDomainEvents();
    events.forEach((e) => console.log(`[Event] ${e.eventName}`, e));

    return saved;
  }
}

/**
 * CQRS 컨트롤러 사용 예시
 * ========================
 *
 * @Controller('posts')
 * export class CqrsPostsController {
 *   constructor(private readonly commandBus: CommandBus) {}
 *
 *   @Post()
 *   async create(@Body() dto: CreatePostRequestDto, @Request() req) {
 *     const command = new CreatePostCommand(
 *       dto.title,
 *       dto.content,
 *       req.user.id,
 *       req.user.email,
 *       dto.tags,
 *     );
 *     return this.commandBus.execute(command);
 *   }
 * }
 *
 * Command vs Use Case:
 * - 실질적으로 동일한 개념
 * - CQRS 패턴에서는 Command/Query로 명시적 분리
 * - Use Case 패턴은 더 간단한 구조
 * - 복잡한 시스템에서는 CQRS가 더 명확한 분리 제공
 */
