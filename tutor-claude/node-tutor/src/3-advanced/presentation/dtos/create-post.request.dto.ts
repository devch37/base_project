/**
 * ============================================
 * Create Post Request DTO - HTTP 요청 DTO
 * ============================================
 *
 * Presentation Layer의 DTO:
 * - HTTP 요청 데이터 구조 정의
 * - Application Layer Command로 변환됨
 */

export class CreatePostRequestDto {
  title: string;
  content: string;
  tags?: string[];
  published?: boolean;

  static validate(dto: CreatePostRequestDto): string[] {
    const errors: string[] = [];
    if (!dto.title?.trim()) errors.push('title은 필수입니다');
    if (!dto.content?.trim()) errors.push('content는 필수입니다');
    return errors;
  }
}

export class UpdatePostRequestDto {
  title?: string;
  content?: string;
  published?: boolean;
  tags?: string[];
}
