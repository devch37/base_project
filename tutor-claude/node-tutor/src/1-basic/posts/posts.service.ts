/**
 * ============================================
 * Posts Service - 게시글 비즈니스 로직
 * ============================================
 *
 * 실제 CRUD 작업을 수행하는 Service 예제
 * - 데이터 생성, 조회, 수정, 삭제
 * - 비즈니스 규칙 적용
 * - 에러 처리
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  /**
   * 인메모리 데이터 저장소
   * - 실제로는 데이터베이스 사용
   * - 학습 목적으로 배열 사용
   */
  private posts: Post[] = [];
  private currentId: number = 1;

  /**
   * 생성자
   * - 초기 데이터 세팅 (데모용)
   */
  constructor() {
    // 샘플 데이터 추가
    this.posts.push(
      new Post({
        id: this.currentId++,
        title: 'NestJS 시작하기',
        content: 'NestJS는 Node.js 프레임워크입니다.',
        authorId: 1,
        published: true,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Post({
        id: this.currentId++,
        title: 'TypeScript 완벽 가이드',
        content: 'TypeScript는 JavaScript의 슈퍼셋입니다.',
        authorId: 1,
        published: true,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  }

  /**
   * 모든 게시글 조회
   * ===============
   *
   * @returns 모든 게시글 배열
   *
   * 실전에서는:
   * - 페이지네이션 추가
   * - 정렬 옵션 제공
   * - 필터링 기능
   */
  async findAll(): Promise<Post[]> {
    // 비동기 작업 시뮬레이션
    return Promise.resolve(this.posts);
  }

  /**
   * 특정 게시글 조회
   * ===============
   *
   * @param id 게시글 ID
   * @returns 조회된 게시글
   * @throws NotFoundException 게시글이 없을 때
   *
   * 핵심: 없으면 예외를 던져서 Controller나 Filter가 처리하도록
   */
  async findOne(id: number): Promise<Post> {
    const post = this.posts.find((p) => p.id === id);

    if (!post) {
      /**
       * NotFoundException
       * - NestJS 내장 HTTP 예외
       * - 자동으로 404 상태 코드로 변환됨
       */
      throw new NotFoundException(`ID ${id}번 게시글을 찾을 수 없습니다.`);
    }

    // 조회수 증가
    post.viewCount++;

    return post;
  }

  /**
   * 게시글 생성
   * ===========
   *
   * @param createPostDto 생성할 게시글 데이터
   * @returns 생성된 게시글
   *
   * 비즈니스 로직:
   * - 자동으로 ID 할당
   * - 생성/수정 일시 설정
   * - 기본값 설정 (published, viewCount)
   */
  async create(createPostDto: CreatePostDto): Promise<Post> {
    // 데이터 검증
    if (!createPostDto.title || createPostDto.title.trim() === '') {
      throw new BadRequestException('제목은 필수입니다.');
    }

    if (!createPostDto.content || createPostDto.content.trim() === '') {
      throw new BadRequestException('내용은 필수입니다.');
    }

    // 새 게시글 생성
    const newPost = new Post({
      id: this.currentId++,
      title: createPostDto.title,
      content: createPostDto.content,
      authorId: createPostDto.authorId,
      published: createPostDto.published ?? false,  // 기본값: false
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.posts.push(newPost);

    console.log(`✅ 게시글 생성됨: ID ${newPost.id}, 제목: ${newPost.title}`);

    return newPost;
  }

  /**
   * 게시글 수정
   * ===========
   *
   * @param id 수정할 게시글 ID
   * @param updatePostDto 수정할 데이터
   * @returns 수정된 게시글
   * @throws NotFoundException 게시글이 없을 때
   *
   * 부분 업데이트 (Partial Update):
   * - 전달된 필드만 수정
   * - 나머지 필드는 유지
   */
  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);  // 없으면 예외 발생

    // 전달된 필드만 업데이트
    if (updatePostDto.title !== undefined) {
      post.title = updatePostDto.title;
    }

    if (updatePostDto.content !== undefined) {
      post.content = updatePostDto.content;
    }

    if (updatePostDto.published !== undefined) {
      post.published = updatePostDto.published;
    }

    // 수정 일시 갱신
    post.updatedAt = new Date();

    console.log(`✅ 게시글 수정됨: ID ${id}`);

    return post;
  }

  /**
   * 게시글 삭제
   * ===========
   *
   * @param id 삭제할 게시글 ID
   * @throws NotFoundException 게시글이 없을 때
   *
   * Soft Delete vs Hard Delete:
   * - Hard Delete: 실제로 데이터 삭제 (이 예제)
   * - Soft Delete: deletedAt 필드만 설정 (실전 권장)
   */
  async remove(id: number): Promise<void> {
    const index = this.posts.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new NotFoundException(`ID ${id}번 게시글을 찾을 수 없습니다.`);
    }

    this.posts.splice(index, 1);

    console.log(`🗑️  게시글 삭제됨: ID ${id}`);
  }

  /**
   * 특정 사용자의 게시글 조회
   * =========================
   *
   * @param authorId 작성자 ID
   * @returns 작성자의 게시글 목록
   *
   * 추가 비즈니스 로직 예제
   */
  async findByAuthor(authorId: number): Promise<Post[]> {
    return this.posts.filter((post) => post.authorId === authorId);
  }

  /**
   * 게시된 게시글만 조회
   * ====================
   *
   * @returns 공개된 게시글 목록
   */
  async findPublished(): Promise<Post[]> {
    return this.posts.filter((post) => post.published === true);
  }

  /**
   * 게시글 검색
   * ===========
   *
   * @param keyword 검색 키워드
   * @returns 검색 결과
   *
   * 간단한 검색 구현
   */
  async search(keyword: string): Promise<Post[]> {
    if (!keyword || keyword.trim() === '') {
      return this.posts;
    }

    const lowerKeyword = keyword.toLowerCase();

    return this.posts.filter(
      (post) =>
        post.title.toLowerCase().includes(lowerKeyword) ||
        post.content.toLowerCase().includes(lowerKeyword),
    );
  }

  /**
   * 페이지네이션
   * ============
   *
   * @param page 페이지 번호 (1부터 시작)
   * @param limit 페이지당 항목 수
   * @returns 페이지네이션 결과
   *
   * 실전에서 필수적인 기능
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Post[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // 페이지 번호는 1부터 시작
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const data = this.posts.slice(startIndex, endIndex);
    const total = this.posts.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

/**
 * Service 작성 체크리스트
 * =======================
 *
 * ✅ @Injectable() 데코레이터 추가
 * ✅ async/await 사용 (데이터베이스 작업은 비동기)
 * ✅ 적절한 예외 던지기 (NotFoundException, BadRequestException 등)
 * ✅ 로깅 추가 (중요한 작업 기록)
 * ✅ 입력 검증
 * ✅ 명확한 메서드 이름과 주석
 */

/**
 * 실전 데이터베이스 연동 예제 (TypeORM)
 * ====================================
 *
 * import { Injectable, NotFoundException } from '@nestjs/common';
 * import { InjectRepository } from '@nestjs/typeorm';
 * import { Repository } from 'typeorm';
 * import { Post } from './post.entity';
 *
 * @Injectable()
 * export class PostsService {
 *   constructor(
 *     @InjectRepository(Post)
 *     private readonly postRepository: Repository<Post>,
 *   ) {}
 *
 *   async findAll(): Promise<Post[]> {
 *     return this.postRepository.find();
 *   }
 *
 *   async findOne(id: number): Promise<Post> {
 *     const post = await this.postRepository.findOne({ where: { id } });
 *     if (!post) {
 *       throw new NotFoundException(`Post with ID ${id} not found`);
 *     }
 *     return post;
 *   }
 *
 *   async create(createPostDto: CreatePostDto): Promise<Post> {
 *     const post = this.postRepository.create(createPostDto);
 *     return this.postRepository.save(post);
 *   }
 *
 *   async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
 *     await this.postRepository.update(id, updatePostDto);
 *     return this.findOne(id);
 *   }
 *
 *   async remove(id: number): Promise<void> {
 *     const result = await this.postRepository.delete(id);
 *     if (result.affected === 0) {
 *       throw new NotFoundException(`Post with ID ${id} not found`);
 *     }
 *   }
 * }
 */
