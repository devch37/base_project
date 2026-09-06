# 07. 인가 — RBAC와 커스텀 데코레이터

**인가(Authorization)** = 인증된 사용자가 "이 작업을 할 권한이 있는가".

이 프로젝트는 두 층으로 인가를 합니다:
1. **역할 기반 (RBAC)** — `@Roles(Role.ADMIN)` → 관리자만
2. **소유권 기반** — "본인 글만 수정/삭제" → 서비스 레이어에서 판단

---

## 1) 커스텀 데코레이터 — 메타데이터를 심는다

NestJS의 데코레이터는 대부분 `SetMetadata(key, value)` 로 **핸들러/클래스에 태그를 붙이는 것**입니다.
그 태그를 가드/인터셉터가 `Reflector` 로 읽습니다.

### `@Roles()` — `common/decorators/roles.decorator.ts`

```ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### `@Public()` — `common/decorators/public.decorator.ts`

```ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### `@CurrentUser()` — 파라미터 데코레이터

`common/decorators/current-user.decorator.ts` — `createParamDecorator` 사용:

```ts
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;              // JWT 전략이 넣어둔 값
    return data ? user?.[data] : user;      // @CurrentUser('id') → id만
  },
);
```

사용:
```ts
@Get('me')
getMe(@CurrentUser('id') userId: number) { ... }

@Patch(':id')
update(@Body() dto, @CurrentUser() user: AuthUser) { ... }
```

`@Req() req` 를 받아 `req.user.id` 를 파는 것보다 **타입 안전하고 테스트하기 쉽습니다.**

---

## 2) RolesGuard — 역할 검사

`common/guards/roles.guard.ts`:

```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),   // 메서드에 붙은 @Roles
      context.getClass(),     // 컨트롤러에 붙은 @Roles
    ]);

    if (!requiredRoles?.length) return true;   // @Roles 없으면 제한 없음

    const { user } = context.switchToHttp().getRequest();
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`[${requiredRoles.join(', ')}] 권한이 필요합니다.`);
    }
    return true;
  }
}
```

**전역 등록 순서** (`app.module.ts`):
```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },  // 먼저: request.user 를 채움
{ provide: APP_GUARD, useClass: RolesGuard },    // 다음: user.role 을 검사
```
순서가 바뀌면 `RolesGuard` 실행 시점에 `user` 가 아직 없습니다.

### 사용 — `users.controller.ts`

```ts
@Get()
@Roles(Role.ADMIN)                  // 관리자만 전체 사용자 목록
findAll() { return this.usersService.findAll(); }

@Delete(':id')
@Roles(Role.ADMIN)
remove(@Param('id', ParseIntPipe) id: number) { ... }
```

---

## 3) 소유권 기반 인가 — 서비스 레이어

"본인 글만" 같은 규칙은 데이터를 조회해 봐야 알 수 있으므로 **가드가 아니라 서비스**에서 합니다.

`posts.service.ts`:
```ts
private async getOwnedPost(id: number, actor: Actor): Promise<Post> {
  const post = await this.postsRepo.findOne({ where: { id } });
  if (!post) throw new NotFoundException(...);

  const isOwner = post.authorId === actor.id;
  const isAdmin = actor.role === Role.ADMIN;
  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('본인이 작성한 게시글만 수정/삭제할 수 있습니다.');
  }
  return post;
}
```

컨트롤러는 `@CurrentUser()` 로 actor를 넘겨주기만:
```ts
@Patch(':id')
update(@Param('id', ParseIntPipe) id, @Body() dto, @CurrentUser() user: AuthUser) {
  return this.postsService.update(id, dto, user);
}
```

`comments.service.ts` 도 동일한 `getOwnedComment()` 패턴을 씁니다.

---

## 언제 가드, 언제 서비스?

| 판단 기준 | 위치 | 예 |
|-----------|------|-----|
| 요청만 보고 알 수 있음 (역할, 경로) | **가드** | `@Roles(Role.ADMIN)` |
| 대상 데이터를 조회해야 알 수 있음 | **서비스** | "본인 글만", "같은 팀만" |
| 복잡한 정책 (조건 조합, 필드 단위) | **정책 객체 / CASL** | 대규모 앱 |

> 대규모 인가가 필요하면 `@casl/ability` + `nest-casl` 을 검토하세요.
> 이 프로젝트 규모에는 위 두 가지로 충분합니다.

---

## 실습

1. `Role` 에 `MODERATOR` 를 추가하고, 모더레이터는 "댓글은 삭제 가능하지만 게시글은 불가"
   하도록 만들어 보세요.
2. `@Roles` 를 컨트롤러 전체에 붙였을 때(클래스 레벨) 특정 메서드만 예외로 두는 방법을
   `getAllAndOverride` 동작과 함께 실험해 보세요.
3. `PostOwnerGuard` 를 만들어 소유권 검사를 가드로 옮겨 보고, 서비스 방식과 장단점을 비교하세요.
   (힌트: 가드에서 `PostsService` 주입 → `params.id` 로 조회)

→ 다음: [08. 예외 처리와 로깅](./08-예외처리와-로깅.md)
