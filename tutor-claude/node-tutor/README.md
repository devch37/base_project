# NestJS 단계별 학습 프로젝트

> 초보자부터 고급까지, NestJS와 Clean Architecture를 체계적으로 학습하는 프로젝트

## 프로젝트 소개

이 프로젝트는 **NestJS를 처음부터 끝까지 체계적으로 학습**할 수 있도록 설계된 교육용 프로젝트입니다.

### 특징

- **단계별 학습 구조**: Basic → Intermediate → Advanced
- **실전 예제 중심**: 블로그 API를 만들며 학습
- **상세한 주석**: 모든 코드에 한글 설명 포함
- **문법 참고 자료**: TypeScript와 Node.js 핵심 문법 정리
- **테스트 코드 포함**: 각 레벨별 테스트 예제

### 학습 내용

#### 📚 Phase 1: Basic (1-basic/)
- Module, Controller, Service의 이해
- 의존성 주입(DI) 패턴
- RESTful API 구현
- CRUD 작업
- DTO와 Entity

#### 🔧 Phase 2: Intermediate (2-intermediate/)
- Middleware
- Guards (인증/인가)
- Interceptors
- Pipes (검증)
- Exception Filters
- 실전 에러 처리

#### 🏗️ Phase 3: Advanced (3-advanced/)
- Clean Architecture
- Domain-Driven Design (DDD)
- CQRS 패턴
- Event Sourcing
- 완전한 테스트 커버리지

---

## 빠른 시작

### 1. 설치

```bash
# 의존성 설치
npm install
```

### 2. 실행

```bash
# 1단계 (Basic) 실행
npm run start:basic

# 개발 모드 (자동 재시작)
npm run start:dev

# 프로덕션 빌드
npm run build
```

### 3. 테스트

```bash
# 모든 테스트 실행
npm test

# Watch 모드
npm run test:watch

# 커버리지 확인
npm run test:cov
```

---

## 학습 로드맵

### 📖 시작하기

1. **[LEARNING_GUIDE.md](./LEARNING_GUIDE.md)** 읽기
   - 전체 학습 로드맵 확인
   - 각 단계별 목표와 개념 이해

2. **[syntax-reference.ts](./syntax-reference.ts)** 복습
   - TypeScript 문법 확인
   - Node.js 핵심 개념
   - NestJS 데코레이터 정리

3. **단계별 실습**
   - 1-basic: 기초 다지기
   - 2-intermediate: 고급 기능
   - 3-advanced: 아키텍처 패턴

### 🎯 1단계: Basic

**학습 순서**

```
1. syntax-reference.ts     ← TypeScript & Node.js 문법
2. 1-basic/main.ts          ← 애플리케이션 시작점
3. 1-basic/app.module.ts    ← 모듈 이해
4. 1-basic/app.controller.ts ← 컨트롤러 기초
5. 1-basic/app.service.ts   ← 서비스 기초
6. 1-basic/posts/           ← 실전 CRUD 구현
   - posts.module.ts
   - post.entity.ts
   - dto/create-post.dto.ts
   - posts.service.ts
   - posts.controller.ts
   - posts.service.spec.ts  ← 테스트
7. 1-basic/users/           ← 연습 문제
```

**실행 및 테스트**

```bash
# 서버 실행
npm run start:basic

# 다른 터미널에서 테스트
curl http://localhost:3000/api/posts
curl http://localhost:3000/api/users

# 게시글 생성
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"첫 게시글","content":"안녕하세요!","authorId":1}'
```

---

## 프로젝트 구조

```
node-tutor/
├── src/
│   ├── 1-basic/                    # 1단계: 기초
│   │   ├── main.ts                 # 앱 시작점
│   │   ├── app.module.ts           # 루트 모듈
│   │   ├── app.controller.ts       # 루트 컨트롤러
│   │   ├── app.service.ts          # 루트 서비스
│   │   ├── posts/                  # 게시글 모듈
│   │   │   ├── posts.module.ts
│   │   │   ├── posts.controller.ts
│   │   │   ├── posts.service.ts
│   │   │   ├── posts.service.spec.ts
│   │   │   ├── post.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-post.dto.ts
│   │   │       └── update-post.dto.ts
│   │   └── users/                  # 사용자 모듈
│   │       ├── users.module.ts
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       └── ...
│   │
│   ├── 2-intermediate/             # 2단계: 중급
│   │   ├── middleware/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── filters/
│   │
│   └── 3-advanced/                 # 3단계: 고급
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── presentation/
│       └── cqrs-example/
│
├── syntax-reference.ts             # 문법 참고 자료
├── LEARNING_GUIDE.md               # 학습 가이드
├── README.md                       # 이 파일
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## 주요 개념 정리

### Module (모듈)
애플리케이션의 구성 단위. 관련 기능을 하나로 묶어 관리합니다.

```typescript
@Module({
  imports: [],      // 다른 모듈
  controllers: [],  // 컨트롤러
  providers: [],    // 서비스
  exports: []       // 내보낼 provider
})
```

### Controller (컨트롤러)
HTTP 요청을 받아 처리하는 클래스. 라우팅을 담당합니다.

```typescript
@Controller('posts')
export class PostsController {
  @Get()
  findAll() { ... }

