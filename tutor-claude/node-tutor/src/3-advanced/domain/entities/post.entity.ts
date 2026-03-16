/**
 * ============================================
 * Post Domain Entity - 게시글 도메인 엔티티
 * ============================================
 *
 * Domain Entity란?
 * - 고유한 식별자(ID)를 가진 객체
 * - 비즈니스 규칙과 상태를 캡슐화
 * - 데이터베이스 테이블과 1:1 매핑되지 않을 수도 있음
 * - Infrastructure Entity (TypeORM Entity)와 다름!
 *
 * Clean Architecture에서 Entity 위치:
 * - 가장 안쪽 계층 (Domain)
 * - 외부 프레임워크(NestJS, TypeORM 등)에 의존하지 않음
 * - 순수한 비즈니스 로직만 포함
 *
 * 1단계 Post 클래스와의 차이:
 * - Value Object 사용 (PostTitle, PostContent)
 * - 도메인 이벤트 발행
 * - 비즈니스 메서드 (publish, unpublish, like)
 * - 불변식(Invariant) 보호
 *
 * Anemic Domain Model (빈혈 도메인 모델) vs Rich Domain Model:
 * - Anemic: 데이터만 있고 로직 없음 (안티패턴)
 * - Rich: 데이터와 관련 비즈니스 로직을 함께 포함 (권장)
 */

import { PostTitle } from '../value-objects/post-title.vo';
import { PostContent } from '../value-objects/post-content.vo';
import { DomainEvent, PostCreatedEvent, PostPublishedEvent, PostDeletedEvent } from '../events/post-created.event';

export class Post {
  private readonly _id: number;
  private _title: PostTitle;
  private _content: PostContent;
  private readonly _authorId: number;
  private _published: boolean;
  private _viewCount: number;
  private _likes: number;
  private _tags: string[];
  private _isDeleted: boolean;
  private _deletedAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  /**
   * 도메인 이벤트 컬렉션
   * - 엔티티 내에 임시 저장
   * - Use Case에서 pullDomainEvents()로 수집 후 발행
   */
  private _domainEvents: DomainEvent[] = [];

