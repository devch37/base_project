# NestJS 단계별 학습 가이드

## 프로젝트 소개

이 프로젝트는 NestJS를 처음부터 체계적으로 학습하기 위한 교육용 프로젝트입니다.
실제 블로그 API를 만들면서 기초부터 고급 아키텍처 패턴까지 단계별로 학습할 수 있습니다.

---

## 학습 로드맵

### 📚 Phase 1: 기초 (1-basic/)
**학습 시간**: 약 2-3일
**목표**: NestJS의 핵심 개념 이해하기

#### 1.1 NestJS 기본 구조
- **Module**: 애플리케이션의 구성 단위
  - 관련된 기능들을 하나로 묶는 컨테이너
  - `@Module()` 데코레이터 사용
  - providers, controllers, imports, exports 이해

- **Controller**: HTTP 요청 처리
  - 라우팅과 요청/응답 처리
  - `@Controller()`, `@Get()`, `@Post()` 등 데코레이터
  - 요청 데이터 추출 (`@Body()`, `@Param()`, `@Query()`)

- **Service (Provider)**: 비즈니스 로직
  - 실제 작업을 수행하는 클래스
  - `@Injectable()` 데코레이터
  - Dependency Injection 이해

#### 1.2 의존성 주입 (Dependency Injection)
- IoC (Inversion of Control) 원칙
- Constructor Injection 패턴
- 테스트 용이성과 결합도 감소

#### 1.3 실습 프로젝트
- 간단한 블로그 API 구현
  - 게시글 CRUD (Create, Read, Update, Delete)
  - 사용자 관리
- RESTful API 설계 원칙

#### 학습 순서
1. `syntax-reference.ts` - TypeScript와 Node.js 기본 문법 복습
2. `1-basic/app.module.ts` - 루트 모듈 이해
3. `1-basic/posts/` - 게시글 기능 구현
4. `1-basic/users/` - 사용자 기능 구현
5. `1-basic/main.ts` - 애플리케이션 부트스트랩

**실행 방법**:
```bash
npm run start:basic
```

---

### 🔧 Phase 2: 중급 (2-intermediate/)
**학습 시간**: 약 3-5일
**목표**: NestJS의 고급 기능 활용하기

#### 2.1 Middleware
- 요청/응답 사이클에서 실행되는 함수
- 로깅, 인증, 요청 변환 등에 사용
- 함수형 vs 클래스형 미들웨어
- 전역, 모듈, 라우트 레벨 적용

#### 2.2 Guards (가드)
- 인증/인가 로직 구현
- `canActivate()` 메서드
- Execution Context 이해
- JWT 인증 구현 예제

#### 2.3 Interceptors (인터셉터)
- AOP (Aspect-Oriented Programming) 패턴
- 요청/응답 변환
- 로깅, 캐싱, 타임아웃 처리
- Observable 스트림 조작

#### 2.4 Pipes (파이프)
- 데이터 변환 (Transformation)
- 데이터 검증 (Validation)
- `class-validator`와 `class-transformer` 활용
- Custom Pipe 구현

#### 2.5 Exception Filters
- 전역 예외 처리
- Custom Exception 만들기
- 에러 응답 표준화

#### 2.6 DTO와 Validation
- Data Transfer Object 패턴
- 입력 데이터 검증
- 타입 안정성 확보

#### 학습 순서
1. `2-intermediate/middleware/` - 미들웨어 구현
2. `2-intermediate/guards/` - 인증 가드
3. `2-intermediate/interceptors/` - 로깅, 변환 인터셉터
4. `2-intermediate/pipes/` - 검증 파이프
5. `2-intermediate/filters/` - 예외 필터
6. `2-intermediate/dto/` - DTO와 검증

**실행 방법**:
```bash
npm run start:intermediate
```

---

### 🏗️ Phase 3: 고급 - Clean Architecture (3-advanced/)
**학습 시간**: 약 1-2주
**목표**: 프로덕션 레벨의 아키텍처 패턴 적용

#### 3.1 Clean Architecture 개념
- **계층 분리의 중요성**
  - Presentation Layer (표현 계층)
  - Application Layer (응용 계층)
  - Domain Layer (도메인 계층)
  - Infrastructure Layer (인프라 계층)

- **의존성 규칙**
  - 내부 계층은 외부를 모름
  - Domain이 중심
  - 프레임워크 독립성

#### 3.2 Domain-Driven Design (DDD)
- **Entity**: 고유 식별자를 가진 객체
- **Value Object**: 값으로 식별되는 불변 객체
- **Aggregate**: 일관성 경계
- **Repository**: 영속성 추상화
- **Domain Service**: 도메인 로직
- **Domain Event**: 도메인 이벤트

#### 3.3 CQRS (Command Query Responsibility Segregation)
- 명령(Command)과 조회(Query) 분리
- `@nestjs/cqrs` 패키지 활용
- Command Handler와 Query Handler
- Event Sourcing과의 결합

