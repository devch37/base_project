# 10. 캐싱 · 스케줄러 · Rate Limiting

실무에서 자주 붙이는 세 가지 부가 기능입니다.

---

## 1) 캐싱 (`@nestjs/cache-manager`)

### 등록 — `app.module.ts`

```ts
CacheModule.registerAsync({
  isGlobal: true,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({ ttl: cfg.get('cache.ttl', 5000) }),
})
```
기본은 **인메모리**입니다. 운영에서 인스턴스가 여러 개면 Redis 스토어로 교체하세요
(`@keyv/redis` 등). 그래야 캐시가 공유됩니다.

### 수동 캐싱 — `posts.service.ts` 의 `findOne()`

```ts
async findOne(id: number): Promise<Post> {
  const cacheKey = `post:${id}`;
  let post = await this.cache.get<Post>(cacheKey);

  if (!post) {
    post = await this.postsRepo.findOne({ where: { id }, relations: {...} });
    if (!post) throw new NotFoundException();
    await this.cache.set(cacheKey, post);   // 다음 요청부터 캐시 히트
  }
  return post;
}
```

### 캐시 무효화 — 쓰기 시 반드시

```ts
async update(id, dto, actor) {
  // ... 저장
  await this.cache.del(`post:${id}`);   // 오래된 캐시 제거
}
```
> **캐시의 어려움은 "무효화 타이밍"입니다.** 데이터가 바뀌는 모든 경로에서
> 관련 캐시를 지워야 합니다. 안 지우면 사용자가 옛 데이터를 봅니다.

### 자동 캐싱 — `CacheInterceptor`

GET 응답을 URL 기준으로 통째로 캐시:
```ts
@UseInterceptors(CacheInterceptor)
@CacheTTL(30_000)
@CacheKey('all_posts')   // 생략 시 URL이 키
@Get()
findAll() { ... }
```
간단하지만 세밀한 무효화가 어렵습니다. 개인화된 응답(사용자별)에는 부적합.

---

## 2) 스케줄러 (`@nestjs/schedule`)

### 등록 — `app.module.ts`

```ts
ScheduleModule.forRoot()   // 한 번만
```

### 잡 정의 — `src/modules/tasks/stats.service.ts`

```ts
@Injectable()
export class StatsService {
  @Timeout(3000)                              // 앱 시작 3초 후 1회
  async logStartupSnapshot() { ... }

  @Cron(CronExpression.EVERY_30_SECONDS, { name: 'stats-heartbeat' })
  async heartbeat() { ... }                   // cron 식

  @Interval('tick-counter', 60_000)           // 60초마다
  countTicks() { ... }
}
```

| 데코레이터 | 실행 |
|-----------|------|
| `@Cron('0 0 * * *')` | cron 식 (여기선 매일 자정) |
| `@Interval(ms)` | 고정 간격 |
| `@Timeout(ms)` | 시작 후 1회 |

`CronExpression` enum에 자주 쓰는 식이 상수로 있습니다 (`EVERY_DAY_AT_MIDNIGHT` 등).

### ⚠️ 수평 확장 시 중복 실행

인스턴스를 3개 띄우면 크론이 **3번** 돕니다. 해결책:
- **분산 락**: Redis에 `SET key NX EX 60` 으로 "이번 실행은 내가" 를 선점
- **전용 워커**: 크론은 별도 프로세스/컨테이너 하나만 실행
- `@nestjs/bullmq` 의 반복 잡(repeatable job) — 큐가 단일 실행 보장

### 동적 스케줄 — `SchedulerRegistry`

```ts
constructor(private registry: SchedulerRegistry) {}

addJob() {
  const job = new CronJob('*/5 * * * * *', () => {...});
  this.registry.addCronJob('dynamic', job);
  job.start();
}
```

---

## 3) Rate Limiting (`@nestjs/throttler`)

### 등록 — `app.module.ts`

```ts
ThrottlerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (cfg) => ({
    throttlers: [{ ttl: cfg.get('throttle.ttl', 60000), limit: cfg.get('throttle.limit', 100) }],
  }),
}),

// 전역 가드 (가장 먼저 실행되도록 APP_GUARD 배열 맨 앞)
{ provide: APP_GUARD, useClass: ThrottlerGuard }
```

기본: **60초에 100요청** 초과 시 `429 Too Many Requests`.

### 라우트별 조정

```ts
@Throttle({ default: { limit: 5, ttl: 60000 } })   // 로그인은 더 빡세게
@Post('login')
login() { ... }

@SkipThrottle()   // 헬스체크는 제한 제외
@Get('health')
```

### 실무 팁

- **인증 엔드포인트(`/auth/login`, `/auth/register`)는 훨씬 낮은 한도**로. 브루트포스 방어.
- 여러 인스턴스면 `ThrottlerStorageRedisService` 로 카운터를 공유.
- IP 기반이 기본. 프록시 뒤에 있으면 `app.set('trust proxy', 1)` 필요 (안 하면 모든 요청이 프록시 IP로 집계됨).

---

## 실습

1. `posts.service.ts` 의 `findAll()` 목록 결과도 캐싱하고, 글 작성/수정/삭제 시
   목록 캐시를 무효화하세요. (키 전략을 고민해 보세요 — 필터가 있으면?)
2. `/auth/login` 과 `/auth/register` 에 `@Throttle` 로 "1분에 5회" 제한을 거세요.
3. `stats.service.ts` 에 "매일 새벽 4시, 30일 지난 조회수 0 게시글을 published=false 로"
   하는 `@Cron` 잡을 추가하세요.

→ 다음: [11. 동적 모듈](./11-동적-모듈.md)
