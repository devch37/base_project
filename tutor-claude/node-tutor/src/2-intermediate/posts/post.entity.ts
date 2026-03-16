/**
 * ============================================
 * Post Entity - 게시글 엔티티 (Intermediate)
 * ============================================
 *
 * 1단계 대비 추가된 내용:
 * - tags: 태그 배열 (다대다 관계 시뮬레이션)
 * - likes: 좋아요 수
 * - isDeleted: Soft Delete 패턴
 */

export class Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  viewCount: number;
  likes: number;
  tags: string[];

  /**
   * Soft Delete
   * - Hard Delete: 실제 데이터 삭제
   * - Soft Delete: isDeleted = true 표시 (권장)
   *   이유: 데이터 복구 가능, 감사 추적, 관련 데이터 정합성 유지
   */
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Post>) {
    Object.assign(this, {
      likes: 0,
      viewCount: 0,
      tags: [],
      published: false,
      isDeleted: false,
      ...partial,
    });
  }
}
