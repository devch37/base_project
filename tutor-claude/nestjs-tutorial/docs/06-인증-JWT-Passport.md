# 06. 인증 — JWT와 Passport

**인증(Authentication)** = "너 누구야?" 확인. (인가는 07장 — "너 이거 해도 돼?")

## 큰 그림: access + refresh 토큰

```
로그인 성공
  ├─ accessToken  (수명 15분)  → 매 요청 Authorization 헤더에 실어 보냄
  └─ refreshToken (수명 7일)   → access 가 만료되면 이걸로 새 토큰 발급

DB(users 테이블)에는 refreshToken 의 "해시"를 저장
  → 로그아웃 = 해시 삭제 = 그 refreshToken 무효화
```

**왜 둘로 나누나?**
- access 토큰은 자주 오가므로 탈취 위험 → 수명을 짧게
- 매번 로그인하긴 귀찮음 → 긴 수명의 refresh 로 자동 갱신
- refresh 는 서버 DB와 대조하므로 "강제 로그아웃"이 가능

---

## 구성 요소

| 파일 | 역할 |
|------|------|
| `auth/strategies/jwt.strategy.ts` | access 토큰 검증 (`'jwt'` 전략) |
| `auth/strategies/jwt-refresh.strategy.ts` | refresh 토큰 검증 (`'jwt-refresh'` 전략) |
| `common/guards/jwt-auth.guard.ts` | 전역 가드 — `'jwt'` 전략 실행, `@Public()` 예외 처리 |
| `auth/guards/jwt-refresh.guard.ts` | `/auth/refresh` 에서만 `'jwt-refresh'` 실행 |
| `auth/auth.service.ts` | 토큰 발급/검증/회전 로직 |
| `auth/auth.controller.ts` | `/auth/register`, `/login`, `/refresh`, `/logout` |
| `common/hashing/hashing.service.ts` | bcrypt 래퍼 (비밀번호 & refresh 해시) |

---

## Passport 전략이란?

Passport는 "인증 방식"을 **전략(Strategy)** 이라는 플러그인으로 다룹니다.
NestJS는 `@nestjs/passport` 로 이를 감쌉니다.

전략의 일 = **요청에서 자격증명 추출 → 검증 → 사용자 반환**

`jwt.strategy.ts`:
```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  //                                              전략 이름 ─┘
  constructor(@Inject(jwtConfig.KEY) config: ConfigType<typeof jwtConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  // "Bearer xxx" 에서 추출
      ignoreExpiration: false,                                    // 만료 검사함
      secretOrKey: config.accessSecret,                           // 서명 검증 키
    });
  }

  // 서명/만료 검증 통과 후 호출됨. 반환값이 request.user 에 담김
  validate(payload: AccessTokenPayload): AuthUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

`AuthGuard('jwt')` 가 이 이름(`'jwt'`)으로 전략을 찾아 실행합니다.

---

## 전역 인증 가드 + `@Public()`

`app.module.ts`:
```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```
→ **기본적으로 모든 라우트가 인증 필요.** 열어야 하는 곳만 `@Public()`:

`jwt-auth.guard.ts`:
```ts
canActivate(context) {
  const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
    context.getHandler(), context.getClass(),
  ]);
  if (isPublic) return true;           // @Public() 이면 통과
  return super.canActivate(context);   // 아니면 JWT 검증
}
```

`auth.controller.ts`:
```ts
@Public()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

> "화이트리스트(모두 막고 일부 열기)" 방식이 "블랙리스트(모두 열고 일부 막기)" 보다 안전합니다.
> 새 컨트롤러를 만들 때 가드 붙이는 걸 깜빡해도 자동으로 보호됩니다.

---

## 로그인 흐름 (auth.service.ts)