  /**
   * 생성자는 private으로 만들어
   * 팩토리 메서드(create, reconstitute)만으로 생성하는 방식도 있음
   * 이 예제에서는 public으로 유지
   */
  constructor(params: {
    id: number;
    title: PostTitle;
    content: PostContent;
    authorId: number;
    published?: boolean;
    viewCount?: number;
    likes?: number;
    tags?: string[];
    isDeleted?: boolean;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = params.id;
    this._title = params.title;
    this._content = params.content;
    this._authorId = params.authorId;
    this._published = params.published ?? false;
    this._viewCount = params.viewCount ?? 0;
    this._likes = params.likes ?? 0;
    this._tags = params.tags ?? [];
    this._isDeleted = params.isDeleted ?? false;
    this._deletedAt = params.deletedAt;
    this._createdAt = params.createdAt ?? new Date();
    this._updatedAt = params.updatedAt ?? new Date();
  }

  /**
   * 팩토리 메서드: 새 게시글 생성
   * ================================
   * - 생성 시 비즈니스 규칙 검증
   * - 도메인 이벤트 발행
   *
   * 왜 생성자 대신 팩토리 메서드를 사용하는가?
   * - 의미 있는 이름 부여 (create vs reconstitute)
   * - 도메인 이벤트 발행
   * - 복잡한 생성 로직 캡슐화
   */
  static create(params: {
    id: number;
    title: string;
    content: string;
    authorId: number;
    authorEmail: string;
    tags?: string[];
  }): Post {
    // Value Object 생성 (검증 포함)
    const title = PostTitle.create(params.title);
    const content = PostContent.create(params.content);

    const post = new Post({
      id: params.id,
      title,
      content,
      authorId: params.authorId,
      tags: params.tags ?? [],
    });

    // 도메인 이벤트 등록 (즉시 발행하지 않음)
    post._domainEvents.push(
      new PostCreatedEvent(
        params.id,
        title.value,
        params.authorId,
        params.authorEmail,
      ),
    );

    return post;
  }

  /**
   * 팩토리 메서드: DB에서 재구성 (reconstitute)
   * - DB에서 읽어올 때 사용
   * - 이벤트 발행 없음 (새로 생성이 아님)
   */
  static reconstitute(params: {
    id: number;
    title: string;
    content: string;
    authorId: number;
    published: boolean;
    viewCount: number;
    likes: number;
    tags: string[];
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Post {
    return new Post({
      id: params.id,
      title: PostTitle.create(params.title),
      content: PostContent.create(params.content),
      authorId: params.authorId,
      published: params.published,
      viewCount: params.viewCount,
      likes: params.likes,
      tags: params.tags,
      isDeleted: params.isDeleted,
      deletedAt: params.deletedAt,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
  }

  // ===== 비즈니스 메서드 =====

  /**
   * 게시글 공개
   * - 비즈니스 규칙: 이미 공개된 게시글은 공개 불가
   */
  publish(): void {
    if (this._published) {
      throw new Error('이미 공개된 게시글입니다');
    }
    if (this._isDeleted) {
      throw new Error('삭제된 게시글은 공개할 수 없습니다');
    }
    this._published = true;
    this._updatedAt = new Date();

    this._domainEvents.push(
      new PostPublishedEvent(this._id, this._title.value, this._authorId),
    );
  }

  /**
   * 게시글 비공개
   */
  unpublish(): void {
    if (!this._published) {
      throw new Error('이미 비공개 상태입니다');
    }
    this._published = false;
    this._updatedAt = new Date();
  }

  /**
   * 제목 변경
   */
  changeTitle(newTitle: string): void {
    this._title = this._title.withValue(newTitle);
    this._updatedAt = new Date();
  }

  /**
   * 내용 변경
   */
  changeContent(newContent: string): void {
    this._content = this._content.withValue(newContent);
    this._updatedAt = new Date();
  }

  /**
   * 태그 설정
   */
  setTags(tags: string[]): void {
    if (tags.length > 5) {
      throw new Error('태그는 최대 5개까지 가능합니다');
    }
    this._tags = [...tags];
    this._updatedAt = new Date();
  }

  /**
   * 좋아요
   */
  like(): void {
    this._likes++;
    this._updatedAt = new Date();
  }

  /**
   * 조회수 증가
   */
  incrementViewCount(): void {
    this._viewCount++;
  }

  /**
   * Soft Delete
   * - 요청자 ID를 받아 이벤트에 기록
   */
  delete(deletedBy: number): void {
    if (this._isDeleted) {
      throw new Error('이미 삭제된 게시글입니다');
    }
    this._isDeleted = true;
    this._deletedAt = new Date();
    this._updatedAt = new Date();

    this._domainEvents.push(new PostDeletedEvent(this._id, deletedBy));
  }

  /**
   * 도메인 이벤트 수집
   * - 이벤트를 가져오고 내부 목록 초기화
   * - Use Case에서 호출 후 이벤트 발행
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // ===== Getters =====
  get id(): number { return this._id; }
  get title(): PostTitle { return this._title; }
  get content(): PostContent { return this._content; }
  get authorId(): number { return this._authorId; }
  get published(): boolean { return this._published; }
  get viewCount(): number { return this._viewCount; }
  get likes(): number { return this._likes; }
  get tags(): string[] { return [...this._tags]; }
  get isDeleted(): boolean { return this._isDeleted; }
  get deletedAt(): Date | undefined { return this._deletedAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  /**
   * 소유자 확인
   */
  isOwnedBy(userId: number): boolean {
    return this._authorId === userId;
  }
}

/**
 * Rich Domain Model 예시 비교
 * ============================
 *
 * // Anemic (빈혈) - 안티패턴
 * class Post {
 *   id: number;
 *   title: string;
 *   published: boolean;
 *   // 로직 없음 - 서비스에서 직접 post.published = true;
 * }
 *
 * // Rich (풍부한) - 권장
 * class Post {
 *   private _published: boolean;
 *   publish(): void {
 *     if (this._published) throw new Error('이미 공개됨');
 *     this._published = true; // 규칙이 엔티티 안에 있음
 *   }
 * }
 *
 * Rich Model 장점:
 * - 비즈니스 규칙이 데이터 근처에 위치
 * - 서비스 계층이 얇아짐
 * - 테스트하기 쉬움
 * - 도메인 로직이 분산되지 않음
 */
