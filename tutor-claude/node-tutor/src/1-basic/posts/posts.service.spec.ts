/**
 * ============================================
 * Posts Service 테스트
 * ============================================
 *
 * Unit Test (단위 테스트)
 * - 개별 함수/메서드를 독립적으로 테스트
 * - Service의 비즈니스 로직을 검증
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

/**
 * describe: 테스트 스위트 (Test Suite)
 * - 관련된 테스트들을 그룹화
 */
describe('PostsService', () => {
  let service: PostsService;

  /**
   * beforeEach: 각 테스트 전에 실행
   * - 테스트 모듈 생성
   * - Service 인스턴스 초기화
   */
  beforeEach(async () => {
    /**
     * Test.createTestingModule()
     * - 테스트용 NestJS 모듈 생성
     * - 실제 모듈과 동일한 구조
     */
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostsService],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  /**
   * it: 개별 테스트 케이스
   * - 하나의 기능을 테스트
   */
  it('서비스가 정의되어야 함', () => {
    expect(service).toBeDefined();
  });

  /**
   * describe로 기능별 테스트 그룹화
   */
  describe('findAll', () => {
    it('모든 게시글을 반환해야 함', async () => {
      const posts = await service.findAll();

      // 초기 데이터 2개 포함
      expect(posts).toBeDefined();
      expect(posts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findOne', () => {
    it('특정 게시글을 반환해야 함', async () => {
      const post = await service.findOne(1);

      expect(post).toBeDefined();
      expect(post.id).toBe(1);
      expect(post.title).toBeDefined();
    });

    it('없는 게시글 조회 시 NotFoundException 발생', async () => {
      // 존재하지 않는 ID
      await expect(service.findOne(9999)).rejects.toThrow(NotFoundException);
    });

    it('조회 시 viewCount 증가', async () => {
      const beforePost = await service.findOne(1);
      const beforeCount = beforePost.viewCount;

      const afterPost = await service.findOne(1);
      const afterCount = afterPost.viewCount;

      expect(afterCount).toBe(beforeCount + 1);
    });
  });

  describe('create', () => {
    it('새 게시글을 생성해야 함', async () => {
      const createDto: CreatePostDto = {
        title: '테스트 게시글',
        content: '테스트 내용',
        authorId: 1,
        published: false,
      };

      const post = await service.create(createDto);

      expect(post).toBeDefined();
      expect(post.id).toBeDefined();
      expect(post.title).toBe(createDto.title);
      expect(post.content).toBe(createDto.content);
      expect(post.published).toBe(false);
      expect(post.viewCount).toBe(0);
    });

    it('published 기본값은 false', async () => {
      const createDto: CreatePostDto = {
        title: '테스트',
        content: '내용',
        authorId: 1,
      };

      const post = await service.create(createDto);

      expect(post.published).toBe(false);
    });
  });

  describe('update', () => {
    it('게시글을 수정해야 함', async () => {
      // 먼저 게시글 생성
      const createDto: CreatePostDto = {
        title: '원본 제목',
        content: '원본 내용',
        authorId: 1,
      };
      const created = await service.create(createDto);

      // 수정
      const updateDto = {
        title: '수정된 제목',
      };
      const updated = await service.update(created.id, updateDto);

      expect(updated.title).toBe('수정된 제목');
      expect(updated.content).toBe('원본 내용'); // 변경 안 됨
    });

    it('없는 게시글 수정 시 NotFoundException 발생', async () => {
      await expect(
        service.update(9999, { title: '수정' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('게시글을 삭제해야 함', async () => {
      // 게시글 생성
      const createDto: CreatePostDto = {
        title: '삭제될 게시글',
        content: '내용',
        authorId: 1,
      };
      const created = await service.create(createDto);

      // 삭제
      await service.remove(created.id);

      // 삭제 후 조회하면 에러
      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
    });

    it('없는 게시글 삭제 시 NotFoundException 발생', async () => {
      await expect(service.remove(9999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('키워드로 게시글을 검색해야 함', async () => {
      const results = await service.search('NestJS');

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(p => p.title.includes('NestJS') || p.content.includes('NestJS'))
      ).toBeTruthy();
    });

    it('빈 키워드는 전체 결과 반환', async () => {
      const allPosts = await service.findAll();
      const searchResults = await service.search('');

      expect(searchResults.length).toBe(allPosts.length);
    });
  });

  describe('findWithPagination', () => {
    it('페이지네이션이 동작해야 함', async () => {
      const result = await service.findWithPagination(1, 1);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
      expect(result.totalPages).toBeGreaterThanOrEqual(2);
    });
  });
});

/**
 * 테스트 작성 가이드
 * =================
 *
 * 1. AAA 패턴
 *    - Arrange (준비): 테스트 데이터 준비
 *    - Act (실행): 테스트할 함수 실행
 *    - Assert (검증): 결과 검증
 *
 * 2. 테스트 이름
 *    - '~해야 한다' 형식으로 작성
 *    - 명확하고 구체적으로
 *
 * 3. 독립성
 *    - 각 테스트는 독립적으로 실행 가능해야 함
 *    - beforeEach로 초기화
 *
 * 4. 경계 케이스 테스트
 *    - 정상 케이스
 *    - 에러 케이스
 *    - 엣지 케이스
 */

/**
 * Jest 주요 Matcher
 * ================
 *
 * 기본:
 * - expect(value).toBe(expected)           - 같은 값/참조
 * - expect(value).toEqual(expected)        - 같은 내용
 * - expect(value).toBeDefined()            - 정의됨
 * - expect(value).toBeNull()               - null
 * - expect(value).toBeTruthy()             - truthy
 * - expect(value).toBeFalsy()              - falsy
 *
 * 숫자:
 * - expect(value).toBeGreaterThan(n)       - n보다 큼
 * - expect(value).toBeLessThan(n)          - n보다 작음
 * - expect(value).toBeCloseTo(n)           - 근사값
 *
 * 문자열:
 * - expect(str).toMatch(/pattern/)         - 정규식 매치
 * - expect(str).toContain(substr)          - 부분 문자열 포함
 *
 * 배열:
 * - expect(arr).toContain(item)            - 항목 포함
 * - expect(arr).toHaveLength(n)            - 길이
 *
 * 예외:
 * - expect(fn).toThrow()                   - 예외 발생
 * - expect(fn).toThrow(ErrorClass)         - 특정 예외
 * - await expect(promise).rejects.toThrow() - async 예외
 */

/**
 * 테스트 실행
 * ===========
 *
 * # 모든 테스트 실행
 * npm test
 *
 * # 특정 파일만
 * npm test posts.service.spec
 *
 * # Watch 모드 (자동 재실행)
 * npm run test:watch
 *
 * # 커버리지
 * npm run test:cov
 */
