/**
 * ============================================================================
 * app.e2e-spec.ts — 엔드투엔드 테스트
 * ----------------------------------------------------------------------------
 * 실제 앱을 (인메모리 SQLite 로) 부팅하고, HTTP 요청을 보내
 * "회원가입 → 로그인 → 글 작성 → 조회 → 권한 없는 삭제 차단" 흐름을 검증합니다.
 *
 * main.ts 와 동일한 전역 설정(ValidationPipe 등)을 여기서도 적용해야
 * 운영과 같은 조건으로 테스트됩니다.
 * ============================================================================
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

describe('게시판 API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    // AppModule 을 import 하기 "전에" 환경변수를 인메모리 DB 로 바꾼다.
    // (ConfigModule 이 이 값을 읽어 TypeORM 설정에 반영)
    process.env.DB_DATABASE = ':memory:';
    process.env.DB_SYNCHRONIZE = 'true';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    const { AppModule } = await import('../src/app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register → 201 + 토큰 발급', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'e2e@example.com',
        nickname: '이투이',
        password: 'Passw0rd!',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    accessToken = res.body.data.accessToken;
  });

  it('POST /api/auth/register → 중복 이메일이면 409', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'e2e@example.com',
        nickname: '중복',
        password: 'Passw0rd!',
      })
      .expect(409);
  });

  it('POST /api/auth/register → 검증 실패 시 400 + 메시지 배열', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-email', nickname: 'x', password: 'short' })
      .expect(400);
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('POST /api/posts → 토큰 없으면 401', async () => {
    await request(app.getHttpServer())
      .post('/api/posts')
      .send({ title: '무단', content: '작성' })
      .expect(401);
  });

  it('POST /api/posts → 토큰 있으면 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'e2e 글', content: '본문', tags: ['e2e'] })
      .expect(201);
    expect(res.body.data.title).toBe('e2e 글');
  });

  it('GET /api/posts → 공개(비인증) 접근 가능 + 페이지네이션 meta', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/posts')
      .expect(200);
    expect(res.body.data).toEqual(expect.any(Array));
    expect(res.body.meta.totalItems).toBeGreaterThanOrEqual(1);
  });

  it('DELETE /api/posts/1 → 다른 사람 글은 403', async () => {
    // 두 번째 사용자로 로그인
    const other = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'other@example.com',
        nickname: '타인',
        password: 'Passw0rd!',
      });
    const otherToken = other.body.data.accessToken;

    await request(app.getHttpServer())
      .delete('/api/posts/1')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
