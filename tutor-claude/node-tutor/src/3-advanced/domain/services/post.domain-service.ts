/**
 * ============================================
 * Post Domain Service - 게시글 도메인 서비스
 * ============================================
 *
 * Domain Service란?
 * - 엔티티나 Value Object에 속하기 어려운 도메인 로직
 * - 여러 엔티티에 걸친 비즈니스 규칙
 * - 상태를 가지지 않음 (Stateless)
 *
 * Entity 메서드 vs Domain Service:
 * - 한 엔티티에만 관련: Entity 메서드
 * - 여러 엔티티 관련: Domain Service
 * - 외부 시스템 필요: Application Service
 *
 * 주의: Application Service(Use Case)와 다름
 * - Domain Service: 순수 도메인 로직, 인프라 없음
 * - Application Service: 유즈케이스 오케스트레이션, 인프라 의존 가능
 */

import { Injectable } from '@nestjs/common';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostDomainService {
  /**
   * 게시글 수정 권한 확인
   * ====================
   * 여러 조건이 복합적으로 작용하는 비즈니스 규칙
   *
   * 규칙:
   * 1. 삭제된 게시글은 수정 불가
   * 2. 소유자만 수정 가능
   * 3. Admin은 모든 게시글 수정 가능
   */
  canUserModifyPost(post: Post, userId: number, isAdmin: boolean): boolean {
    if (post.isDeleted) {
      return false;
    }

    if (isAdmin) {
      return true;
    }

    return post.isOwnedBy(userId);
  }

  /**
   * 게시글 공개 가능 여부 확인
   * ==========================
   * 게시글 공개 전 모든 조건 검증
   */
  canPublish(post: Post): { canPublish: boolean; reason?: string } {
    if (post.isDeleted) {
      return { canPublish: false, reason: '삭제된 게시글은 공개할 수 없습니다' };
    }

    if (post.published) {
      return { canPublish: false, reason: '이미 공개된 게시글입니다' };
    }

    if (post.title.value.length < 5) {
      return { canPublish: false, reason: '제목이 너무 짧습니다 (최소 5자)' };
    }

    if (post.content.value.length < 50) {
      return { canPublish: false, reason: '내용이 너무 짧습니다 (최소 50자)' };
    }

    return { canPublish: true };
  }

  /**
   * 게시글 중복 제목 검사
   * ====================
   * 같은 작성자의 동일 제목 게시글 방지
   */
  hasDuplicateTitle(existingPosts: Post[], title: string, authorId: number): boolean {
    return existingPosts.some(
      (post) =>
        !post.isDeleted &&
        post.authorId === authorId &&
        post.title.value.toLowerCase() === title.toLowerCase(),
    );
  }

  /**
   * 추천 태그 생성
   * =============
   * 제목과 내용에서 키워드 추출 (간단한 구현)
   */
  suggestTags(title: string, content: string): string[] {
    const keywords = ['nestjs', 'typescript', 'javascript', 'react', 'nodejs', 'api', 'auth', 'ddd', 'clean-architecture'];
    const combined = `${title} ${content}`.toLowerCase();

    return keywords.filter((kw) => combined.includes(kw)).slice(0, 3);
  }
}

/**
 * Domain Service 사용 예시
 * ========================
 *
 * // Application Service (Use Case)에서 사용
 * export class UpdatePostUseCase {
 *   constructor(
 *     private postRepo: IPostRepository,
 *     private postDomainService: PostDomainService, // 주입
 *   ) {}
 *
 *   async execute(dto: UpdatePostDto): Promise<Post> {
 *     const post = await this.postRepo.findById(dto.postId);
 *     const user = await this.userRepo.findById(dto.userId);
 *
 *     // Domain Service로 비즈니스 규칙 확인
 *     const canModify = this.postDomainService.canUserModifyPost(
 *       post, dto.userId, user.isAdmin()
 *     );
 *
 *     if (!canModify) throw new ForbiddenException('수정 권한 없음');
 *
 *     post.changeTitle(dto.title);
 *     return this.postRepo.update(post);
 *   }
 * }
 */
