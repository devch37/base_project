/**
 * ============================================
 * Update Post DTO
 * ============================================
 *
 * 게시글 수정용 DTO
 * - CreatePostDto와 유사하지만 모든 필드가 선택적
 * - 부분 업데이트 (Partial Update) 지원
 */

/**
 * 수동으로 작성하는 방법
 */
export class UpdatePostDto {
  /**
   * 게시글 제목 (선택)
   */
  title?: string;

  /**
   * 게시글 내용 (선택)
   */
  content?: string;

  /**
   * 게시 여부 (선택)
   */
  published?: boolean;
}

/**
 * TypeScript의 Utility Type 활용
 * ==============================
 *
 * import { CreatePostDto } from './create-post.dto';
 *
 * // Partial<T>: 모든 속성을 선택적으로 만듦
 * export class UpdatePostDto extends Partial(CreatePostDto) {}
 *
 * // Omit<T, K>: 특정 속성 제외
 * export class UpdatePostDto extends Omit(CreatePostDto, 'authorId') {}
 *
 * // Pick<T, K>: 특정 속성만 선택
 * export class UpdatePostDto extends Pick(CreatePostDto, 'title' | 'content') {}
 */

/**
 * NestJS의 PartialType 활용 (권장)
 * ================================
 *
 * npm install @nestjs/mapped-types
 *
 * import { PartialType, OmitType, PickType } from '@nestjs/mapped-types';
 * import { CreatePostDto } from './create-post.dto';
 *
 * // 모든 필드를 선택적으로
 * export class UpdatePostDto extends PartialType(CreatePostDto) {}
 *
 * // authorId 제외하고 나머지는 선택적으로
 * export class UpdatePostDto extends PartialType(
 *   OmitType(CreatePostDto, ['authorId'] as const)
 * ) {}
 *
 * 장점:
 * - 코드 중복 제거
 * - CreatePostDto 변경 시 자동 반영
 * - 검증 규칙도 함께 상속됨
 */

/**
 * 실전 패턴
 * =========
 *
 * 1. 생성과 수정 DTO 분리
 *    - 생성: 필수 필드가 많음
 *    - 수정: 모든 필드가 선택적
 *
 * 2. Response DTO 별도 작성
 *    - 민감한 정보 제외 (password 등)
 *    - 필요한 계산된 필드 추가
 *
 * 3. 중첩 DTO
 *    - 복잡한 객체는 중첩 DTO 사용
 *    - 예: CreateOrderDto { items: CreateOrderItemDto[] }
 */
