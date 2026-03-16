/**
 * ============================================
 * Create Post DTO - 게시글 생성 DTO (Intermediate)
 * ============================================
 *
 * class-validator 없이 수동 검증 구현
 * 실무에서는 class-validator 사용 권장
 */

export class CreatePostDto {
  /**
   * 게시글 제목 (필수, 2-100자)
   */
  title: string;

  /**
   * 게시글 내용 (필수, 최소 10자)
   */
  content: string;

  /**
   * 작성자 ID (AuthGuard에서 자동 설정되므로 선택)
   */
  authorId?: number;

  /**
   * 공개 여부 (기본값: false)
   */
  published?: boolean;

  /**
   * 태그 목록 (선택, 최대 5개)
   */
  tags?: string[];

  /**
   * 수동 검증 메서드
   */
  static validate(dto: CreatePostDto): string[] {
    const errors: string[] = [];

    if (!dto.title || dto.title.trim() === '') {
      errors.push('제목은 필수입니다');
    } else if (dto.title.trim().length < 2) {
      errors.push('제목은 최소 2자 이상이어야 합니다');
    } else if (dto.title.trim().length > 100) {
      errors.push('제목은 최대 100자 이하이어야 합니다');
    }

    if (!dto.content || dto.content.trim() === '') {
      errors.push('내용은 필수입니다');
    } else if (dto.content.trim().length < 10) {
      errors.push('내용은 최소 10자 이상이어야 합니다');
    }

    if (dto.tags && dto.tags.length > 5) {
      errors.push('태그는 최대 5개까지 가능합니다');
    }

    return errors;
  }
}
