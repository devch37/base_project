/**
 * ============================================================================
 * posts.service.ts — 게시글 도메인 로직
 * ----------------------------------------------------------------------------
 * 배우는 것:
 *  · QueryBuilder 로 동적 필터 + 페이지네이션
 *  · N:M(태그) 업서트 패턴
 *  · 소유권 검사(작성자 본인 또는 관리자만 수정/삭제)
 *  · 캐시 매니저로 단건 조회 캐싱 + 쓰기 시 캐시 무효화
 * ============================================================================
 */
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { In, Repository } from 'typeorm';
import { paginate, Paginated } from '../../common/dto/paginated.dto';
import { Role } from '../../common/enums/role.enum';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { Tag } from './entities/tag.entity';

interface Actor {
  id: number;
  role: Role;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
    @InjectRepository(Tag) private readonly tagsRepo: Repository<Tag>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(dto: CreatePostDto, authorId: number): Promise<Post> {
    const tags = await this.upsertTags(dto.tags ?? []);
    const post = this.postsRepo.create({
      title: dto.title,
      content: dto.content,
      published: dto.published ?? true,
      authorId,
      tags,
    });
    return this.postsRepo.save(post);
  }

  /** 동적 필터 + 페이지네이션 목록 조회 */
  async findAll(query: QueryPostsDto): Promise<Paginated<Post>> {
    const qb = this.postsRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tag');

    if (query.search) {
      qb.andWhere('(post.title LIKE :kw OR post.content LIKE :kw)', {
        kw: `%${query.search}%`,
      });
    }
    if (query.tag) {
      qb.andWhere('tag.name = :tagName', { tagName: query.tag });
    }
    if (query.authorId) {
      qb.andWhere('post.authorId = :authorId', { authorId: query.authorId });
    }

    // 화이트리스트로 정렬 컬럼 제한 (SQL 인젝션/오타 방지)
    const sortable = new Set(['createdAt', 'viewCount', 'title']);
    const sortColumn = sortable.has(query.sort) ? query.sort : 'createdAt';
    qb.orderBy(`post.${sortColumn}`, query.order);

    qb.skip(query.skip).take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, query);
  }

  /** 단건 조회 — 5초 캐시. 조회수는 캐시와 무관하게 증가시킨다. */
  async findOne(id: number, incrementView = false): Promise<Post> {
    const cacheKey = `post:${id}`;
    let post = await this.cache.get<Post>(cacheKey);

    if (!post) {
      const found = await this.postsRepo.findOne({
        where: { id },
        relations: { author: true, tags: true },
      });
      if (!found) {
        throw new NotFoundException(`게시글(#${id})을 찾을 수 없습니다.`);
      }
      post = found;
      await this.cache.set(cacheKey, post);
    }

    if (incrementView) {
      await this.postsRepo.increment({ id }, 'viewCount', 1);
      post.viewCount += 1;
    }
    return post;
  }

  async update(id: number, dto: UpdatePostDto, actor: Actor): Promise<Post> {
    const post = await this.getOwnedPost(id, actor);

    if (dto.title !== undefined) post.title = dto.title;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.published !== undefined) post.published = dto.published;
    if (dto.tags !== undefined) post.tags = await this.upsertTags(dto.tags);

    const saved = await this.postsRepo.save(post);
    await this.cache.del(`post:${id}`); // 캐시 무효화
    return saved;
  }

  async remove(id: number, actor: Actor): Promise<void> {
    const post = await this.getOwnedPost(id, actor);
    await this.postsRepo.remove(post);
    await this.cache.del(`post:${id}`);
  }

  // --- 내부 헬퍼 --------------------------------------------------------

  /** 소유권 확인: 작성자 본인 또는 관리자만 통과 */
  private async getOwnedPost(id: number, actor: Actor): Promise<Post> {
    const post = await this.postsRepo.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!post) {
      throw new NotFoundException(`게시글(#${id})을 찾을 수 없습니다.`);
    }
    const isOwner = post.authorId === actor.id;
    const isAdmin = actor.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        '본인이 작성한 게시글만 수정/삭제할 수 있습니다.',
      );
    }
    return post;
  }

  /** 태그 이름 배열 → Tag 엔티티 배열. 없는 이름은 새로 만든다. */
  private async upsertTags(names: string[]): Promise<Tag[]> {
    const unique = [
      ...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean)),
    ];
    if (unique.length === 0) return [];

    const existing = await this.tagsRepo.find({ where: { name: In(unique) } });
    const existingNames = new Set(existing.map((t) => t.name));
    const toCreate = unique
      .filter((n) => !existingNames.has(n))
      .map((name) => this.tagsRepo.create({ name }));

    const created = toCreate.length ? await this.tagsRepo.save(toCreate) : [];
    return [...existing, ...created];
  }
}
