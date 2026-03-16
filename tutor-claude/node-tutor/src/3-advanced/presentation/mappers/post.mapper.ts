/**
 * ============================================
 * Post Mapper - 계층 간 데이터 변환
 * ============================================
 *
 * Mapper란?
 * - 서로 다른 계층의 객체를 변환
 * - Presentation ↔ Application ↔ Domain ↔ Infrastructure
 *
 * 왜 Mapper가 필요한가?
 * - Domain Entity: 비즈니스 로직 중심, Value Object 포함
 * - Presentation DTO: HTTP 요청/응답 형식
 * - 직접 변환하면 계층 간 결합도 증가
 *
 * 변환 흐름:
 * HTTP Request → Request DTO → Command → Domain Entity
 * Domain Entity → Result → Response DTO → HTTP Response
 */

import { Post } from '../../domain/entities/post.entity';

/**
 * HTTP 응답용 DTO
 */
export class PostResponseDto {
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
  createdAt: string;  // ISO 문자열로 변환
  updatedAt: string;

  /**
   * 팩토리 메서드: Domain Entity → Response DTO
   */
  static fromDomain(post: Post): PostResponseDto {
    const dto = new PostResponseDto();
    dto.id = post.id;
    dto.title = post.title.value;
    dto.content = post.content.value;
    dto.contentPreview = post.content.preview(150);
    dto.authorId = post.authorId;
    dto.published = post.published;
    dto.viewCount = post.viewCount;
    dto.likes = post.likes;
    dto.tags = post.tags;
    dto.wordCount = post.content.wordCount();
    dto.createdAt = post.createdAt.toISOString();
    dto.updatedAt = post.updatedAt.toISOString();
    return dto;
  }
}

/**
 * 목록용 요약 DTO
 */
export class PostListItemDto {
  id: number;
  title: string;
  contentPreview: string;
  authorId: number;
  published: boolean;
  viewCount: number;
  likes: number;
  tags: string[];
  createdAt: string;

  static fromDomain(post: Post): PostListItemDto {
    const dto = new PostListItemDto();
    dto.id = post.id;
    dto.title = post.title.value;
    dto.contentPreview = post.content.preview(100);
    dto.authorId = post.authorId;
    dto.published = post.published;
    dto.viewCount = post.viewCount;
    dto.likes = post.likes;
    dto.tags = post.tags;
    dto.createdAt = post.createdAt.toISOString();
    return dto;
  }
}
