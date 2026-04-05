# Spring Boot 고급 학습 프로젝트 - Smart Article Platform

4년차 백엔드 개발자를 위한 Spring Boot 심화 학습 프로젝트입니다.

## 프로젝트 개요

기사/블로그 플랫폼을 만들면서 Spring Boot의 고급 기능들을 단계별로 학습합니다.
각 코드에는 **"왜 이렇게 구현했는지"**, **"실무에서 어떻게 활용하는지"** 상세한 주석이 포함되어 있습니다.

## 기술 스택

- **Kotlin** 2.3.0
- **Spring Boot** 3.4.2
- **JDK** 21
- **H2 Database** (학습용 인메모리 DB)
- **Gradle** Kotlin DSL
- **Kotest** (Kotlin 친화적 테스트 프레임워크)

## Phase 1: 핵심 아키텍처 & 필수 패턴 ✅

### 1. Exception Handling 전략

**위치:** `exception/` 패키지

**학습 내용:**
- RFC 7807 Problem Details 패턴 적용
- 도메인별 예외 계층 설계
- `@ControllerAdvice`로 전역 예외 처리
- 일관된 에러 응답 포맷

**핵심 파일:**
- `BusinessException.kt` - 비즈니스 예외 기본 클래스
- `ErrorResponse.kt` - RFC 7807 표준 에러 응답
- `GlobalExceptionHandler.kt` - 전역 예외 핸들러

**실무 포인트:**
```kotlin
// ❌ 나쁜 예: 컨트롤러마다 try-catch
@PostMapping
fun createUser(@RequestBody request: CreateUserRequest): ResponseEntity<*> {
    try {
        return ResponseEntity.ok(userService.createUser(request))
    } catch (e: Exception) {
        return ResponseEntity.badRequest().body(e.message)
    }
}

// ✅ 좋은 예: GlobalExceptionHandler에서 일관되게 처리
@PostMapping
fun createUser(@RequestBody request: CreateUserRequest): UserResponse {
    return userService.createUser(request) // 예외는 자동으로 처리됨
}
```

### 2. AOP (Aspect-Oriented Programming)

**위치:** `aop/` 패키지

**학습 내용:**
- 횡단 관심사(Cross-Cutting Concerns) 분리
- 실행 시간 로깅 (`@Around`)
- 감사(Audit) 로깅 (`@AfterReturning`)
- 재시도 메커니즘 (`@Retryable`)

**핵심 파일:**
- `LoggingAspect.kt` - 실행 시간 측정 및 로깅
- `AuditingAspect.kt` - 데이터 변경 감사 로깅
- `RetryAspect.kt` - 자동 재시도 메커니즘

**실무 포인트:**
```kotlin
// AOP 없이 (코드 중복, 비즈니스 로직과 로깅 로직이 섞임)
fun createArticle(request: CreateArticleRequest): ArticleResponse {
    logger.info("createArticle 시작")
    val startTime = System.currentTimeMillis()
    try {
        val result = ...
        logger.info("createArticle 완료: ${System.currentTimeMillis() - startTime}ms")
        return result
    } catch (e: Exception) {
        logger.error("createArticle 실패", e)
        throw e
    }
}

// AOP 사용 (비즈니스 로직만 남음, 로깅은 Aspect에서 자동 처리)
fun createArticle(request: CreateArticleRequest): ArticleResponse {
    val author = userService.findUserById(request.authorId)
    val article = request.toEntity(author)
    return ArticleResponse.from(articleRepository.save(article))
}
```

**재시도 메커니즘 사용 예시:**
```kotlin
@Retryable(maxAttempts = 3, delayMillis = 1000)
fun callExternalApi(): String {
    // 일시적 오류 발생 시 자동으로 3번까지 재시도
}
```

### 3. Custom Annotations & Validators

**위치:** `validator/` 패키지

**학습 내용:**
- 커스텀 어노테이션 정의
- `ConstraintValidator` 구현
- 조건부 검증 로직
- DB 조회를 포함한 검증

**핵심 파일:**
- `ValidEmail.kt` - 도메인 제한 이메일 검증
- `UniqueEmail.kt` - 이메일 중복 검증 (DB 조회)
- `ConditionalValidation.kt` - 조건부 검증 (클래스 레벨)

