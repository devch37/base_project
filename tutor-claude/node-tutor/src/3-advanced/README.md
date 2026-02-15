# 3단계: Advanced - Clean Architecture & DDD

> 프로덕션 레벨의 아키텍처 패턴을 학습합니다!

## 이 단계에서 배울 내용

### Clean Architecture
- 계층 분리 (Layered Architecture)
- 의존성 규칙 (Dependency Rule)
- 도메인 중심 설계
- 프레임워크 독립성

### Domain-Driven Design (DDD)
- Entity: 식별자를 가진 객체
- Value Object: 불변 값 객체
- Aggregate: 일관성 경계
- Repository: 영속성 추상화
- Domain Service: 도메인 로직
- Domain Event: 도메인 이벤트

### CQRS (Command Query Responsibility Segregation)
- Command: 상태 변경
- Query: 데이터 조회
- Event Handler
- @nestjs/cqrs 패키지 활용

### Architecture Layers

```
┌─────────────────────────────────────┐
│     Presentation Layer              │
│  (Controllers, DTOs, Mappers)       │
├─────────────────────────────────────┤
│     Application Layer               │
│  (Use Cases, Application Services)  │
├─────────────────────────────────────┤
│     Domain Layer                    │
│  (Entities, Value Objects, Domain   │
│   Services, Repository Interfaces)  │
├─────────────────────────────────────┤
│     Infrastructure Layer            │
│  (Database, External APIs, Impl)    │
└─────────────────────────────────────┘
```

---

## 폴더 구조

```
3-advanced/
├── domain/              # 도메인 계층
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   ├── services/
│   └── events/
│
├── application/         # 응용 계층
│   ├── use-cases/
│   ├── commands/
│   ├── queries/
│   └── services/
│
├── infrastructure/      # 인프라 계층
│   ├── persistence/
│   ├── repositories/
│   └── external-services/
│
├── presentation/        # 표현 계층
│   ├── controllers/
│   ├── dtos/
│   └── mappers/
│
└── cqrs-example/        # CQRS 패턴 예제
    ├── commands/
    ├── queries/
    └── events/
```

---

## 핵심 원칙

### 1. 의존성 규칙
- 외부 계층은 내부 계층에 의존 가능
- 내부 계층은 외부 계층을 알지 못함
- Domain은 다른 계층을 모름

### 2. 인터페이스 분리
- Repository는 인터페이스로 정의
- Domain에서 인터페이스 정의
- Infrastructure에서 구현

### 3. 단일 책임 원칙
- 각 클래스는 하나의 책임만
- Use Case는 하나의 작업만
- Entity는 비즈니스 규칙만

---

## 학습 순서

1. **도메인 모델 이해**
   - Entity vs Value Object
   - Aggregate 개념
   - Domain Event

2. **Use Case 패턴**
   - 애플리케이션 로직 캡슐화
   - Command와 Query 분리

3. **Repository 패턴**
   - 영속성 추상화
   - 인터페이스와 구현 분리

4. **CQRS 적용**
   - 명령과 조회 분리
   - Event Sourcing 개념

5. **완전한 테스트**
   - Unit Test
   - Integration Test
   - E2E Test

---

## 실행 방법

```bash
npm run start:advanced
```

---

## 실전 적용

이 단계를 완료하면:
- 확장 가능한 아키텍처 설계 가능
- 복잡한 비즈니스 로직 처리
- 마이크로서비스 아키텍처로 전환 용이
- 팀 협업에 최적화된 코드 구조

---

**주의**: 이 폴더는 현재 구조만 준비되어 있습니다.
1-2단계를 먼저 완료하고 필요하다면 추가 학습 자료를 요청하세요!

---

## 추천 학습 리소스

### 도서
- "Clean Architecture" - Robert C. Martin
- "Domain-Driven Design" - Eric Evans
- "Implementing DDD" - Vaughn Vernon

### 온라인
- [Microsoft DDD Guide](https://docs.microsoft.com/architecture/microservices/microservice-ddd-cqrs-patterns/)
- [Martin Fowler's Patterns](https://martinfowler.com/eaaCatalog/)
- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs)
