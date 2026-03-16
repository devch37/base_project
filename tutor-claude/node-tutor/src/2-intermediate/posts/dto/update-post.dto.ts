/**
 * ============================================
 * Update Post DTO - 게시글 수정 DTO
 * ============================================
 *
 * 모든 필드가 선택적 (Partial)
 * - 제공된 필드만 업데이트
 * - 부분 업데이트(PATCH) 패턴
 */

export class UpdatePostDto {
  title?: string;
  content?: string;
  published?: boolean;
  tags?: string[];

  static validate(dto: UpdatePostDto): string[] {
    const errors: string[] = [];

    if (dto.title !== undefined) {
      if (dto.title.trim() === '') {
        errors.push('제목은 빈 값일 수 없습니다');
      } else if (dto.title.trim().length < 2) {
        errors.push('제목은 최소 2자 이상이어야 합니다');
      } else if (dto.title.trim().length > 100) {
        errors.push('제목은 최대 100자 이하이어야 합니다');
      }
    }

    if (dto.content !== undefined) {
      if (dto.content.trim() === '') {
        errors.push('내용은 빈 값일 수 없습니다');
      } else if (dto.content.trim().length < 10) {
        errors.push('내용은 최소 10자 이상이어야 합니다');
      }
    }

    if (dto.tags !== undefined && dto.tags.length > 5) {
      errors.push('태그는 최대 5개까지 가능합니다');
    }

    return errors;
  }
}
