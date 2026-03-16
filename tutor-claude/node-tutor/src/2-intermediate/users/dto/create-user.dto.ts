/**
 * ============================================
 * Create User DTO - 사용자 생성 DTO
 * ============================================
 *
 * DTO (Data Transfer Object)란?
 * - API 요청/응답의 데이터 구조를 정의하는 클래스
 * - 검증 규칙을 포함
 * - 실제 데이터베이스 엔티티와 분리
 *
 * 실무 (class-validator):
 * @IsEmail()
 * @IsNotEmpty()
 * @MinLength(8)
 * 등의 데코레이터로 자동 검증
 *
 * 이 예제: 수동 검증 (class-validator 없이)
 */

export class CreateUserDto {
  /**
   * 이메일
   * - 필수
   * - 유효한 이메일 형식
   * - 중복 불가
   */
  email: string;

  /**
   * 사용자명
   * - 필수
   * - 2-30자
   * - 영문, 숫자, 언더스코어만 허용
   */
  username: string;

  /**
   * 비밀번호 (평문)
   * - 필수
   * - 최소 8자
   * - 저장 시 해시 처리됨
   */
  password: string;

  /**
   * 역할 (선택, 기본값: 'user')
   * 일반적으로 사용자가 직접 admin 지정 불가
   */
  role?: string;

  /**
   * 검증 메서드 (class-validator 없이 수동 검증)
   * 실무에서는 ValidationPipe + class-validator 사용
   */
  static validate(dto: CreateUserDto): string[] {
    const errors: string[] = [];

    if (!dto.email || dto.email.trim() === '') {
      errors.push('이메일은 필수입니다');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email)) {
        errors.push('올바른 이메일 형식이 아닙니다');
      }
    }

    if (!dto.username || dto.username.trim() === '') {
      errors.push('사용자명은 필수입니다');
    } else if (dto.username.length < 2 || dto.username.length > 30) {
      errors.push('사용자명은 2-30자이어야 합니다');
    }

    if (!dto.password || dto.password === '') {
      errors.push('비밀번호는 필수입니다');
    } else if (dto.password.length < 8) {
      errors.push('비밀번호는 최소 8자 이상이어야 합니다');
    }

    return errors;
  }
}

/**
 * class-validator를 사용하는 실무 버전 (참고)
 * ============================================
 *
 * import { IsEmail, IsNotEmpty, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
 *
 * export class CreateUserDto {
 *   @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
 *   @IsNotEmpty({ message: '이메일은 필수입니다' })
 *   email: string;
 *
 *   @IsNotEmpty({ message: '사용자명은 필수입니다' })
 *   @MinLength(2, { message: '사용자명은 2자 이상이어야 합니다' })
 *   @MaxLength(30, { message: '사용자명은 30자 이하이어야 합니다' })
 *   username: string;
 *
 *   @IsNotEmpty({ message: '비밀번호는 필수입니다' })
 *   @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
 *   @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
 *     message: '비밀번호는 대소문자와 숫자를 포함해야 합니다',
 *   })
 *   password: string;
 *
 *   @IsOptional()
 *   @IsEnum(UserRole)
 *   role?: UserRole;
 * }
 */
