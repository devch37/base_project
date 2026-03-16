/**
 * ============================================
 * List Posts Use Case - 게시글 목록 조회
 * ============================================
 */

import { Injectable, Inject } from '@nestjs/common';
import {
  IPostRepository,
  POST_REPOSITORY,
  PostFindOptions,
  PaginatedResult,
} from '../../../domain/repositories/post.repository.interface';

export interface ListPostsQuery {
  authorId?: number;
  published?: boolean;
  tags?: string[];
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface PostSummary {
  id: number;
  title: string;
  contentPreview: string;
  authorId: number;
  published: boolean;
  viewCount: number;
  likes: number;
  tags: string[];
  createdAt: Date;
}

@Injectable()
export class ListPostsUseCase {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(query: ListPostsQuery): Promise<PaginatedResult<PostSummary>> {
    const options: PostFindOptions = {
      authorId: query.authorId,
      published: query.published,
      tags: query.tags,
      keyword: query.keyword,
      includeDeleted: false,
    };

    const result = await this.postRepository.findWithPagination(options, {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    });

    return {
      ...result,
      data: result.data.map((post) => ({
        id: post.id,
        title: post.title.value,
        contentPreview: post.content.preview(100),
        authorId: post.authorId,
        published: post.published,
        viewCount: post.viewCount,
        likes: post.likes,
        tags: post.tags,
        createdAt: post.createdAt,
      })),
    };
  }
}
