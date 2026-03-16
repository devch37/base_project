/**
 * ============================================
 * Email Value Object - 이메일 값 객체
 * ============================================
 *
 * 이메일의 비즈니스 규칙을 캡슐화
 * - 형식 검증
 * - 소문자 정규화
 * - 도메인 추출
 */

export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private readonly _value: string;

  constructor(email: string) {
    this.validate(email);
    // 이메일은 항상 소문자로 정규화
    this._value = email.toLowerCase().trim();
  }

  static create(email: string): Email {
    return new Email(email);
  }

  private validate(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new Error('이메일은 문자열이어야 합니다');
    }

    const trimmed = email.trim();

    if (!Email.EMAIL_REGEX.test(trimmed)) {
      throw new Error(`올바른 이메일 형식이 아닙니다: ${trimmed}`);
    }

    if (trimmed.length > 254) {
      throw new Error('이메일은 254자 이하이어야 합니다');
    }
  }

  get value(): string {
    return this._value;
  }

  /**
   * 도메인 추출 ('user@example.com' → 'example.com')
   */
  get domain(): string {
    return this._value.split('@')[1];
  }

  /**
   * 로컬 파트 추출 ('user@example.com' → 'user')
   */
  get localPart(): string {
    return this._value.split('@')[0];
  }

  equals(other: Email): boolean {
    if (!(other instanceof Email)) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Value Object 패턴 비교
 * =======================
 *
 * // 기존 방식 (string 사용)
 * function createUser(email: string) {
 *   if (!isValidEmail(email)) throw new Error('Invalid email'); // 매번 검증 반복
 *   return { email: email.toLowerCase() }; // 정규화 반복
 * }
 *
 * // Value Object 방식
 * function createUser(email: Email) {
 *   // Email 타입 자체가 "이미 검증된 이메일"을 보장
 *   return { email: email.value }; // 검증/정규화 불필요
 * }
 *
 * 타입 시스템이 비즈니스 규칙을 강제함!
 */
