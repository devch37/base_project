# 05. 데이터베이스와 TypeORM

이 프로젝트는 **TypeORM + SQLite**를 씁니다. (PostgreSQL/MySQL로 바꾸려면 `type` 과 드라이버만 교체)

## 설정 구조

두 개의 설정이 있습니다. **이유가 중요합니다.**

| 파일 | 용도 | 언제 |
|------|------|------|
| `src/database/typeorm.config.ts` | NestJS 런타임 (`TypeOrmModule.forRootAsync`) | 서버 실행 시 |
| `src/database/data-source.ts` | TypeORM CLI (`migration:generate` 등) | 마이그레이션 명령 시 |

CLI는 Nest 컨텍스트 밖에서 돌기 때문에 순수 `DataSource` 정의가 따로 필요합니다.

```ts
// typeorm.config.ts (런타임)
createTypeOrmOptions(): TypeOrmModuleOptions {
  return {
    type: 'better-sqlite3',
    database: this.config.get('database.database'),
    autoLoadEntities: true,           // forFeature 로 등록된 엔티티 자동 수집
    synchronize: synchronize && !isProd,  // ⚠️ 아래 설명
    migrations: ['dist/database/migrations/*.js'],
  };
}
```

---

## ⚠️ `synchronize` 를 절대 운영에서 켜지 마세요

`synchronize: true` = "엔티티 정의에 맞춰 테이블을 자동으로 바꿈".
- 개발 초기엔 편함 (마이그레이션 없이 스키마가 따라옴)
- **운영에서 켜면**: 컬럼 이름을 바꾸는 순간 TypeORM이 "옛 컬럼 DROP + 새 컬럼 ADD" 를 해서
  **데이터가 날아갑니다.**

이 프로젝트는 `.env` 의 `DB_SYNCHRONIZE=true` (개발) + 코드에서 `&& !isProd` 로 이중 잠금.
운영은 반드시 **마이그레이션**을 씁니다 (아래).

---

## 엔티티 (Entity) = 테이블

`src/common/entities/base.entity.ts` — 공통 컬럼을 추상 클래스로:

```ts
export abstract class BaseEntity {
  @PrimaryGeneratedColumn() id: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

`src/modules/posts/entities/post.entity.ts`:

```ts
@Entity('posts')
export class Post extends BaseEntity {
  @Index()
  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  viewCount: number;
}
```

### 자주 쓰는 컬럼 옵션

| 옵션 | 의미 |
|------|------|
| `@Column({ nullable: true })` | NULL 허용 (타입도 `string \| null` 로) |
| `@Column({ default: 0 })` | 기본값 |
| `@Column({ unique: true })` 또는 `@Index({ unique: true })` | 고유 제약 |
| `@Column({ select: false })` | 기본 SELECT에서 제외 (비밀번호) |
| `@Column({ type: 'text' })` | 긴 문자열 |
| `@Index()` | 조회 성능용 인덱스 |

### PK 선택: 정수 vs UUID

이 프로젝트는 학습 편의로 `@PrimaryGeneratedColumn()` (자동증가 정수)를 씁니다.
실무에서는 **UUID**(`@PrimaryGeneratedColumn('uuid')`)를 선호하는 경우가 많습니다:
- 순차 정수는 "총 몇 명 가입했는지" 등이 URL로 유추됨
- 여러 DB를 합칠 때 충돌 없음

---

## 관계 (Relations)

`post.entity.ts` 에 세 종류가 다 있습니다.

### N:1 — `@ManyToOne`

```ts
@ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE', nullable: false })
@Index()
author: User;

@Column()
authorId: number;   // FK 값을 엔티티 로드 없이 바로 쓰기 위한 필드
```

- `() => User` 로 감싸는 이유: 파일 간 순환 참조를 피하기 위해 **지연 평가**
- `onDelete: 'CASCADE'` : 사용자가 삭제되면 그 글도 삭제
- `authorId` 를 따로 두면 `post.author.id` 대신 `post.authorId` 로 접근 (관계 로드 불필요)

### 1:N — `@OneToMany`

```ts
// User 쪽
@OneToMany(() => Post, (post) => post.author)
posts: Post[];
```
`@OneToMany` 는 FK 컬럼을 만들지 않습니다 (N 쪽의 `@ManyToOne` 이 만듦). 항상 짝으로.

### N:M — `@ManyToMany` + `@JoinTable`

```ts
// Post 쪽 (소유 측)
@ManyToMany(() => Tag, (tag) => tag.posts, { cascade: true })
@JoinTable({ name: 'post_tags' })   // 조인 테이블. 소유 측에만 붙임
tags: Tag[];

