/**
 * ============================================
 * PostTitle Value Object - 게시글 제목 값 객체
 * ============================================
 *
 * Value Object (값 객체)란?
 * - 식별자(ID)가 없는 객체
 * - 값 자체로 동일성 비교 (Entity는 ID로 비교)
 * - 불변(Immutable): 생성 후 변경 불가
 * - 비즈니스 규칙을 캡슐화
 *
 * Entity vs Value Object:
 * +------------------+------------------+
 * | Entity           | Value Object     |
 * +------------------+------------------+
 * | ID로 동일성 판단 | 값으로 동일성 판단|
 * | 가변적 (Mutable) | 불변 (Immutable) |
 * | ex: User, Post   | ex: Email, Title |
 * +------------------+------------------+
 *
 * 장점:
 * - 비즈니스 규칙이 한 곳에 집중
 * - 타입 안정성 향상 (string 대신 PostTitle)
 * - 검증 로직 중복 제거
 * - 도메인 의도 명확히 표현
 */

export class PostTitle {
  /**
   * 비즈니스 규칙 상수
   */
  static readonly MIN_LENGTH = 2;
  static readonly MAX_LENGTH = 100;

  /**
   * private readonly로 불변성 보장
   * - 외부에서 직접 변경 불가
   * - 변경이 필요하면 새 인스턴스 생성
   */
  private readonly _value: string;

  /**
   * 생성자 (private 권장)
   * - 직접 new PostTitle()은 가능하지만
   * - 실무에서는 static create() 팩토리 메서드 권장
   */
  constructor(title: string) {
    this.validate(title);
    this._value = title.trim();
  }

  /**
   * 팩토리 메서드 (권장 생성 방법)
   * - 생성 실패 시 에러를 명시적으로 처리
   *
   * 사용 예:
   * const title = PostTitle.create('NestJS 튜토리얼');
   */
  static create(title: string): PostTitle {
    return new PostTitle(title);
  }

  /**
   * 검증 로직
   * - 생성 시점에 불변식(invariant) 보장
   * - 잘못된 상태의 객체는 아예 생성 불가
   */
  private validate(title: string): void {
    if (!title || typeof title !== 'string') {
      throw new Error('제목은 문자열이어야 합니다');
    }

    const trimmed = title.trim();

    if (trimmed.length < PostTitle.MIN_LENGTH) {
      throw new Error(`제목은 최소 ${PostTitle.MIN_LENGTH}자 이상이어야 합니다. 현재: ${trimmed.length}자`);
    }

    if (trimmed.length > PostTitle.MAX_LENGTH) {
      throw new Error(`제목은 최대 ${PostTitle.MAX_LENGTH}자 이하이어야 합니다. 현재: ${trimmed.length}자`);
    }
  }

  /**
   * 값 접근자 (getter)
   */
  get value(): string {
    return this._value;
  }

  /**
   * 동등성 비교
   * - Value Object는 값으로 비교
   * - Entity와 달리 ID 없음
   */
  equals(other: PostTitle): boolean {
    if (!(other instanceof PostTitle)) return false;
    return this._value === other._value;
  }

  /**
   * 변환된 새 값 객체 반환 (불변성 유지)
   * - 직접 수정하지 않고 새 인스턴스 반환
   */
  withValue(newTitle: string): PostTitle {
    return new PostTitle(newTitle);
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Value Object 사용 예시
 * =======================
 *
 * // 생성 (검증 포함)
 * const title = PostTitle.create('NestJS 완벽 가이드');
 * console.log(title.value); // 'NestJS 완벽 가이드'
 *
 * // 잘못된 값으로 생성 시 에러
 * try {
 *   const badTitle = PostTitle.create('a'); // 1자 - 에러!
 * } catch (e) {
 *   console.log(e.message); // '제목은 최소 2자 이상이어야 합니다'
 * }
 *
 * // 동등성 비교
 * const t1 = PostTitle.create('NestJS');
 * const t2 = PostTitle.create('NestJS');
 * console.log(t1.equals(t2)); // true (값이 같음)
 *
 * // 변경 (새 인스턴스)
 * const updated = title.withValue('업데이트된 제목');
 * console.log(title.value);   // 'NestJS 완벽 가이드' (원본 불변)
 * console.log(updated.value); // '업데이트된 제목' (새 인스턴스)
 */