```ts
async login(dto: LoginDto) {
  const user = await this.usersService.findByEmailWithPassword(dto.email);
  const passwordOk = user
    ? await this.hashing.compare(dto.password, user.password)
    : false;

  // ⭐ 이메일이 없든 비번이 틀리든 "동일한" 401
  if (!user || !passwordOk) {
    throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const tokens = await this.issueTokens(user);
  await this.updateRefreshHash(user.id, tokens.refreshToken);  // DB에 해시 저장
  return { user, tokens };
}
```

**보안 포인트:**
- `findByEmailWithPassword` 는 `select: false` 인 password 를 `.addSelect()` 로 명시 조회
- "이메일 없음"과 "비번 틀림"을 구분하지 않음 → **계정 열거 공격(enumeration)** 방지
- 비밀번호는 bcrypt 해시 비교 (평문 저장 절대 금지)

---

## 토큰 갱신 (회전, rotation)

`jwt-refresh.strategy.ts` 가 refresh 요청을 검증:
```ts
super({
  jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),  // 본문에서 추출
  secretOrKey: config.refreshSecret,                          // 다른 시크릿!
  passReqToCallback: true,                                    // validate 에서 req 접근
});

async validate(req, payload) {
  const refreshToken = req.body.refreshToken;
  const user = await this.usersService.findByIdWithRefreshToken(payload.sub);

  // ⭐ 본문의 토큰이 "DB에 저장된 해시"와 일치하는지
  const matches = await this.hashing.compare(refreshToken, user.hashedRefreshToken);
  if (!matches) throw new UnauthorizedException();

  return { id: user.id, ... };
}
```

`auth.service.ts` 의 `refresh()` 는 **매번 새 refresh 토큰을 발급하고 이전 것을 무효화**합니다
(회전). 탈취된 refresh 토큰의 수명을 최소화하는 기법입니다.

---

## 로그아웃

```ts
async logout(userId: number) {
  await this.usersService.setHashedRefreshToken(userId, null);  // 해시 제거
}
```
이후 그 refresh 토큰으로 `/auth/refresh` 하면 `hashedRefreshToken` 이 `null` 이라 401.
(access 토큰은 만료 전까지 유효 — 그래서 access 수명을 짧게 두는 것)

---

## 직접 해보기 (curl)

```bash
# 회원가입 (토큰 발급됨)
curl -X POST localhost:3000/api/auth/register -H 'content-type: application/json' \
  -d '{"email":"me@ex.com","nickname":"나","password":"Passw0rd!"}'

# 로그인
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"me@ex.com","password":"Passw0rd!"}' | jq -r .data.accessToken)

# 인증이 필요한 요청
curl localhost:3000/api/users/me -H "Authorization: Bearer $TOKEN"
```

---

## JWT vs 세션 (참고)

| | JWT | 서버 세션 |
|--|-----|-----------|
| 상태 | 무상태 (서버가 저장 안 함) | 서버에 세션 저장소 필요 |
| 확장 | 수평 확장 쉬움 | 세션 공유(Redis) 필요 |
| 무효화 | 어려움 (그래서 refresh + 짧은 access) | `session.destroy()` 즉시 |
| 크기 | 매 요청 헤더에 실림 | 쿠키에 ID만 |

모바일/SPA/마이크로서비스에는 JWT, 전통 웹앱에는 세션이 흔합니다.
이 프로젝트는 JWT + refresh 회전 + DB 대조로 "무효화 어려움"을 보완했습니다.

---

## 실습

1. `POST /auth/me` 대신 `GET /auth/profile` 을 추가해 현재 토큰의 payload를 그대로 반환하세요.
2. 로그인 시도 5회 실패하면 1분간 잠그는 로직을 `auth.service.ts` 에 추가하세요
   (캐시 매니저 활용 — 10장).
3. refresh 토큰을 응답 본문 대신 **httpOnly 쿠키**로 내려주도록 바꿔 보세요.

→ 다음: [07. 인가 — RBAC와 커스텀 데코레이터](./07-인가-RBAC와-커스텀-데코레이터.md)
