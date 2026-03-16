/**
 * ============================================
 * Login DTO - 로그인 요청 DTO
 * ============================================
 *
 * 로그인 요청에 필요한 최소한의 데이터
 */

export class LoginDto {
  /**
   * 로그인용 이메일
   */
  email: string;

  /**
   * 평문 비밀번호 (서버에서 해시 비교)
   */
  password: string;

  static validate(dto: LoginDto): string[] {
    const errors: string[] = [];

    if (!dto.email || dto.email.trim() === '') {
      errors.push('이메일은 필수입니다');
    }

    if (!dto.password || dto.password === '') {
      errors.push('비밀번호는 필수입니다');
    }

    return errors;
  }
}

/**
 * 로그인 응답 DTO
 */
export class LoginResponseDto {
  /**
   * JWT 액세스 토큰
   * - 이후 요청에서 Authorization 헤더에 포함
   * - Authorization: Bearer <token>
   */
  accessToken: string;

  /**
   * 로그인한 사용자 정보 (비밀번호 제외)
   */
  user: {
    id: number;
    email: string;
    username?: string;
    role: string;
  };

  /**
   * 토큰 만료 시간 (초)
   */
  expiresIn: number;
}
