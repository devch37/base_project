/**
 * ============================================
 * Posts Controller - 게시글 API 엔드포인트
 * ============================================
 *
 * RESTful API 설계
 * - GET: 조회
 * - POST: 생성
 * - PUT/PATCH: 수정
 * - DELETE: 삭제
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity } from './post.entity';

/**
 * @Controller('posts')
 * - /api/posts 경로로 들어오는 요청 처리
 * - main.ts에서 setGlobalPrefix('api') 설정했으므로
 *   실제 경로는 /api/posts
 */
@Controller('posts')
export class PostsController {
  /**
   * 의존성 주입
   * - PostsService를 주입받아 비즈니스 로직 위임
   */
  constructor(private readonly postsService: PostsService) {}

  /**
   * 모든 게시글 조회
   * ===============
   *
   * GET /api/posts
   * GET /api/posts?page=1&limit=10
   * GET /api/posts?keyword=nestjs
   *
   * @Query() 데코레이터로 쿼리 파라미터 추출
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('keyword') keyword?: string,
  ): Promise<PostEntity[] | any> {
    // 검색 기능
    if (keyword) {
      return this.postsService.search(keyword);
    }

    // 페이지네이션
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      return this.postsService.findWithPagination(pageNum, limitNum);
    }

    // 전체 조회
    return this.postsService.findAll();
  }

  /**
   * 공개된 게시글만 조회
   * ===================
   *
   * GET /api/posts/published
   *
   * ⚠️ 주의: 이 라우트는 @Get(':id')보다 위에 있어야 함!
   * 그렇지 않으면 'published'가 id로 인식됨
   */
  @Get('published')
  async findPublished(): Promise<PostEntity[]> {
    return this.postsService.findPublished();
  }

  /**
   * 특정 게시글 조회
   * ===============
   *
   * GET /api/posts/1
   * GET /api/posts/123
   *
   * @Param('id') 데코레이터로 URL 파라미터 추출
   * ParseIntPipe: 문자열을 숫자로 자동 변환 및 검증
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PostEntity> {
    /**
     * ParseIntPipe의 동작:
     * - URL의 :id를 number로 변환
     * - 숫자가 아니면 자동으로 400 Bad Request 응답
     * - 예: /api/posts/abc -> 400 에러
     */
    return this.postsService.findOne(id);
  }

  /**
   * 특정 사용자의 게시글 조회
   * ========================
   *
   * GET /api/posts/author/1
   */
  @Get('author/:authorId')
  async findByAuthor(
    @Param('authorId', ParseIntPipe) authorId: number,
  ): Promise<PostEntity[]> {
    return this.postsService.findByAuthor(authorId);
  }

  /**
   * 게시글 생성
   * ===========
   *
   * POST /api/posts
   * Content-Type: application/json
   *
   * Request Body:
   * {
   *   "title": "게시글 제목",
   *   "content": "게시글 내용",
   *   "authorId": 1,
   *   "published": false
   * }
   *
   * @Body() 데코레이터로 요청 본문 추출
   * @HttpCode()로 성공 시 상태 코드 명시
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)  // 201 Created
  async create(
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostEntity> {
    /**
     * @Body()의 동작:
     * - HTTP 요청의 body를 CreatePostDto 타입으로 변환
     * - ValidationPipe와 함께 사용하면 자동 검증
     *
     * 검증 활성화 (main.ts):
     * app.useGlobalPipes(new ValidationPipe());
     */
    return this.postsService.create(createPostDto);
  }

  /**
   * 게시글 수정
   * ===========
   *
   * PUT /api/posts/1
   * Content-Type: application/json
   *
   * Request Body:
   * {
   *   "title": "수정된 제목",
   *   "content": "수정된 내용"
   * }
   *
   * PUT vs PATCH:
   * - PUT: 전체 교체 (모든 필드 필요)
   * - PATCH: 부분 수정 (일부 필드만)
   * - 실무에서는 대부분 PATCH 사용
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.update(id, updatePostDto);
  }

  /**
   * 게시글 삭제
   * ===========
   *
   * DELETE /api/posts/1
   *
   * @HttpCode(204): 성공 시 본문 없이 204 No Content 반환
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)  // 204 No Content
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.postsService.remove(id);
  }

  /**
   * 게시글 통계
   * ===========
   *
   * GET /api/posts/stats/summary
   *
   * 추가 기능 예제
   */
  @Get('stats/summary')
  async getStats(): Promise<object> {
    const allPosts = await this.postsService.findAll();

    return {
      total: allPosts.length,
      published: allPosts.filter(p => p.published).length,
      draft: allPosts.filter(p => !p.published).length,
      totalViews: allPosts.reduce((sum, p) => sum + p.viewCount, 0),
    };
  }
}