// Tag 쪽 (역방향)
@ManyToMany(() => Post, (post) => post.posts)
posts: Post[];
```

`posts.service.ts` 의 `upsertTags()` 가 "태그 이름 배열 → Tag 엔티티 배열 (없으면 생성)" 패턴입니다.

---

## Repository — DB 접근

`@InjectRepository(Post)` 로 주입받습니다 (모듈에서 `TypeOrmModule.forFeature([Post])` 필요).

### 기본 메서드

```ts
this.postsRepo.find({ where: { published: true }, order: { createdAt: 'DESC' } });
this.postsRepo.findOne({ where: { id }, relations: { author: true, tags: true } });
this.postsRepo.findAndCount({ ... });   // [items, total] — 페이지네이션용
this.postsRepo.exists({ where: { email } });
this.postsRepo.create({ ... });         // 인스턴스 생성 (저장 X)
this.postsRepo.save(entity);            // INSERT 또는 UPDATE
this.postsRepo.increment({ id }, 'viewCount', 1);
this.postsRepo.delete(id);              // { affected: n }
this.postsRepo.remove(entity);          // 엔티티 객체로 삭제 (훅 실행됨)
```

### QueryBuilder — 동적 쿼리

`posts.service.ts` 의 `findAll()` 이 실전 예시입니다:

```ts
const qb = this.postsRepo.createQueryBuilder('post')
  .leftJoinAndSelect('post.author', 'author')
  .leftJoinAndSelect('post.tags', 'tag');

if (query.search) {
  qb.andWhere('(post.title LIKE :kw OR post.content LIKE :kw)', { kw: `%${query.search}%` });
}
if (query.tag) {
  qb.andWhere('tag.name = :tagName', { tagName: query.tag });
}

// 정렬 컬럼은 화이트리스트로! (SQL 인젝션 방지)
const sortable = new Set(['createdAt', 'viewCount', 'title']);
qb.orderBy(`post.${sortable.has(query.sort) ? query.sort : 'createdAt'}`, query.order);

qb.skip(query.skip).take(query.limit);
const [items, total] = await qb.getManyAndCount();
```

> ⚠️ 값은 항상 `:파라미터` 바인딩으로. `` `WHERE name = '${x}'` `` 는 절대 금지.

---

## N+1 문제

```ts
const posts = await repo.find();              // 쿼리 1번
for (const p of posts) console.log(p.author); // ❌ author 마다 쿼리 → N번 더
```

해결: `relations` 또는 `leftJoinAndSelect` 로 한 번에 조인.
```ts
await repo.find({ relations: { author: true } });   // 쿼리 1번(조인)
```

`eager: true` 를 관계에 붙이면 항상 자동 로드되지만, 필요 없을 때도 조인해서 느려집니다.
**기본은 `eager: false`, 필요한 곳에서 명시적으로 로드**하세요.

---

## 트랜잭션

여러 쓰기가 "전부 성공 또는 전부 취소" 되어야 할 때:

```ts
// 방법 1: DataSource.transaction (권장)
await this.dataSource.transaction(async (manager) => {
  const user = await manager.save(User, { ... });
  await manager.save(Profile, { userId: user.id });
  // 콜백이 throw 하면 자동 롤백
});

// 방법 2: QueryRunner (세밀한 제어)
const qr = this.dataSource.createQueryRunner();
await qr.connect();
await qr.startTransaction();
try {
  await qr.manager.save(...);
  await qr.commitTransaction();
} catch (e) {
  await qr.rollbackTransaction();
  throw e;
} finally {
  await qr.release();
}
```

---

## 마이그레이션 (운영 필수)

```bash
# 1) 엔티티를 수정한다 (예: Post에 컬럼 추가)

# 2) 현재 DB와 엔티티의 차이로 마이그레이션 파일 생성
npm run migration:generate -- src/database/migrations/AddSummaryToPost

# 3) 생성된 파일(up/down) 검토 후 적용
npm run migration:run

# 되돌리기
npm run migration:revert
```

- `data-source.ts` 의 `synchronize: false` 이므로 CLI는 마이그레이션만 신뢰합니다.
- 런타임(`typeorm.config.ts`)에서 `migrations` 경로를 지정하고
  `migrationsRun: true` 를 주면 앱 시작 시 자동 적용도 가능 (배포 파이프라인에선 별도 단계로 두는 걸 권장).

---

## 시드 (예제 데이터)

`src/database/seeds/` — `npm run seed` 로 관리자/사용자/게시글/댓글을 넣습니다.
멱등하게 작성되어 있어(이미 데이터 있으면 skip) 여러 번 실행해도 안전합니다.

---

## 실습

1. `Post` 에 `summary: string`(nullable) 컬럼을 추가하고 마이그레이션을 생성·적용해 보세요.
2. `posts.service.ts` 의 `create()` 를 트랜잭션으로 감싸서, 태그 저장이 실패하면
   게시글도 저장되지 않도록 만들어 보세요.
3. `findAll()` 에 `published` 필터를 추가하세요 (비로그인은 발행된 글만 보이도록).

→ 다음: [06. 인증 — JWT와 Passport](./06-인증-JWT-Passport.md)
