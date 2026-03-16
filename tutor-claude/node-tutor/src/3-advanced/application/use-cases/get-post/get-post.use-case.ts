/**
 * ============================================
 * Get Post Use Case - 게시글 조회 유즈케이스
 * ============================================
 *
 * CQRS 관점에서:
 * - Query (조회): 상태 변경 없음, 데이터만 반환
 * - Command (명령): 상태 변경 발생
 *
 * 이 Use Case는 Query에 해당
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/repositories/post.repository.interface';

export interface GetPostQuery {
  postId: number;
}

export interface GetPostResult {
  id: number;
  title: string;
  content: string;
  contentPreview: string;
  authorId: number;
  published: boolean;
  viewCount: number;
  likes: number;
  tags: string[];
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetPostUseCase {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(query: GetPostQuery): Promise<GetPostResult> {
    const post = await this.postRepository.findById(query.postId);

    if (!post || post.isDeleted) {
      throw new NotFoundException(`ID ${query.postId}번 게시글을 찾을 수 없습니다`);
    }

    // 조회수 증가 (Query임에도 카운터는 변경)
    post.incrementViewCount();
    await this.postRepository.update(post);

    return {
      id: post.id,
      title: post.title.value,
      content: post.content.value,
      contentPreview: post.content.preview(150),
      authorId: post.authorId,
      published: post.published,
      viewCount: post.viewCount,
      likes: post.likes,
      tags: post.tags,
      wordCount: post.content.wordCount(),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
