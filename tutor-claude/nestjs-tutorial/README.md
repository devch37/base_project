# NestJS 실무형 학습 프로젝트 (nestjs-tutorial)

> **게시판 API**를 만들며 NestJS를 basic부터 advanced까지 배웁니다.
> 목표: **읽고 나면 실무 NestJS 프로젝트에 바로 투입될 수 있는 수준.**

- 프레임워크: NestJS 11 (Express)
- DB: TypeORM + SQLite (설정만 바꾸면 PostgreSQL/MySQL)
- 인증: JWT (access 15분 + refresh 7일, 회전) + Passport
- 모든 코드에 **왜 그렇게 쓰는지**까지 담은 한글 주석

---

## 빠른 시작

```bash
cd nestjs-tutorial
npm install
cp .env.example .env
npm run seed          # 예제 데이터 (관리자/사용자/게시글/댓글)
npm run start:dev
```

- API: http://localhost:3000/api
- **Swagger: http://localhost:3000/api/docs** ← API를 눌러보며 학습
- 시드 계정: `admin@example.com` / `alice@example.com` / `bob@example.com` (비번 `Passw0rd!`)

> 더 자세한 건 [QUICK_START.md](./QUICK_START.md)

---

## 학습 순서

`docs/` 폴더를 **번호 순서대로** 읽으세요. 각 장은 개념 설명 + **이 프로젝트의 실제 파일** 참조 + 실습으로 구성됩니다.

| 장 | 주제 | 난이도 |
|----|------|--------|
| [00](./docs/00-환경설정과-첫-실행.md) | 환경 설정과 첫 실행 | 🟢 |
| [01](./docs/01-핵심-빌딩블록-모듈-컨트롤러-프로바이더.md) | 핵심 빌딩블록 — 모듈·컨트롤러·프로바이더 | 🟢 |
| [02](./docs/02-의존성-주입.md) | 의존성 주입 (DI) | 🟢 |
| [03](./docs/03-요청-라이프사이클-파이프-가드-인터셉터-필터.md) | 요청 라이프사이클 — 파이프·가드·인터셉터·필터 | 🟡 |
| [04](./docs/04-DTO와-유효성-검증.md) | DTO와 유효성 검증 | 🟡 |
| [05](./docs/05-데이터베이스-TypeORM.md) | 데이터베이스와 TypeORM (관계, 트랜잭션, 마이그레이션) | 🟡 |
| [06](./docs/06-인증-JWT-Passport.md) | 인증 — JWT와 Passport | 🟡 |
| [07](./docs/07-인가-RBAC와-커스텀-데코레이터.md) | 인가 — RBAC와 커스텀 데코레이터 | 🟡 |
| [08](./docs/08-예외처리와-로깅.md) | 예외 처리와 로깅 | 🟡 |
| [09](./docs/09-설정과-환경변수.md) | 설정과 환경변수 | 🟡 |
| [10](./docs/10-캐싱-스케줄러-Rate-Limiting.md) | 캐싱 · 스케줄러 · Rate Limiting | 🔴 |
| [11](./docs/11-동적-모듈.md) | 동적 모듈 | 🔴 |
| [12](./docs/12-테스트-unit과-e2e.md) | 테스트 — unit과 e2e | 🔴 |
| [13](./docs/13-실무-체크리스트-배포.md) | 실무 체크리스트와 배포 | 🔴 |

개념의 흐름과 학습 팁은 [LEARNING_GUIDE.md](./LEARNING_GUIDE.md) 참고.

---

## 이 프로젝트가 담은 것

```
✅ 모듈 / DI / 데코레이터           ✅ 전역 파이프·가드·인터셉터·필터
✅ DTO 검증 (class-validator)       ✅ 응답 표준화 봉투
✅ TypeORM 엔티티 + 1:N / N:M 관계  ✅ QueryBuilder 동적 검색·페이지네이션
✅ JWT access/refresh + 회전        ✅ RBAC + 소유권 인가
✅ 커스텀 데코레이터 (@Public 등)   ✅ 전역 예외 필터 + 계층별 로깅
✅ 타입 있는 설정 + Joi 검증        ✅ 캐싱 + 무효화
✅ 스케줄러 (@Cron)                 ✅ Rate limiting
✅ 동적 모듈 (MailerModule)         ✅ 단위 + e2e 테스트 (19개, 전부 통과)
✅ Swagger 자동 문서                ✅ 헬스체크 (liveness/readiness)
```

---

## 디렉터리

```
src/
├─ main.ts / app.module.ts        부트스트랩 & 루트 조립
├─ config/                        환경변수 로딩 + 검증
├─ database/                      TypeORM 설정, 마이그레이션, 시드
├─ common/                        횡단 관심사 (decorators, guards, interceptors, filters, ...)
└─ modules/
   ├─ users/  auth/  posts/  comments/   도메인
   ├─ health/                            헬스체크
   └─ tasks/                             스케줄러
docs/                             학습 챕터 00~13
test/                             e2e 테스트
```

---

## 명령어

```bash
npm run start:dev       # 개발 서버 (watch)
npm run build           # 빌드
npm run start:prod      # 프로덕션 실행
npm test                # 단위 테스트
npm run test:e2e        # e2e 테스트
npm run test:cov        # 커버리지
npm run lint            # ESLint
npm run seed            # 예제 데이터
npm run migration:generate -- src/database/migrations/이름
npm run migration:run
```
