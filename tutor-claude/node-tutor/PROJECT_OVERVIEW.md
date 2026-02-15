# NestJS 단계별 학습 프로젝트 - 전체 개요

## 프로젝트 목표

**NestJS를 처음 배우는 개발자가 기초부터 고급까지 체계적으로 학습할 수 있도록 돕는 교육용 프로젝트**

---

## 특징

### 🎯 체계적인 학습 구조
- **3단계 난이도**: Basic → Intermediate → Advanced
- **점진적 학습**: 이전 단계를 바탕으로 새로운 개념 추가
- **실전 중심**: 블로그 API를 만들며 실무 스킬 습득

### 📝 상세한 문서화
- **모든 코드에 한글 주석**: 각 라인의 의미를 명확히 설명
- **개념 설명**: 왜 이렇게 작성했는지 이유 제시
- **실전 팁**: 프로덕션에서 주의할 점 안내

### 💻 실행 가능한 예제
- **즉시 실행 가능**: npm install 후 바로 실행
- **테스트 코드 포함**: 각 기능의 동작을 검증
- **API 테스트 가능**: curl, Postman 등으로 즉시 테스트

### 📚 완전한 학습 자료
- **문법 참고서**: TypeScript와 Node.js 핵심 문법 정리
- **학습 가이드**: 단계별 학습 로드맵과 개념 설명
- **빠른 시작**: 5분 안에 시작하는 가이드

---

## 프로젝트 구조

```
node-tutor/
│
├── 📘 문서
│   ├── README.md              # 프로젝트 소개
│   ├── QUICK_START.md         # 빠른 시작 가이드
│   ├── LEARNING_GUIDE.md      # 상세 학습 로드맵
│   ├── PROJECT_OVERVIEW.md    # 이 파일
│   └── syntax-reference.ts    # 문법 참고 자료
│
├── 🎓 1단계: Basic (완성)
│   ├── main.ts                # 애플리케이션 시작점
│   ├── app.module.ts          # 루트 모듈
│   ├── app.controller.ts      # 루트 컨트롤러
│   ├── app.service.ts         # 루트 서비스
│   │
│   ├── 📮 posts/              # 게시글 모듈 (완전 구현)
│   │   ├── posts.module.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   ├── posts.service.spec.ts  # 테스트
│   │   ├── post.entity.ts
│   │   └── dto/
│   │       ├── create-post.dto.ts
│   │       └── update-post.dto.ts
│   │
│   └── 👥 users/              # 사용자 모듈 (기본 구현)
│       ├── users.module.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── user.entity.ts
│       └── dto/
│           └── create-user.dto.ts
│
├── 🔧 2단계: Intermediate (구조만 준비)
│   ├── README.md              # 학습 가이드
│   ├── middleware/            # 미들웨어 예제
│   ├── guards/                # 가드 예제
│   ├── interceptors/          # 인터셉터 예제
│   ├── pipes/                 # 파이프 예제
│   ├── filters/               # 필터 예제
│   └── dto/                   # 검증 예제
│
└── 🏗️ 3단계: Advanced (구조만 준비)
    ├── README.md              # 학습 가이드
    ├── domain/                # 도메인 계층
    ├── application/           # 응용 계층
    ├── infrastructure/        # 인프라 계층
    ├── presentation/          # 표현 계층
    └── cqrs-example/          # CQRS 패턴
```

---

## 학습 로드맵

### 🎯 Phase 1: Basic (현재 완성)
**학습 시간**: 2-3일
**목표**: NestJS 핵심 개념 이해

#### 학습 내용
✅ Module의 역할과 구조
✅ Controller로 HTTP 요청 처리
✅ Service의 비즈니스 로직
✅ 의존성 주입 (Dependency Injection)
✅ DTO와 Entity 구분
✅ RESTful API 설계
✅ CRUD 작업 구현
✅ 기본 에러 처리

#### 포함된 파일
- **16개 파일** 완전 구현 (주석 포함)
- **1개 테스트 파일** 포함
- **모든 API 엔드포인트** 동작 확인 완료

#### API 엔드포인트
```
GET    /api/posts              모든 게시글
GET    /api/posts/:id          특정 게시글
GET    /api/posts/published    공개 게시글
POST   /api/posts              게시글 생성
PUT    /api/posts/:id          게시글 수정
DELETE /api/posts/:id          게시글 삭제
GET    /api/users              모든 사용자
POST   /api/users              사용자 생성
```

---

### 🔧 Phase 2: Intermediate (준비 중)
**학습 시간**: 3-5일
**목표**: NestJS 고급 기능 활용

#### 학습 예정 내용
- Middleware: 요청/응답 사이클 제어
- Guards: 인증/인가 구현
- Interceptors: AOP 패턴, 로깅, 변환
- Pipes: 데이터 검증 및 변환
- Exception Filters: 전역 에러 처리
- class-validator 활용

#### 구현 예정 기능
- JWT 인증
- Role-based Access Control
- 요청 로깅
- 응답 포맷 표준화
- 전역 에러 처리

---

### 🏗️ Phase 3: Advanced (준비 중)
**학습 시간**: 1-2주
**목표**: 프로덕션 레벨 아키텍처

#### 학습 예정 내용
- Clean Architecture 원칙
- Domain-Driven Design (DDD)
- CQRS 패턴
- Event Sourcing
- Repository 패턴
- 완전한 테스트 커버리지

#### 아키텍처 계층
```
Presentation  → Controllers, DTOs
Application   → Use Cases, Commands, Queries
Domain        → Entities, Value Objects, Domain Services
Infrastructure→ Database, External APIs
```

---

## 현재 구현 상태

