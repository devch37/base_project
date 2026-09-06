# 12. 테스트 — unit과 e2e

## 두 종류

| | 단위 테스트 (unit) | e2e 테스트 |
|--|-------------------|-----------|
| 대상 | 클래스 하나 (서비스/가드) | 앱 전체 (HTTP 요청 → DB → 응답) |
| 의존성 | 전부 mock | 실제 (DB는 인메모리) |
| 속도 | 매우 빠름 (ms) | 느림 (부팅 필요) |
| 개수 | 많이 | 핵심 흐름만 |
| 파일 | `*.spec.ts` (src 안) | `*.e2e-spec.ts` (test/) |

```bash
npm test              # 단위
npm run test:e2e      # e2e
npm run test:cov      # 커버리지
```

---

## 단위 테스트 — `Test.createTestingModule`

이게 미니 DI 컨테이너입니다. 실제 의존성 대신 mock을 `useValue` 로 주입합니다.

### `src/modules/users/users.service.spec.ts`

```ts
const repo = {
  exists: jest.fn(),
  create: jest.fn((dto) => dto),
  save: jest.fn((e) => Promise.resolve({ id: 1, ...e })),
  findOne: jest.fn(),
  delete: jest.fn(),
};
const hashing = { hash: jest.fn().mockResolvedValue('hashed-pw'), compare: jest.fn() };

beforeEach(async () => {
  jest.clearAllMocks();
  const moduleRef = await Test.createTestingModule({
    providers: [
      UsersService,
      { provide: getRepositoryToken(User), useValue: repo },   // ← Repository mock
      { provide: HashingService, useValue: hashing },
    ],
  }).compile();
  service = moduleRef.get(UsersService);
});

it('이메일 중복이면 ConflictException', async () => {
  repo.exists.mockResolvedValue(true);
  await expect(service.create({ ... })).rejects.toBeInstanceOf(ConflictException);
  expect(repo.save).not.toHaveBeenCalled();
});
```

포인트:
- `getRepositoryToken(User)` — TypeORM Repository의 주입 토큰
- `jest.clearAllMocks()` in `beforeEach` — 테스트 간 격리
- 검증 방식: 반환값 확인 + "무엇이 호출/미호출 되었는지"(`toHaveBeenCalledWith`)

### 가드 테스트 — `src/common/guards/roles.guard.spec.ts`

가드는 순수 로직이라 Nest 컨테이너 없이 `new RolesGuard(fakeReflector)` 로 바로 테스트합니다.
`ExecutionContext` 를 최소한만 흉내:
```ts
function mockContext(user) {
  return {
    getHandler: () => ({}), getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}
```

### `src/modules/auth/auth.service.spec.ts`

`UsersService`, `JwtService`, `HashingService`, `MailerService`, 그리고 `jwtConfig.KEY` 까지
전부 mock. "로그인 실패 → 401", "성공 → 토큰 2개 + 리프레시 해시 저장" 을 검증합니다.

---

## e2e 테스트 — `test/app.e2e-spec.ts`

실제 앱을 띄우고 `supertest` 로 HTTP 요청을 보냅니다.

```ts
beforeAll(async () => {
  // AppModule import 전에 env를 인메모리 DB로
  process.env.DB_DATABASE = ':memory:';
  process.env.DB_SYNCHRONIZE = 'true';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

  const { AppModule } = await import('../src/app.module');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));  // main.ts와 동일하게!
  await app.init();
});
```

> ⚠️ e2e에서 `main.ts` 의 전역 설정(파이프/프리픽스)을 **다시 적용**해야 합니다.
> `createNestApplication()` 은 `main.ts` 의 `bootstrap()` 을 실행하지 않으니까요.

테스트하는 흐름:
```ts
it('회원가입 → 201 + 토큰', () => request(app.getHttpServer())
  .post('/api/auth/register').send({...}).expect(201));

it('중복 이메일 → 409', ...);
it('검증 실패 → 400 + 메시지 배열', ...);
it('토큰 없이 글 작성 → 401', ...);
it('토큰 있으면 → 201', ...);
it('공개 목록 조회 → 200 + meta', ...);
it('남의 글 삭제 → 403', ...);      // ← 소유권 인가까지 검증
```

인메모리 SQLite라 각 테스트 실행이 격리되고 빠릅니다.

---

## 무엇을 테스트할까 (우선순위)

1. **비즈니스 규칙**: "이메일 중복이면 실패", "본인 글만 삭제", "재고보다 많이 주문 불가"
2. **인가 경계**: 권한 없는 사용자가 막히는지 (e2e에서)
3. **에러 경로**: 404, 400, 409 가 제대로 나는지
4. **경계값**: 페이지네이션 `limit` 상한, 빈 배열, null

테스트하지 말 것: 프레임워크 자체 동작(라우팅이 되는지), getter/setter, 단순 위임.

---

## 팁

- **AAA 패턴**: Arrange(준비) → Act(실행) → Assert(검증)
- **테스트 이름은 한글로** 규칙을 서술: `it('이메일이 중복되면 ConflictException 을 던진다')`
- `--forceExit` 없이 jest가 안 끝나면 열린 핸들(스케줄러, DB 커넥션)이 있는 것 —
  `afterAll(() => app.close())` 확인
- CI에서 `npm test -- --ci --coverage` + 커버리지 임계값(`coverageThreshold`) 설정

---

## 실습

1. `posts.service.ts` 의 `upsertTags()` 단위 테스트를 작성하세요
   ("이미 있는 태그는 재사용, 없는 태그만 생성").
2. e2e에 "댓글 작성 → 목록 조회 → 남의 댓글 수정 시 403" 시나리오를 추가하세요.
3. `test:cov` 를 돌려 커버리지가 낮은 파일을 찾고, 그중 하나에 테스트를 보강하세요.

→ 다음: [13. 실무 체크리스트와 배포](./13-실무-체크리스트-배포.md)
