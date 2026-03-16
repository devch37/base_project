/**
 * ============================================
 * Post Created Event - 게시글 생성 도메인 이벤트
 * ============================================
 *
 * Domain Event (도메인 이벤트)란?
 * - 도메인에서 발생한 중요한 사건(fact)
 * - "무언가가 일어났다"를 표현
 * - 과거 시제로 이름 지정 (PostCreated, UserRegistered 등)
 * - 불변(Immutable) - 과거 사실이므로 변경 불가
 *
 * 왜 도메인 이벤트를 사용하는가?
 * - 결합도 감소: 이벤트 발행자와 처리자가 서로 모름
 * - 부가 효과 처리: 이메일 전송, 알림, 통계 등을 분리
 * - 감사 추적(Audit Trail)
 * - 이벤트 소싱(Event Sourcing)의 기반
 *
 * 예시: 게시글 생성 시
 * - 이벤트 발행: PostCreatedEvent
 * - 처리자들:
 *   - 이메일 핸들러: 작성자에게 확인 이메일 전송
 *   - 통계 핸들러: 게시글 수 통계 업데이트
 *   - 캐시 핸들러: 목록 캐시 무효화
 *   - 알림 핸들러: 구독자에게 푸시 알림
 */

/**
 * 도메인 이벤트 기본 인터페이스
 */
export interface DomainEvent {
  readonly occurredOn: Date;      // 이벤트 발생 시간
  readonly eventName: string;     // 이벤트 이름 (타입 식별)
}

/**
 * PostCreatedEvent
 * ================
 * 게시글이 생성되었을 때 발행되는 이벤트
 *
 * 포함 데이터:
 * - 최소한의 데이터만 포함 (이벤트는 가볍게)
 * - 핸들러에서 필요하면 Repository로 추가 조회
 */
export class PostCreatedEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly eventName = 'PostCreated';

  constructor(
    readonly postId: number,
    readonly title: string,
    readonly authorId: number,
    readonly authorEmail: string,
  ) {
    this.occurredOn = new Date();
  }
}

/**
 * PostPublishedEvent
 * ==================
 * 게시글이 공개 상태로 변경되었을 때
 */
export class PostPublishedEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly eventName = 'PostPublished';

  constructor(
    readonly postId: number,
    readonly title: string,
    readonly authorId: number,
  ) {
    this.occurredOn = new Date();
  }
}

/**
 * PostDeletedEvent
 */
export class PostDeletedEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly eventName = 'PostDeleted';

  constructor(
    readonly postId: number,
    readonly deletedBy: number,
  ) {
    this.occurredOn = new Date();
  }
}

/**
 * 도메인 이벤트 발행 예시
 * =======================
 *
 * // Post 엔티티 내부
 * export class Post {
 *   private domainEvents: DomainEvent[] = [];
 *
 *   publish(): void {
 *     if (this.published) throw new Error('이미 공개된 게시글입니다');
 *     this.published = true;
 *     // 이벤트 등록 (즉시 발행하지 않음)
 *     this.domainEvents.push(new PostPublishedEvent(this.id, this.title.value, this.authorId));
 *   }
 *
 *   pullDomainEvents(): DomainEvent[] {
 *     const events = [...this.domainEvents];
 *     this.domainEvents = []; // 이벤트 클리어
 *     return events;
 *   }
 * }
 *
 * // Use Case에서 이벤트 발행
 * const events = post.pullDomainEvents();
 * await this.eventBus.publishAll(events);
 */