/**
 * HTTP 메서드와 상태 코드
 * =======================
 *
 * GET    - 조회    - 200 OK
 * POST   - 생성    - 201 Created
 * PUT    - 전체수정 - 200 OK
 * PATCH  - 부분수정 - 200 OK
 * DELETE - 삭제    - 204 No Content
 *
 * 에러 상태 코드:
 * 400 Bad Request     - 잘못된 요청
 * 401 Unauthorized    - 인증 필요
 * 403 Forbidden       - 권한 없음
 * 404 Not Found       - 리소스 없음
 * 409 Conflict        - 충돌 (중복 등)
 * 500 Internal Server - 서버 에러
 */

/**
 * 데코레이터 정리
 * ==============
 *
 * 클래스 데코레이터:
 * - @Controller(prefix)
 *
 * 메서드 데코레이터:
 * - @Get(path), @Post(path), @Put(path), @Delete(path), @Patch(path)
 * - @HttpCode(code)
 * - @Header(name, value)
 * - @Redirect(url, statusCode)
 *
 * 매개변수 데코레이터:
 * - @Body()        - 요청 본문 전체
 * - @Body('field') - 요청 본문의 특정 필드
 * - @Param()       - URL 파라미터 전체
 * - @Param('id')   - 특정 URL 파라미터
 * - @Query()       - 쿼리 파라미터 전체
 * - @Query('name') - 특정 쿼리 파라미터
 * - @Headers()     - HTTP 헤더
 * - @Req()         - Request 객체
 * - @Res()         - Response 객체
 */

/**
 * Pipe (파이프) - 데이터 변환 및 검증
 * =================================
 *
 * 내장 Pipe:
 * - ParseIntPipe     - 문자열 → 숫자
 * - ParseBoolPipe    - 문자열 → boolean
 * - ParseArrayPipe   - 문자열 → 배열
 * - ParseUUIDPipe    - UUID 검증
 * - ValidationPipe   - DTO 검증
 *
 * 사용 예:
 * @Param('id', ParseIntPipe) id: number
 * @Query('active', ParseBoolPipe) active: boolean
 */

/**
 * 실전 팁
 * =======
 *
 * 1. 라우트 순서 중요
 *    - 구체적인 라우트를 먼저 선언
 *    - @Get('published') 는 @Get(':id') 보다 위에
 *
 * 2. DTO 사용
 *    - 모든 요청/응답에 DTO 사용
 *    - 타입 안정성과 검증 확보
 *
 * 3. 상태 코드 명시
 *    - 성공 시 적절한 상태 코드 반환
 *    - RESTful 컨벤션 준수
 *
 * 4. 에러는 Service에서 처리
 *    - Controller는 얇게 유지
 *    - Service에서 예외 던지기
 *
 * 5. 비동기 처리
 *    - 모든 메서드를 async로 선언
 *    - await로 Service 메서드 호출
 */

/**
 * cURL 테스트 명령어
 * =================
 *
 * # 전체 조회
 * curl http://localhost:3000/api/posts
 *
 * # 특정 게시글 조회
 * curl http://localhost:3000/api/posts/1
 *
 * # 게시글 생성
 * curl -X POST http://localhost:3000/api/posts \
 *   -H "Content-Type: application/json" \
 *   -d '{"title":"새 게시글","content":"내용입니다","authorId":1}'
 *
 * # 게시글 수정
 * curl -X PUT http://localhost:3000/api/posts/1 \
 *   -H "Content-Type: application/json" \
 *   -d '{"title":"수정된 제목"}'
 *
 * # 게시글 삭제
 * curl -X DELETE http://localhost:3000/api/posts/1
 *
 * # 검색
 * curl "http://localhost:3000/api/posts?keyword=nestjs"
 *
 * # 페이지네이션
 * curl "http://localhost:3000/api/posts?page=1&limit=5"
 */