**실무 포인트:**
```kotlin
// 비즈니스 규칙을 선언적으로 표현
data class CreateUserRequest(
    @field:NotBlank(message = "이메일은 필수입니다")
    @field:Email(message = "올바른 이메일 형식이 아닙니다")
    @field:UniqueEmail(message = "이미 사용 중인 이메일입니다")
    val email: String,

    @field:NotBlank
    @field:Size(min = 2, max = 50)
    val name: String
)

// 컨트롤러는 @Valid만 추가하면 자동 검증
@PostMapping
fun createUser(@Valid @RequestBody request: CreateUserRequest): UserResponse {
    return userService.createUser(request)
}
```

## 프로젝트 구조

```
src/main/kotlin/be/com/springbootclaude/
├── SpringBootClaudeApplication.kt     # 메인 애플리케이션
├── config/
│   └── JpaConfig.kt                   # JPA Auditing 설정
├── domain/                            # 도메인 모델 (엔티티)
│   ├── BaseEntity.kt                  # 공통 필드 (id, createdAt, updatedAt)
│   ├── User.kt                        # 사용자 엔티티
│   └── Article.kt                     # 기사 엔티티
├── repository/                        # 데이터 접근 계층
│   ├── UserRepository.kt
│   └── ArticleRepository.kt
├── service/                           # 비즈니스 로직 계층
│   ├── UserService.kt
│   └── ArticleService.kt
├── controller/                        # API 엔드포인트
│   ├── UserController.kt
│   └── ArticleController.kt
├── dto/                               # 데이터 전송 객체
│   ├── UserDto.kt
│   └── ArticleDto.kt
├── exception/                         # 예외 처리 ⭐
│   ├── BusinessException.kt           # 커스텀 예외 계층
│   ├── ErrorResponse.kt               # RFC 7807 에러 응답
│   └── GlobalExceptionHandler.kt      # 전역 예외 핸들러
├── aop/                               # AOP 관점 ⭐
│   ├── LoggingAspect.kt               # 실행 시간 로깅
│   ├── AuditingAspect.kt              # 감사 로깅
│   └── RetryAspect.kt                 # 재시도 메커니즘
└── validator/                         # 커스텀 Validators ⭐
    ├── ValidEmail.kt
    ├── UniqueEmail.kt
    ├── ConditionalValidation.kt
    └── ValidatorExamples.kt           # 학습 자료
```

## 실행 방법

### 1. 애플리케이션 실행

```bash
./gradlew bootRun
```

애플리케이션이 `http://localhost:8080`에서 실행됩니다.

### 2. H2 Console 접속

브라우저에서 `http://localhost:8080/h2-console` 접속

- **JDBC URL:** `jdbc:h2:mem:testdb`
- **Username:** `sa`
- **Password:** (빈 칸)

### 3. API 테스트

#### 사용자 생성
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "홍길동"
  }'
```

#### 기사 생성
```bash
curl -X POST http://localhost:8080/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spring Boot AOP 완벽 가이드",
    "content": "AOP는 횡단 관심사를 분리하는 강력한 도구입니다...",
    "authorId": 1
  }'
```

#### 기사 목록 조회 (페이징)
```bash
# 첫 번째 페이지 (10개)
curl http://localhost:8080/api/articles?page=0&size=10

# 최신순 정렬 (기본값)
curl http://localhost:8080/api/articles?sort=createdAt,desc
```

#### 기사 게시
```bash
curl -X POST http://localhost:8080/api/articles/1/publish
```

#### Validation 에러 테스트
```bash
# 잘못된 이메일 형식
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "name": "홍길동"
  }'