  @Post()
  create(@Body() dto: CreatePostDto) { ... }
}
```

### Service (서비스)
비즈니스 로직을 담당하는 클래스. 의존성 주입이 가능합니다.

```typescript
@Injectable()
export class PostsService {
  async findAll(): Promise<Post[]> { ... }
}
```

### DTO (Data Transfer Object)
데이터 전송 객체. API 요청/응답의 구조를 정의합니다.

```typescript
export class CreatePostDto {
  title: string;
  content: string;
}
```

---

## API 엔드포인트 (1단계)

### 게시글 (Posts)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/posts | 모든 게시글 조회 |
| GET | /api/posts/:id | 특정 게시글 조회 |
| GET | /api/posts/published | 공개 게시글만 조회 |
| GET | /api/posts/author/:authorId | 특정 사용자의 게시글 |
| POST | /api/posts | 게시글 생성 |
| PUT | /api/posts/:id | 게시글 수정 |
| DELETE | /api/posts/:id | 게시글 삭제 |

### 사용자 (Users)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/users | 모든 사용자 조회 |
| GET | /api/users/:id | 특정 사용자 조회 |
| POST | /api/users | 사용자 생성 |

---

## 학습 팁

### 1. 순서대로 학습하기
- 파일 번호 순서대로 읽기
- 주석을 꼼꼼히 읽기
- 이해 안 되는 부분은 syntax-reference.ts 참고

### 2. 직접 코딩하기
- 복사/붙여넣기 하지 말고 직접 타이핑
- 타이핑하면서 코드 구조 이해
- 에러 메시지 읽는 습관 들이기

### 3. 실험하기
- 코드를 수정해보며 동작 확인
- 다양한 API 요청 보내보기
- 테스트 코드 작성해보기

### 4. 문서 활용하기
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- 이 프로젝트의 LEARNING_GUIDE.md

---

## 트러블슈팅

### 포트가 이미 사용 중일 때

```bash
# 다른 포트로 실행
PORT=4000 npm run start:basic
```

### TypeScript 에러

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 모듈을 찾을 수 없을 때

```bash
# TypeScript 컴파일
npm run build

# 또는 ts-node로 직접 실행
npx ts-node src/1-basic/main.ts
```

---

## 다음 단계

### 1단계 완료 후

- [ ] 2-intermediate/ 폴더로 이동
- [ ] Middleware, Guards, Interceptors 학습
- [ ] JWT 인증 구현
- [ ] 데이터 검증 추가

### 2단계 완료 후

- [ ] 3-advanced/ 폴더로 이동
- [ ] Clean Architecture 적용
- [ ] DDD 패턴 학습
- [ ] CQRS 구현

### 프로젝트 확장

- [ ] 데이터베이스 연동 (PostgreSQL + TypeORM)
- [ ] Swagger API 문서화
- [ ] Docker 컨테이너화
- [ ] 배포 (AWS, Heroku 등)

---

## 추가 학습 자료

### 공식 문서
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/)
- [Node.js 공식 문서](https://nodejs.org/docs/)

### 추천 도서
- "Clean Architecture" - Robert C. Martin
- "Domain-Driven Design" - Eric Evans
- "Test-Driven Development" - Kent Beck

### 유용한 도구
- [Postman](https://www.postman.com/) - API 테스트
- [Insomnia](https://insomnia.rest/) - REST 클라이언트
- [DBeaver](https://dbeaver.io/) - 데이터베이스 클라이언트

---

## 기여하기

이 프로젝트는 학습용이므로 자유롭게 수정하고 실험하세요!

질문이나 개선 사항이 있다면 이슈를 열어주세요.

---

## 라이선스

MIT License - 자유롭게 사용하세요!

---

## 마치며

NestJS는 처음에는 어려워 보일 수 있지만,
체계적으로 학습하면 강력하고 확장 가능한 애플리케이션을 만들 수 있습니다.

**화이팅! 🚀**

질문이 있다면 언제든 물어보세요!
