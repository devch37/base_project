/**
 * ============================================
 * CQRS: Get Post Query & Handler
 * ============================================
 *
 * Query 패턴:
 * - 데이터 조회만 (상태 변경 없음)
 * - Command와 달리 반환값 있음
 * - 읽기 전용 최적화 가능
 *
 * CQRS의 핵심: Command와 Query를 완전히 분리!
 * - 다른 데이터베이스 사용 가능
 * - 다른 모델 사용 가능 (쓰기: 도메인 모델, 읽기: 단순 DTO)
 * - 읽기만 스케일아웃 가능
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IQuery, IQueryHandler } from '../command-bus';
import { IPostRepository, POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';

/**
 * GetPostQuery
 * ============
 * "ID로 게시글을 조회하라"는 질문
 */
export class GetPostQuery implements IQuery {
  readonly queryName = 'GetPost';

  constructor(readonly postId: number) {}
}

/**
 * GetPostResult - 조회 결과 타입
 * 읽기 전용 DTO (쓰기 모델보다 단순할 수 있음)
 */
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GetPostQueryHandler
 */
@Injectable()
export class GetPostQueryHandler
  implements IQueryHandler<GetPostQuery, GetPostResult>
{
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(query: GetPostQuery): Promise<GetPostResult> {
    const post = await this.postRepository.findById(query.postId);

    if (!post || post.isDeleted) {
      throw new NotFoundException(`Post ${query.postId} not found`);
    }

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
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}

/**
 * CQRS 읽기/쓰기 모델 분리 예시
 * ================================
 *
 * 쓰기 모델 (Command Side):
 * - Domain Entity (Post with Value Objects)
 * - 복잡한 비즈니스 규칙
 * - 이벤트 발행
 * - 정규화된 DB 스키마
 *
 * 읽기 모델 (Query Side):
 * - 단순한 DTO (비정규화, 조회 최적화)
 * - Join 없이 빠른 조회
 * - 읽기 전용 DB 또는 캐시
 * - 이벤트 핸들러가 읽기 모델 업데이트
 *
 * 예시:
 * // 쓰기: posts + authors 테이블 분리
 * // 읽기: posts_read_model 테이블 (비정규화)
 * CREATE TABLE posts_read_model (
 *   id INT, title VARCHAR, author_name VARCHAR,
 *   author_email VARCHAR, -- 조인 없이 바로 조회
 *   content_preview VARCHAR(200),
 *   published BOOLEAN, view_count INT, likes INT,
 *   tags JSON, created_at TIMESTAMP
 * );
 */
