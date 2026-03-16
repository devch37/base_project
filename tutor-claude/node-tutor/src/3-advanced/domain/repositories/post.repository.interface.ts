/**
 * ============================================
 * Post Repository Interface - 게시글 저장소 인터페이스
 * ============================================
 *
 * Repository Pattern이란?
 * - 데이터 접근 로직을 추상화
 * - Domain 계층은 인터페이스만 알고, 구현은 Infrastructure 계층에서
 * - 덕분에 Domain이 데이터베이스 종류에 독립적
 *
 * Clean Architecture 의존성 규칙:
 * - Domain이 Repository 인터페이스 정의
 * - Infrastructure가 Repository 구현
 * - Domain은 Infrastructure를 모름!
 *
 * 이점:
 * - 테스트 시 InMemory 구현체로 교체 가능
 * - DB 교체 시 Infrastructure만 변경
 * - 비즈니스 로직이 DB 상세에 오염되지 않음
 *
 * ┌──────────────────────────────────────────┐
 * │  Domain Layer                            │
 * │  IPostRepository (인터페이스 정의)         │
 * └──────────────────┬───────────────────────┘
 *                    │ implements
 * ┌──────────────────▼───────────────────────┐
 * │  Infrastructure Layer                    │
 * │  PostInMemoryRepository (메모리 구현)     │
 * │  PostTypeormRepository (TypeORM 구현)    │
 * │  PostMongoRepository (MongoDB 구현)      │
 * └──────────────────────────────────────────┘
 */

import { Post } from '../entities/post.entity';

/**
 * 조회 조건 (Query Criteria)
 */
export interface PostFindOptions {
  authorId?: number;
  published?: boolean;
  tags?: string[];
  keyword?: string;
  includeDeleted?: boolean;
}

/**
 * 페이지네이션 옵션
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * 페이지네이션 결과
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * IPostRepository 인터페이스
 * ==========================
 * - 'I' 접두사: Interface임을 표시 (관례)
 * - Domain에서 정의, Infrastructure에서 구현
 */
export interface IPostRepository {
  /**
   * ID로 게시글 조회
   * @returns Post | null (없으면 null)
   */
  findById(id: number): Promise<Post | null>;

  /**
   * 조건으로 게시글 목록 조회
   */
  findAll(options?: PostFindOptions): Promise<Post[]>;

  /**
   * 페이지네이션 조회
   */
  findWithPagination(
    options: PostFindOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Post>>;

  /**
   * 게시글 저장 (생성)
   * @returns 저장된 게시글 (ID 할당 후)
   */
  save(post: Post): Promise<Post>;

  /**
   * 게시글 수정
   */
  update(post: Post): Promise<Post>;

  /**
   * 게시글 삭제 (실제 삭제)
   */
  delete(id: number): Promise<void>;

  /**
   * 존재 여부 확인
   */
  exists(id: number): Promise<boolean>;

  /**
   * 다음 ID 생성
   * (실무에서는 DB의 auto-increment나 UUID 사용)
   */
  nextId(): Promise<number>;
}

/**
 * DI 토큰
 * =======
 * NestJS에서 인터페이스를 DI 토큰으로 사용할 때 필요
 * (TypeScript 인터페이스는 런타임에 존재하지 않음)
 *
 * 사용 예:
 * providers: [
 *   { provide: POST_REPOSITORY, useClass: PostInMemoryRepository }
 * ]
 *
 * 주입 시:
 * constructor(@Inject(POST_REPOSITORY) private postRepo: IPostRepository) {}
 */
export const POST_REPOSITORY = 'POST_REPOSITORY';