#### 3.4 실전 패턴
- **Use Case 패턴**: 애플리케이션 로직 캡슐화
- **Repository 패턴**: 데이터 액세스 추상화
- **Factory 패턴**: 복잡한 객체 생성
- **Specification 패턴**: 비즈니스 규칙 표현

#### 3.5 테스팅 전략
- **Unit Test**: 도메인 로직 테스트
- **Integration Test**: 계층 간 통합 테스트
- **E2E Test**: 전체 흐름 테스트
- **Test Double**: Mock, Stub, Fake

#### 학습 순서
1. `3-advanced/domain/` - 도메인 모델 설계
2. `3-advanced/application/` - Use Case 구현
3. `3-advanced/infrastructure/` - 영속성, 외부 서비스
4. `3-advanced/presentation/` - API 컨트롤러
5. `3-advanced/cqrs-example/` - CQRS 패턴 적용

**실행 방법**:
```bash
npm run start:advanced
```

---

## 학습 방법 권장사항

### 1단계: 읽기와 이해
- 각 파일의 주석을 꼼꼼히 읽기
- 코드 구조와 흐름 파악하기
- `syntax-reference.ts`로 문법 복습

### 2단계: 실행과 실험
```bash
# 개발 모드로 실행 (자동 재시작)
npm run start:dev

# 각 레벨별 실행
npm run start:basic
npm run start:intermediate
npm run start:advanced
```

### 3단계: 테스트 작성
```bash
# 전체 테스트 실행
npm test

# Watch 모드 (개발 중)
npm run test:watch

# 커버리지 확인
npm run test:cov
```

### 4단계: 직접 구현하기
- 기존 코드를 보지 않고 처음부터 구현
- 막히는 부분만 참고
- 자신만의 프로젝트에 적용

---

## 주요 개념 정리

### Decorator란?
TypeScript의 메타데이터 기능을 활용한 선언적 프로그래밍
```typescript
@Controller('posts')  // 클래스 데코레이터
export class PostsController {
  @Get()              // 메서드 데코레이터
  findAll(@Query() query: any) {  // 매개변수 데코레이터
    // ...
  }
}
```

### Dependency Injection
객체 간의 의존성을 외부에서 주입받는 패턴
- 결합도 감소
- 테스트 용이성 증가
- 코드 재사용성 향상

### Async/Await
비동기 작업을 동기 코드처럼 작성
```typescript
async findOne(id: number): Promise<Post> {
  const post = await this.postRepository.findById(id);
  return post;
}
```

---

## 실습 프로젝트: 블로그 API

### 기능 명세

#### 1단계 (Basic)
- ✅ 게시글 생성, 조회, 수정, 삭제
- ✅ 사용자 등록, 조회
- ✅ 기본 에러 처리

#### 2단계 (Intermediate)
- ✅ JWT 인증
- ✅ 게시글 소유자 검증
- ✅ 요청/응답 로깅
- ✅ DTO 검증
- ✅ 전역 예외 처리

#### 3단계 (Advanced)
- ✅ Clean Architecture 적용
- ✅ Domain Model 설계
- ✅ CQRS 패턴
- ✅ 도메인 이벤트
- ✅ 완전한 테스트 커버리지

---

## 추가 학습 리소스

### 공식 문서
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)

### 추천 도서
- "Clean Architecture" - Robert C. Martin
- "Domain-Driven Design" - Eric Evans
- "Implementing Domain-Driven Design" - Vaughn Vernon

### 패턴과 원칙
- **SOLID 원칙**: 객체지향 설계의 5가지 원칙
- **DRY (Don't Repeat Yourself)**: 중복 제거
- **KISS (Keep It Simple, Stupid)**: 단순하게 유지
- **YAGNI (You Aren't Gonna Need It)**: 필요할 때 구현

---

## 문제 해결

### 포트 충돌
```bash
# 다른 포트로 실행
PORT=4000 npm run start:dev
```

### TypeScript 에러
```bash
# 타입 정의 재설치
npm install -D @types/node @types/express
```

### 의존성 문제
```bash
# 클린 설치
rm -rf node_modules package-lock.json
npm install
```

---

## 다음 단계

이 프로젝트를 완료한 후:

1. **데이터베이스 통합**
   - TypeORM / Prisma
   - PostgreSQL / MongoDB

2. **인증/인가 심화**
   - OAuth 2.0
   - Role-Based Access Control

3. **마이크로서비스**
   - Message Queue (RabbitMQ, Kafka)
   - Service Discovery
   - API Gateway

4. **배포와 DevOps**
   - Docker
   - Kubernetes
   - CI/CD 파이프라인

---

## 💡 학습 팁

1. **손으로 코딩하기**: 복사/붙여넣기 대신 직접 타이핑
2. **에러 읽기**: 에러 메시지는 최고의 선생님
3. **디버깅 활용**: `console.log()` 또는 디버거 사용
4. **테스트 작성**: 코드 이해도를 높이는 최고의 방법
5. **문서 읽기**: 공식 문서는 가장 정확한 정보원
6. **커뮤니티 활용**: Stack Overflow, GitHub Issues

---

**행운을 빕니다! 즐거운 학습 되세요!** 🚀