### ✅ 완료됨
- [x] 프로젝트 초기 설정 (package.json, tsconfig.json)
- [x] 1단계 전체 구현
- [x] Posts 모듈 완전 구현 (CRUD + 테스트)
- [x] Users 모듈 기본 구현
- [x] syntax-reference.ts (문법 가이드)
- [x] LEARNING_GUIDE.md (학습 로드맵)
- [x] README.md (프로젝트 소개)
- [x] QUICK_START.md (빠른 시작)
- [x] 빌드 테스트 완료

### 🚧 진행 중
- [ ] 2단계 Middleware, Guards, Interceptors 구현
- [ ] 3단계 Clean Architecture 구현

---

## 기술 스택

### Core
- **NestJS**: 11.1.13
- **TypeScript**: 5.9.3
- **Node.js**: 23.10.0 (14+ 호환)

### 개발 도구
- **Jest**: 테스트 프레임워크
- **ts-node**: TypeScript 직접 실행
- **nodemon**: 자동 재시작

### 향후 추가 예정
- **TypeORM** 또는 **Prisma**: 데이터베이스 ORM
- **class-validator**: 데이터 검증
- **@nestjs/cqrs**: CQRS 패턴
- **@nestjs/swagger**: API 문서화

---

## 사용 방법

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 1단계 실행
npm run start:basic

# 개발 모드 (자동 재시작)
npm run start:dev

# 테스트
npm test

# 빌드
npm run build
```

### API 테스트
```bash
# 게시글 조회
curl http://localhost:3000/api/posts

# 게시글 생성
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트","content":"내용","authorId":1}'
```

---

## 학습 방법 권장사항

### 1️⃣ 문서 읽기 (30분)
- [ ] README.md 읽기
- [ ] QUICK_START.md로 실행해보기
- [ ] LEARNING_GUIDE.md로 전체 흐름 파악

### 2️⃣ 문법 복습 (1시간)
- [ ] syntax-reference.ts 천천히 읽기
- [ ] TypeScript 문법 익히기
- [ ] 비동기 처리 이해하기

### 3️⃣ 코드 따라하기 (2-4시간)
- [ ] src/1-basic/main.ts부터 시작
- [ ] 각 파일의 주석 꼼꼼히 읽기
- [ ] 코드를 직접 타이핑해보기
- [ ] API 테스트해보기

### 4️⃣ 실습하기 (2-3시간)
- [ ] 새로운 엔드포인트 추가
- [ ] Comments 기능 구현해보기
- [ ] 테스트 코드 작성해보기

### 5️⃣ 다음 단계 (지속적)
- [ ] 2단계 학습 준비
- [ ] 데이터베이스 연동
- [ ] 실전 프로젝트에 적용

---

## 학습 목표 달성 기준

### 1단계 완료 기준
- [ ] Module, Controller, Service 개념 이해
- [ ] 의존성 주입 원리 이해
- [ ] RESTful API 설계 가능
- [ ] CRUD 작업 직접 구현 가능
- [ ] 기본 테스트 코드 작성 가능

### 2단계 완료 기준 (예정)
- [ ] Middleware 구현 가능
- [ ] JWT 인증 구현
- [ ] 데이터 검증 적용
- [ ] 전역 에러 처리 구현

### 3단계 완료 기준 (예정)
- [ ] Clean Architecture 이해 및 적용
- [ ] DDD 패턴으로 도메인 설계
- [ ] CQRS 패턴 구현
- [ ] 완전한 테스트 커버리지

---

## FAQ

### Q: 이 프로젝트는 누구를 위한 것인가요?
**A**: NestJS를 처음 배우는 개발자, 또는 체계적으로 다시 학습하고 싶은 개발자를 위한 프로젝트입니다.

### Q: JavaScript만 알아도 학습 가능한가요?
**A**: 네! syntax-reference.ts에 TypeScript 문법이 상세히 설명되어 있습니다. 하지만 기본적인 JavaScript 지식은 필요합니다.

### Q: 실무에서 바로 사용 가능한가요?
**A**: 1-2단계를 마치면 기본적인 API 서버를 만들 수 있습니다. 3단계까지 완료하면 프로덕션 레벨의 아키텍처를 구현할 수 있습니다.

### Q: 데이터베이스는 언제 배우나요?
**A**: 1단계에서는 인메모리 저장소를 사용하여 핵심 개념에 집중합니다. 이후 TypeORM이나 Prisma를 추가할 수 있습니다.

### Q: 다른 프레임워크(Express, Fastify)와 비교하면?
**A**: NestJS는 Express 위에 구축되었지만, Angular에서 영감을 받은 구조화된 아키텍처를 제공합니다. 대규모 프로젝트에 적합합니다.

---

## 기여 및 피드백

이 프로젝트는 교육 목적으로 만들어졌습니다.

- 질문이 있다면 언제든 물어보세요
- 개선 사항이 있다면 제안해주세요
- 더 배우고 싶은 내용이 있다면 요청해주세요

---

## 라이선스

MIT License - 자유롭게 사용하고 수정하세요!

---

## 마지막으로

**프로그래밍은 꾸준한 연습이 중요합니다.**

이 프로젝트를 통해:
- 매일 조금씩 코드를 작성하세요
- 에러를 두려워하지 마세요 (배움의 기회입니다)
- 직접 구현해보며 학습하세요
- 테스트 코드를 작성하세요

**당신의 NestJS 여정을 응원합니다!** 🚀

---

## 버전 히스토리

### v1.0.0 (2026-02-15)
- ✅ 프로젝트 초기 설정
- ✅ 1단계 (Basic) 완전 구현
- ✅ 상세한 문서 작성
- ✅ 테스트 코드 포함
- 🚧 2-3단계 구조 준비
