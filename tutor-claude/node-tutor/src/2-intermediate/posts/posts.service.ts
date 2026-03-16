/**
 * ============================================
 * Posts Service - 게시글 서비스 (Intermediate)
 * ============================================
 *
 * 1단계 대비 추가된 내용:
 * - 소유자 검증 (본인 게시글만 수정/삭제)
 * - Soft Delete 패턴
 * - 좋아요 기능
 * - 태그 기반 검색
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  private posts: Post[] = [];
  private currentId = 1;

  constructor() {
    // 샘플 데이터
    this.posts.push(
      new Post({
        id: this.currentId++,
        title: 'NestJS Middleware 완벽 가이드',
        content: 'NestJS Middleware는 요청과 응답 사이에서 실행되는 함수입니다. 로깅, 인증 검증 등에 활용됩니다.',
        authorId: 1,
        published: true,
        tags: ['nestjs', 'middleware', 'tutorial'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Post({
        id: this.currentId++,
        title: 'JWT 인증 구현하기',
        content: 'JWT(JSON Web Token)를 사용한 인증 시스템을 NestJS에서 구현하는 방법을 알아봅니다.',
        authorId: 1,
        published: true,
        tags: ['jwt', 'auth', 'nestjs'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  }

  async findAll(authorId?: number): Promise<Post[]> {
    // Soft Delete된 게시글 제외
    let posts = this.posts.filter((p) => !p.isDeleted);

    if (authorId !== undefined) {
      posts = posts.filter((p) => p.authorId === authorId);
    }

    return posts;
  }

  async findOne(id: number): Promise<Post> {
    const post = this.posts.find((p) => p.id === id && !p.isDeleted);

    if (!post) {
      throw new NotFoundException(`ID ${id}번 게시글을 찾을 수 없습니다`);
    }

    post.viewCount++;
    return post;
  }

  async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    // DTO 검증
    const errors = CreatePostDto.validate({ ...createPostDto, authorId });
    if (errors.length > 0) {
      throw new BadRequestException({ message: '입력값 검증 실패', errors });
    }

    const post = new Post({
      id: this.currentId++,
      title: createPostDto.title.trim(),
      content: createPostDto.content.trim(),
      authorId,
      published: createPostDto.published ?? false,
      tags: createPostDto.tags ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.posts.push(post);
    return post;
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    requestUserId: number,
  ): Promise<Post> {
    const post = await this.findOne(id);

    /**
     * 소유자 검증
     * - 본인 게시글만 수정 가능
     * - 실무에서는 admin 역할을 가진 사용자도 수정 허용하는 경우 많음
     */
    if (post.authorId !== requestUserId) {
      throw new ForbiddenException('본인 게시글만 수정할 수 있습니다');
    }

    // DTO 검증
    const errors = UpdatePostDto.validate(updatePostDto);
    if (errors.length > 0) {
      throw new BadRequestException({ message: '입력값 검증 실패', errors });
    }

    if (updatePostDto.title !== undefined) post.title = updatePostDto.title.trim();
    if (updatePostDto.content !== undefined) post.content = updatePostDto.content.trim();
    if (updatePostDto.published !== undefined) post.published = updatePostDto.published;
    if (updatePostDto.tags !== undefined) post.tags = updatePostDto.tags;

    post.updatedAt = new Date();
    return post;
  }

  /**
   * Soft Delete
   * ===========
   * 실제로 데이터를 삭제하지 않고 isDeleted 플래그만 설정
   */
  async remove(id: number, requestUserId: number): Promise<void> {
    const post = await this.findOne(id);

    if (post.authorId !== requestUserId) {
      throw new ForbiddenException('본인 게시글만 삭제할 수 있습니다');
    }

    // Soft Delete
    post.isDeleted = true;
    post.deletedAt = new Date();
  }

  /**
   * 좋아요 토글
   */
  async like(id: number): Promise<{ likes: number }> {
    const post = await this.findOne(id);
    post.likes++;
    return { likes: post.likes };
  }

  /**
   * 태그 기반 검색
   */
  async findByTag(tag: string): Promise<Post[]> {
    return this.posts.filter(
      (p) => !p.isDeleted && p.published && p.tags.includes(tag),
    );
  }

  /**
   * 키워드 검색
   */
  async search(keyword: string): Promise<Post[]> {
    const lower = keyword.toLowerCase();
    return this.posts.filter(
      (p) =>
        !p.isDeleted &&
        (p.title.toLowerCase().includes(lower) ||
          p.content.toLowerCase().includes(lower)),
    );
  }

  /**
   * Admin용: 삭제된 게시글 포함 전체 조회
   */
  async findAllIncludeDeleted(): Promise<Post[]> {
    return this.posts;
  }
}
