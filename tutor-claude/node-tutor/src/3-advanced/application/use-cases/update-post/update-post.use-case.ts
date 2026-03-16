/**
 * ============================================
 * Update Post Use Case - 게시글 수정 유즈케이스
 * ============================================
 */

import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/repositories/post.repository.interface';
import { PostDomainService } from '../../../domain/services/post.domain-service';

export interface UpdatePostCommand {
  postId: number;
  requestUserId: number;
  isAdmin: boolean;
  title?: string;
  content?: string;
  published?: boolean;
  tags?: string[];
}

export interface UpdatePostResult {
  id: number;
  title: string;
  content: string;
  published: boolean;
  tags: string[];
  updatedAt: Date;
}

@Injectable()
export class UpdatePostUseCase {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly postDomainService: PostDomainService,
  ) {}

  async execute(command: UpdatePostCommand): Promise<UpdatePostResult> {
    // 1. 게시글 조회
    const post = await this.postRepository.findById(command.postId);

    if (!post || post.isDeleted) {
      throw new NotFoundException(`ID ${command.postId}번 게시글을 찾을 수 없습니다`);
    }

    // 2. 권한 확인 (Domain Service 활용)
    const canModify = this.postDomainService.canUserModifyPost(
      post,
      command.requestUserId,
      command.isAdmin,
    );

    if (!canModify) {
      throw new ForbiddenException('이 게시글을 수정할 권한이 없습니다');
    }

    // 3. 도메인 엔티티 메서드로 수정 (비즈니스 규칙 적용)
    if (command.title !== undefined) post.changeTitle(command.title);
    if (command.content !== undefined) post.changeContent(command.content);
    if (command.tags !== undefined) post.setTags(command.tags);

    if (command.published !== undefined) {
      if (command.published && !post.published) {
        // publish() 메서드가 비즈니스 규칙 검증 (이벤트 발행 포함)
        const { canPublish, reason } = this.postDomainService.canPublish(post);
        if (!canPublish) throw new ForbiddenException(reason);
        post.publish();
      } else if (!command.published && post.published) {
        post.unpublish();
      }
    }

    // 4. 저장
    const updated = await this.postRepository.update(post);

    // 5. 이벤트 발행
    const events = updated.pullDomainEvents();
    events.forEach((event) => {
      console.log(`[Domain Event] ${event.eventName}:`, event);
    });

    return {
      id: updated.id,
      title: updated.title.value,
      content: updated.content.value,
      published: updated.published,
      tags: updated.tags,
      updatedAt: updated.updatedAt,
    };
  }
}
