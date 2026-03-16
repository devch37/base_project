/**
 * ============================================
 * PostContent Value Object - 게시글 내용 값 객체
 * ============================================
 *
 * PostTitle과 동일한 Value Object 패턴
 * - 다른 비즈니스 규칙 (최소 10자, 최대 10000자)
 */

export class PostContent {
  static readonly MIN_LENGTH = 10;
  static readonly MAX_LENGTH = 10000;

  private readonly _value: string;

  constructor(content: string) {
    this.validate(content);
    this._value = content.trim();
  }

  static create(content: string): PostContent {
    return new PostContent(content);
  }

  private validate(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new Error('내용은 문자열이어야 합니다');
    }

    const trimmed = content.trim();

    if (trimmed.length < PostContent.MIN_LENGTH) {
      throw new Error(`내용은 최소 ${PostContent.MIN_LENGTH}자 이상이어야 합니다. 현재: ${trimmed.length}자`);
    }

    if (trimmed.length > PostContent.MAX_LENGTH) {
      throw new Error(`내용은 최대 ${PostContent.MAX_LENGTH}자 이하이어야 합니다`);
    }
  }

  get value(): string {
    return this._value;
  }

  /**
   * 미리보기 (첫 100자)
   */
  preview(length: number = 100): string {
    return this._value.length > length
      ? this._value.substring(0, length) + '...'
      : this._value;
  }

  /**
   * 단어 수 계산
   */
  wordCount(): number {
    return this._value.split(/\s+/).filter((w) => w.length > 0).length;
  }

  equals(other: PostContent): boolean {
    if (!(other instanceof PostContent)) return false;
    return this._value === other._value;
  }

  withValue(newContent: string): PostContent {
    return new PostContent(newContent);
  }

  toString(): string {
    return this._value;
  }
}
