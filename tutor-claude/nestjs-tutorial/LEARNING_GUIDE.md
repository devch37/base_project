# 학습 가이드 (Learning Guide)

`docs/` 챕터를 보기 전과 후에 읽으면 좋은, "큰 그림" 문서입니다.

---

## NestJS를 왜 쓰는가

Express만 쓰면 자유롭지만, 팀마다 폴더 구조·DI·검증·에러 처리가 제각각이 됩니다.
프로젝트가 커질수록 "어디에 뭘 둬야 하지?"가 반복됩니다.

**NestJS는 이 결정들을 미리 내려줍니다.** 대신 규칙(모듈, DI, 데코레이터)을 배워야 하죠.
그 대가로:
- 어느 NestJS 코드베이스든 구조가 비슷해서 온보딩이 빠름
- 테스트가 쉬움 (DI 덕분에 mock 주입이 자연스러움)
- 횡단 관심사(인증, 로깅, 검증)를 데코레이터로 선언적으로 처리

---

## 정신 모델: 요청 하나의 여정

```
클라이언트
  │  POST /api/posts  { title, content }   + Authorization: Bearer xxx
  ▼
[미들웨어]  helmet, compression, cors
  ▼
[가드]     ThrottlerGuard(횟수?) → JwtAuthGuard(토큰?) → RolesGuard(역할?)
  ▼
[인터셉터] LoggingInterceptor 시작, TransformInterceptor 대기
  ▼
[파이프]   ValidationPipe: body를 CreatePostDto로 변환 + @IsString 등 검증
  ▼
[컨트롤러] PostsController.create(dto, userId)   ← @CurrentUser('id')
  ▼
[서비스]   PostsService.create(): 태그 upsert → repo.save()
  ▼
[DB]       INSERT INTO posts ...
  ▲
[인터셉터] TransformInterceptor: 결과를 { success, data, timestamp, path }로 감쌈
  ▲
[[에러 시]] 어디서든 throw → AllExceptionsFilter가 표준 에러 응답 생성
  ▼
클라이언트  201 { success: true, data: { id: 1, ... } }
```

이 그림이 머리에 있으면, "왜 여기서 안 되지?"를 단계별로 좁힐 수 있습니다.

---

## 개념 지도

```
모듈 ─┬─ 컨트롤러 ── 라우팅, @Body/@Param/@Query
      ├─ 프로바이더(서비스) ── 비즈니스 로직
      │      │
      │      └─ 의존성 주입 ── @Injectable, 생성자 주입, 토큰
      │
      ├─ imports / exports ── 모듈 간 경계 = 캡슐화
      │
      └─ 동적 모듈 ── forRoot / forRootAsync (설정 주입)

요청 파이프라인 ─┬─ 파이프 ── 입력 검증/변환 (DTO + class-validator)
                ├─ 가드 ── 인증(JWT) + 인가(RBAC)
                ├─ 인터셉터 ── 응답 표준화, 로깅, 타임아웃, 캐싱
                └─ 예외 필터 ── 에러 → HTTP 응답

데이터 ─┬─ 엔티티 ── @Entity, @Column, 관계(@ManyToOne 등)
        ├─ Repository ── find, save, QueryBuilder
        ├─ 트랜잭션 ── dataSource.transaction
        └─ 마이그레이션 ── 운영 스키마 관리

인증/인가 ─┬─ access 토큰(짧게) + refresh 토큰(길게, 회전)
           ├─ Passport 전략 ── jwt.strategy / jwt-refresh.strategy
           ├─ @Public() ── 전역 가드 예외
           ├─ @Roles() + RolesGuard ── 역할
           └─ 소유권 검사 ── 서비스 레이어

운영 ─┬─ 설정 ── .env → Joi 검증 → 타입 있는 config
      ├─ 로깅 ── 계층별 Logger, 구조화 로깅
      ├─ 캐싱 / 스케줄러 / rate limit
      ├─ 헬스체크 ── liveness / readiness
      └─ 테스트 ── unit(mock) + e2e(인메모리 DB)
```

---

## 자주 하는 질문

### Q. 로직을 컨트롤러에 써도 되나요?
안 됩니다. 컨트롤러는 "HTTP ↔ 도메인 호출" 번역만. 규칙·계산·DB는 서비스로.
이유: 재사용(다른 컨트롤러/큐/CLI에서 호출), 테스트 용이성.

### Q. `interface` 대신 `class` 로 DTO를 만드는 이유?
인터페이스는 컴파일하면 사라져서 런타임 검증이 불가능합니다.
클래스는 남아 있어 `@IsEmail()` 같은 데코레이터가 동작합니다.

### Q. 엔티티를 그대로 응답으로 내보내도 되나요?
지양하세요. `password` 같은 민감 필드가 샐 수 있고, DB 스키마와 API 계약이 묶입니다.
이 프로젝트는 `@Exclude()` + `select: false` + (필요 시) 응답 DTO로 방어합니다.

### Q. `synchronize: true` 를 계속 쓰면 안 되나요?
개발 초기엔 편하지만 **운영에서는 데이터가 날아갑니다.** 운영은 마이그레이션만.

### Q. 전역 가드/인터셉터는 `main.ts`? `app.module.ts`?
DI가 필요하면(다른 서비스 주입) `app.module.ts` 의 `APP_GUARD`/`APP_INTERCEPTOR`/`APP_FILTER`.
순수 인스턴스면 `main.ts` 의 `useGlobalXxx`.

### Q. 순환 의존성이 났어요.
`forwardRef` 는 임시방편. 근본 해결은 공통 로직을 제3의 모듈로 빼서 의존성 방향을 한쪽으로.

### Q. `@Global()` 을 남발하면?
"누가 이 모듈을 쓰는지"가 코드에서 안 보이게 됩니다. 정말 모든 곳에서 쓰는 것
(설정, 로거, DB, 해싱)에만.

---

## 학습 팁

1. **Swagger(`/api/docs`)를 열어두고** 각 장을 읽으세요. 개념 → 실제 요청/응답을 바로 확인.
2. **파일을 직접 열어 주석을 읽으세요.** 이 프로젝트의 주석은 "왜"를 설명합니다.
3. **일부러 깨뜨려 보세요.** 가드를 지우면? env를 비우면? `synchronize` 를 끄면?
4. 각 장 끝의 **실습**을 하나라도 손으로 해보세요. 읽기와 쓰기는 다른 능력입니다.
5. **`npm test` 를 자주 돌리세요.** 테스트가 통과하면 리팩터링이 두렵지 않습니다.

---

## 이 프로젝트 다음 단계

`docs/13` 마지막 절 참고. 요약하면:
BullMQ 큐 → WebSocket → 마이크로서비스 → GraphQL → CQRS.
전부 이 프로젝트의 구조(모듈/DI/파이프라인/테스트) 위에 얹는 방식입니다.
