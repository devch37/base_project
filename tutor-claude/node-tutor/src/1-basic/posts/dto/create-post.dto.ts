/**
 * ============================================
 * Create Post DTO
 * ============================================
 *
 * DTO (Data Transfer Object)
 * - 계층 간 데이터 전송을 위한 객체
 * - API 요청 본문의 구조를 정의
 * - 데이터 검증 규칙을 포함
 *
 * 왜 DTO를 사용할까?
 * 1. 타입 안정성: TypeScript의 타입 체크 활용
 * 2. 검증: class-validator로 자동 검증
 * 3. 문서화: API 스펙을 코드로 명확히 표현
 * 4. 보안: 필요한 필드만 받아서 처리
 */

/**
 * 게시글 생성 DTO
 * - 클라이언트가 게시글 생성 시 보내는 데이터 구조
 */
export class CreatePostDto {
  /**
   * 게시글 제목
   * - 필수 항목
   */
  title: string;

  /**
   * 게시글 내용
   * - 필수 항목
   */
  content: string;

  /**
   * 작성자 ID
   * - 필수 항목
   * - 실제로는 JWT 토큰에서 추출하는 것이 더 안전
   */
  authorId: number;

  /**
   * 게시 여부
   * - 선택 항목 (기본값: false)
   */
  published?: boolean;
}

/**
 * class-validator 사용 예제
 * =========================
 *
 * npm install class-validator class-transformer
 *
 * import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';
 *
 * export class CreatePostDto {
 *   @IsString()
 *   @IsNotEmpty({ message: '제목은 필수입니다.' })
 *   @MinLength(2, { message: '제목은 최소 2자 이상이어야 합니다.' })
 *   @MaxLength(100, { message: '제목은 최대 100자까지 가능합니다.' })
 *   title: string;
 *
 *   @IsString()
 *   @IsNotEmpty({ message: '내용은 필수입니다.' })
 *   @MinLength(10, { message: '내용은 최소 10자 이상이어야 합니다.' })
 *   content: string;
 *
 *   @IsNumber()
 *   @IsNotEmpty({ message: '작성자 ID는 필수입니다.' })
 *   authorId: number;
 *
 *   @IsBoolean()
 *   @IsOptional()  // 선택적 필드
 *   published?: boolean;
 * }
 *
 * 사용 방법 (main.ts에서):
 * app.useGlobalPipes(new ValidationPipe());
 */

/**
 * DTO 작성 가이드
 * ===============
 *
 * 1. 명확한 이름
 *    - Create, Update, Response 등을 접두사로 사용
 *    - CreatePostDto, UpdateUserDto, LoginResponseDto
 *
 * 2. 최소한의 필드
 *    - 필요한 필드만 포함
 *    - 보안상 민감한 정보는 제외
 *
 * 3. 검증 규칙
 *    - class-validator 데코레이터 활용
 *    - 명확한 에러 메시지 제공
 *
 * 4. 문서화
 *    - 각 필드에 주석 작성
 *    - Swagger 데코레이터 추가 (@ApiProperty)
 */
