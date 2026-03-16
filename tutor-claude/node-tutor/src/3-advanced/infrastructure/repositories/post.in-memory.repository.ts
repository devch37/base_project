/**
 * ============================================
 * Post In-Memory Repository - 메모리 저장소 구현체
 * ============================================
 *
 * Infrastructure Layer의 역할:
 * - Domain이 정의한 IPostRepository 인터페이스 구현
 * - 실제 데이터 저장/조회 로직
 * - 여기서는 InMemory (배열), 실무에서는 TypeORM, Prisma 등
 *
 * 핵심 포인트:
 * - Domain Entity를 그대로 저장 (이 예제)
 * - 실무에서는 Domain Entity ↔ DB Entity 매핑 필요
 *
 * 테스트에서의 장점:
 * - 실제 DB 없이도 Application 로직 테스트 가능
 * - 빠른 테스트 실행
 * - 격리된 단위 테스트
 */

import { Injectable } from '@nestjs/common';
import { Post } from '../../domain/entities/post.entity';
import {
  IPostRepository,
  PostFindOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/post.repository.interface';

@Injectable()
export class PostInMemoryRepository implements IPostRepository {
  /**
   * 인메모리 저장소
   * - Map: id → Post (빠른 ID 조회)
   */
  private readonly store = new Map<number, Post>();
  private idCounter = 1;

  constructor() {
    // 샘플 데이터 초기화
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const sample1 = Post.create({
      id: this.idCounter++,
      title: 'Clean Architecture 이해하기',
      content: 'Clean Architecture는 소프트웨어를 계층으로 분리하여 각 계층이 독립적으로 테스트 가능하고 유지보수하기 쉽게 만드는 아키텍처 패턴입니다.',
      authorId: 1,
      authorEmail: 'admin@example.com',
      tags: ['clean-architecture', 'design'],
    });
    sample1.publish();
    sample1.pullDomainEvents(); // 이벤트 클리어
    this.store.set(sample1.id, sample1);

    const sample2 = Post.create({
      id: this.idCounter++,
      title: 'DDD (Domain-Driven Design) 실전 적용',
      content: 'DDD는 복잡한 비즈니스 로직을 도메인 모델 중심으로 설계하는 방법론입니다. Entity, Value Object, Aggregate, Repository 등의 개념을 이해해봅시다.',
      authorId: 1,
      authorEmail: 'admin@example.com',
      tags: ['ddd', 'domain-driven-design'],
    });
    sample2.publish();
    sample2.pullDomainEvents();
    this.store.set(sample2.id, sample2);
  }

  async findById(id: number): Promise<Post | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(options?: PostFindOptions): Promise<Post[]> {
    let posts = Array.from(this.store.values());

    // 기본적으로 삭제된 게시글 제외
    if (!options?.includeDeleted) {
      posts = posts.filter((p) => !p.isDeleted);
    }

    if (options?.authorId !== undefined) {
      posts = posts.filter((p) => p.authorId === options.authorId);
    }

    if (options?.published !== undefined) {
      posts = posts.filter((p) => p.published === options.published);
    }

    if (options?.tags && options.tags.length > 0) {
      posts = posts.filter((p) =>
        options.tags!.some((tag) => p.tags.includes(tag)),
      );
    }

    if (options?.keyword) {
      const lower = options.keyword.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.value.toLowerCase().includes(lower) ||
          p.content.value.toLowerCase().includes(lower),
      );
    }

    // 최신순 정렬
    return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findWithPagination(
    options: PostFindOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Post>> {
    const all = await this.findAll(options);
    const total = all.length;
    const { page, limit } = pagination;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = all.slice(start, start + limit);

    return { data, total, page, limit, totalPages };
  }

  async save(post: Post): Promise<Post> {
    this.store.set(post.id, post);
    return post;
  }

  async update(post: Post): Promise<Post> {
    if (!this.store.has(post.id)) {
      throw new Error(`Post ID ${post.id} not found in store`);
    }
    this.store.set(post.id, post);
    return post;
  }

  async delete(id: number): Promise<void> {
    this.store.delete(id);
  }

  async exists(id: number): Promise<boolean> {
    return this.store.has(id);
  }

  async nextId(): Promise<number> {
    return this.idCounter++;
  }
}

/**
 * TypeORM 구현체 예시 (참고)
 * ===========================
 *
 * @Injectable()
 * export class PostTypeormRepository implements IPostRepository {
 *   constructor(
 *     @InjectRepository(PostOrmEntity)
 *     private readonly ormRepo: Repository<PostOrmEntity>,
 *     private readonly mapper: PostMapper,
 *   ) {}
 *
 *   async findById(id: number): Promise<Post | null> {
 *     const orm = await this.ormRepo.findOne({ where: { id } });
 *     return orm ? this.mapper.toDomain(orm) : null;
 *   }
 *
 *   async save(post: Post): Promise<Post> {
 *     const orm = this.mapper.toOrm(post);
 *     const saved = await this.ormRepo.save(orm);
 *     return this.mapper.toDomain(saved);
 *   }
 *   // ...
 * }
 *
 * 이렇게 하면 DB 교체 시 이 파일만 변경하면 됨!
 */
