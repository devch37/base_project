/**
 * ============================================
 * Delete Post Use Case - 게시글 삭제 유즈케이스
 * ============================================
 */

import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/repositories/post.repository.interface';
import { PostDomainService } from '../../../domain/services/post.domain-service';

export interface DeletePostCommand {
  postId: number;
  requestUserId: number;
  isAdmin: boolean;
}

@Injectable()
export class DeletePostUseCase {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly postDomainService: PostDomainService,
  ) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const post = await this.postRepository.findById(command.postId);

    if (!post || post.isDeleted) {
      throw new NotFoundException(`ID ${command.postId}번 게시글을 찾을 수 없습니다`);
    }

    const canModify = this.postDomainService.canUserModifyPost(
      post,
      command.requestUserId,
      command.isAdmin,
    );

    if (!canModify) {
      throw new ForbiddenException('이 게시글을 삭제할 권한이 없습니다');
    }

    // 도메인 엔티티의 delete() 메서드 호출 (Soft Delete + 이벤트)
    post.delete(command.requestUserId);

    await this.postRepository.update(post);

    // 이벤트 발행
    const events = post.pullDomainEvents();
    events.forEach((event) => {
      console.log(`[Domain Event] ${event.eventName}:`, event);
    });
  }
}