# 응답:
{
  "timestamp": "2026-02-09T21:30:00",
  "status": 400,
  "error": "Bad Request",
  "errorCode": "VALIDATION_ERROR",
  "message": "입력값 검증에 실패했습니다",
  "path": "/api/users",
  "errors": [
    {
      "field": "email",
      "rejectedValue": "invalid-email",
      "message": "올바른 이메일 형식이 아닙니다"
    }
  ]
}
```

### 4. 로그 확인

애플리케이션 실행 중 콘솔에서 AOP 로그를 확인할 수 있습니다:

```
[ArticleService.createArticle] 실행 시작 - args: [CreateArticleRequest(...)]
[AUDIT] CREATE - User: SYSTEM, Entity: Article, Method: ArticleService.createArticle
[ArticleService.createArticle] 실행 완료 - 125ms
API 응답: ArticleController.createArticle - 성공
```

## 학습 가이드

### Phase 1 학습 체크리스트

- [ ] **Exception Handling**
  - [ ] BusinessException 계층 구조 이해
  - [ ] @ControllerAdvice의 동작 원리
  - [ ] RFC 7807 Problem Details 패턴
  - [ ] Validation 에러 처리 방식

- [ ] **AOP**
  - [ ] @Aspect, @Pointcut, @Around 이해
  - [ ] Join Point, Advice 개념
  - [ ] 횡단 관심사 분리의 장점
  - [ ] 성능 측정 및 로깅 패턴

- [ ] **Custom Validators**
  - [ ] @Constraint, ConstraintValidator 구현
  - [ ] 필드 레벨 vs 클래스 레벨 검증
  - [ ] DB 조회를 포함한 검증의 장단점
  - [ ] Validation Groups 활용

### 실습 과제

#### 1. 새로운 예외 클래스 추가
- `ArticleAlreadyPublishedException` 만들기
- 이미 게시된 기사를 다시 게시하려 할 때 발생
- 적절한 HTTP 상태 코드 선택 (409 Conflict?)

#### 2. 커스텀 Validator 만들기
- `@ValidArticleTitle` - 제목에 금지어 포함 여부 검증
- 금지어 리스트를 어노테이션 파라미터로 받기

#### 3. AOP 활용
- `@SlowQuery` 어노테이션 만들기
- 지정한 시간(예: 1000ms) 이상 걸리면 경고 로그 출력

## 핵심 개념 정리

### 1. N+1 문제

```kotlin
// ❌ N+1 문제 발생
fun getArticles(): List<Article> {
    return articleRepository.findAll() // 1번 쿼리
    // 각 Article의 author를 조회할 때마다 추가 쿼리 N번 발생!
}

// ✅ JOIN FETCH로 해결
@Query("SELECT a FROM Article a JOIN FETCH a.author")
fun findAllWithAuthor(): List<Article>  // 1번의 쿼리로 모든 데이터 조회
```

### 2. 변경 감지 (Dirty Checking)

```kotlin
@Transactional
fun updateArticle(id: Long, request: UpdateArticleRequest): ArticleResponse {
    val article = findArticleById(id)

    // 엔티티 수정 (변경 감지)
    article.title = request.title
    article.content = request.content

    // save() 호출 불필요! 트랜잭션 커밋 시 자동으로 UPDATE 쿼리 실행
    return ArticleResponse.from(article)
}
```

### 3. DTO vs Entity

- **Entity**: DB 테이블과 매핑, 비즈니스 로직 포함
- **DTO**: API 요청/응답 전용, validation 포함
- **절대 Entity를 직접 반환하지 마세요!** API 스펙이 불안정해집니다.

## 다음 단계: Phase 2

Phase 1을 완료했다면 다음 주제를 학습할 준비가 되었습니다:

- **Caching** - Caffeine (로컬) + Redis (분산)
- **Event-Driven Architecture** - `@EventListener`, `@TransactionalEventListener`
- **Async Programming** - `@Async`, `CompletableFuture`

## Phase 3: Integration (gRPC & GraphQL) ✅

실무에서 많이 쓰는 통신 방식인 gRPC/GraphQL 학습 예제를 추가했습니다.

- **gRPC**: `src/main/kotlin/be/com/springbootclaude/integration/grpc/README.md`
- **GraphQL**: `src/main/kotlin/be/com/springbootclaude/integration/graphql/README.md`

## 참고 자료

- [Spring Boot 공식 문서](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring AOP 레퍼런스](https://docs.spring.io/spring-framework/reference/core/aop.html)
- [Bean Validation 스펙](https://beanvalidation.org/)
- [RFC 7807 Problem Details](https://www.rfc-editor.org/rfc/rfc7807)

## 문의 및 피드백

학습 중 궁금한 점이 있다면 코드의 주석을 먼저 확인하세요.
각 파일에 **"학습 포인트"**와 **"실무 팁"**이 상세히 작성되어 있습니다.

---

**Happy Learning! 🚀**

이 프로젝트는 실무 중심 학습을 위해 설계되었습니다.
각 코드를 직접 실행해보고, 수정해보고, 깨뜨려보세요.
그게 가장 빠른 학습 방법입니다!
