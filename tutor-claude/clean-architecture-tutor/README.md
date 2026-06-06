# 클린 코드 & 클린 아키텍처 완전 정복

> **목표**: "왜 필요한가?"를 먼저 이해하고, 실제 코드로 배운다.
> 초보자부터 시니어까지 — 도서관 시스템을 예제로 단계적으로 배우는 가이드

---

## 목차

1. [왜 클린 코드가 필요한가?](#1-왜-클린-코드가-필요한가)
2. [클린 코드 핵심 원칙](#2-클린-코드-핵심-원칙)
3. [SOLID 원칙](#3-solid-원칙)
4. [왜 클린 아키텍처가 필요한가?](#4-왜-클린-아키텍처가-필요한가)
5. [클린 아키텍처 구조](#5-클린-아키텍처-구조)
6. [프로젝트 구조 설명](#6-프로젝트-구조-설명)
7. [실습: API 테스트하기](#7-실습-api-테스트하기)

---

## 1. 왜 클린 코드가 필요한가?

### 현실적인 시나리오

당신은 새 회사에 입사했습니다. 첫날 이런 코드를 받았습니다:

```java
// 실제 코드 (_1_bad_example/BadBookController.java)
@PostMapping("/borrow")
public ResponseEntity processAllStuff(@RequestBody Map<String, Object> req) {
    String bookId = (String) req.get("bid");
    String memberId = (String) req.get("mid");
    // ...100줄 계속...
    if (!"1".equals(foundBook.get("s"))) { ... }
    foundBook.put("s", "2");
    // ...
}
```

**이런 질문들이 떠오릅니다:**
- `"bid"`가 뭐지? book id? building id?
- `"s"`가 뭐지? status? size? score?
- `"1"`, `"2"`가 뭘 의미하지?
- 이 100줄을 다 읽어야 이해할 수 있는 건가?
- 수정하다가 다른 게 깨지면 어떡하지?

**이게 클린 코드가 필요한 이유입니다.**

### 코드는 사람이 읽는다

> "코드는 컴퓨터가 실행하지만, 사람이 읽는다."

실제로 개발자가 코드를 **읽는 시간 : 쓰는 시간 = 10 : 1** 입니다.
읽기 어려운 코드는 곧 유지보수 비용 증가 → 버그 증가 → 야근 증가입니다.

---

## 2. 클린 코드 핵심 원칙

### 원칙 1: 의미 있는 이름 짓기

**Before (나쁜 코드):**
```java
// _2_clean_code/naming/BadNamingExample.java
private int d;           // d가 뭔지?
private String s;        // s가 뭔지?
void processData(List<Object> e, int n) { ... }
```

**After (좋은 코드):**
```java
// _2_clean_code/naming/GoodNamingExample.java
private int elapsedDaysAfterLastModification;
private String bookTitle;
void processBooks(List<Book> targetBooks, int maxCount) { ... }
```

#### 이름 짓기 규칙

| 나쁜 예 | 좋은 예 | 이유 |
|--------|--------|------|
| `d` | `elapsedDays` | 의도가 명확해야 함 |
| `strUsrNm` | `userName` | 타입 접두사 불필요 |
| `genymdhms` | `creationDateTime` | 발음 가능해야 함 |
| `int hp` | `int remainingStock` | 도메인 맥락 필요 |
| `isNotEnabled` | `isEnabled` | 부정어 지양 |

---

### 원칙 2: 함수는 한 가지만 해야 한다

**Before (나쁜 코드):**
```java
// _2_clean_code/functions/BadFunctionExample.java
// 이 하나의 함수가 하는 일:
// 1. 입력값 유효성 검사
// 2. 책 조회
// 3. 회원 조회
// 4. 대출 한도 확인
// 5. 책 상태 변경
// 6. 대출 기록 저장
// 7. SMS 알림 발송
// 8. 로그 기록
public Map<String, Object> processBookBorrow(String bookId, String memberId, ...) {
    // ...100줄...
}
```

**After (좋은 코드):**
```java
// _2_clean_code/functions/GoodFunctionExample.java
// 각 함수가 딱 하나의 일만 한다!
public LoanResult borrowBook(String bookId, String memberId) {
    Book book = findAvailableBookOrThrow(bookId);     // 책 조회
    Member member = findActiveMemberOrThrow(memberId); // 회원 조회
    validateBorrowLimit(member);                       // 한도 확인
    Loan loan = createLoan(book, member);              // 대출 생성
    markBookAsBorrowed(book, member);                  // 상태 변경
    notificationService.sendBorrowConfirmation(...);   // 알림 (별도 서비스)
    return LoanResult.success(loan);
}
```

#### "한 가지 일" 판단 기준

함수 이름을 `TO` 로 시작하는 문장으로 만들었을 때 자연스러우면 OK:
- `TO borrowBook, we find the book, validate the member, and create a loan.` ✅
- `TO processBookBorrow, we validate, query DB, update DB, send SMS, and log.` ❌ (너무 많음)

---

### 원칙 3: 중복 코드를 없애라 (DRY 원칙)

**Don't Repeat Yourself** — 같은 코드가 두 곳에 있으면, 수정 시 두 곳을 모두 수정해야 합니다. 한 곳을 빠뜨리면 버그!

```java
// 나쁜 예: book(), book2() 에 똑같은 로직이 복사되어 있음
@PostMapping("/book")  { data.put("s", "1"); cnt++; list.add(data); ... }
@PostMapping("/book2") { d.put("s", "1"); d.put("id", UUID...); ... } // 미묘하게 다름!

// 좋은 예: 공통 로직을 메서드로 추출
private Book createBook(RegisterBookCommand command) {
    return Book.createNew(command.title(), command.author(), command.isbn());
}
```

---

## 3. SOLID 원칙

SOLID는 클린 코드와 클린 아키텍처의 근간이 되는 5가지 원칙입니다.
이 중 **SRP, OCP, DIP** 가 클린 아키텍처를 이해하는 핵심입니다.

### S — 단일 책임 원칙 (SRP)

> "클래스를 변경해야 하는 이유가 오직 하나여야 한다."

**파일**: `_2_clean_code/solid/srp/SingleResponsibilityPrinciple.java`

```
나쁜 예: BadBookManager
  - 대출 규칙 변경 시 → 이 클래스 수정
  - DB 변경 시       → 이 클래스 수정
  - 이메일 서버 변경  → 이 클래스 수정
  - 보고서 형식 변경  → 이 클래스 수정
  → 4가지 이유로 변경 = SRP 위반!

좋은 예:
  BookService       → "대출 규칙이 바뀔 때" 만 수정
  BookRepository    → "DB가 바뀔 때" 만 수정
  EmailService      → "이메일 서버가 바뀔 때" 만 수정
  LoanReportService → "보고서 형식이 바뀔 때" 만 수정
```

---

### O — 개방-폐쇄 원칙 (OCP)

> "확장에는 열려 있고, 수정에는 닫혀 있어야 한다."

**파일**: `_2_clean_code/solid/ocp/OpenClosedPrinciple.java`

```java
// 나쁜 예: 할인 타입 추가할 때마다 기존 메서드 수정!
public double calculateDiscount(String memberType, double price) {
    if (memberType.equals("REGULAR")) { ... }
    else if (memberType.equals("STUDENT")) { ... }
    else if (memberType.equals("SENIOR")) { ... }  // 추가할 때마다 여기 수정
    else if (memberType.equals("VIP")) { ... }     // 추가할 때마다 여기 수정
}

// 좋은 예: 새 할인 정책은 새 클래스로 추가, 기존 코드 수정 없음!
interface DiscountPolicy { double calculateDiscount(double price); }
class StudentDiscount implements DiscountPolicy { ... }
class SeniorDiscount  implements DiscountPolicy { ... }  // 그냥 추가만!
class VipDiscount     implements DiscountPolicy { ... }  // 그냥 추가만!
```

---

### D — 의존성 역전 원칙 (DIP) ⭐ 클린 아키텍처의 핵심

> "고수준 모듈은 저수준 모듈에 의존해서는 안 된다. 둘 다 추상화에 의존해야 한다."

**파일**: `_2_clean_code/solid/dip/DependencyInversionPrinciple.java`

```
나쁜 예 (의존성 방향):
  BookService ──직접 의존──> MySqlBookRepository
  (비즈니스 로직)            (MySQL 구현)
  → MySQL을 PostgreSQL로 바꾸려면 BookService를 수정해야 함!
  → 테스트 시 MySQL이 없으면 테스트 불가능!

좋은 예 (의존성 역전):
  BookService ──의존──> [BookRepository 인터페이스] <──구현── MySqlRepositoryImpl
  (비즈니스 로직)        (추상화)                            (MySQL 구현)
                                                  <──구현── PostgreSqlRepositoryImpl
                                                  <──구현── InMemoryRepositoryImpl (테스트용)
  → DB를 바꿔도 BookService 코드 변경 없음!
  → 테스트 시 InMemory 구현체 사용 → 빠르고 안정적!
```

---

## 4. 왜 클린 아키텍처가 필요한가?

### "스파게티 아키텍처"의 문제

시간이 지날수록 코드는 이렇게 됩니다:

```
[Controller] ──직접 호출──> [Service] ──직접 호출──> [Repository]
     |                          |                         |
     └──비즈니스 로직──┐         └──DB 로직──┐             └──외부 API 호출
                      |                    |
               (어디에 있는지              (어디에 있는지
                  아무도 모름)              아무도 모름)
```

**실제로 발생하는 문제들:**

```
상황 1: "MySQL을 MongoDB로 바꿔야 해요"
  → JPA 관련 코드가 Service, Controller 여기저기에 있음
  → 전체 코드를 다 뒤져야 함
  → 얼마나 걸릴지 아무도 모름

상황 2: "이 기능만 테스트해봐"
  → 이 Service를 테스트하려면 DB가 있어야 하고
  → DB를 쓰려면 Spring이 떠야 하고
  → Spring이 뜨려면 외부 API 설정이 있어야 하고...
  → 테스트 하나 돌리는 데 30초

상황 3: "비즈니스 로직이 어디 있어요?"
  → Controller에도 있고, Service에도 있고, Repository에도 있고
  → 새 팀원이 온보딩하는 데 2주가 걸림

상황 4: "이 기능만 독립적으로 배포할 수 있나요?"
  → 모든 것이 얽혀 있어서 불가능
```

### 클린 아키텍처가 이를 해결한다

클린 아키텍처는 **의존성의 방향을 제어**합니다.

```
                    ┌─────────────────────────────────┐
                    │  Presentation Layer (표현 계층)   │
                    │  Controller, DTO                 │
                    └──────────────┬──────────────────┘
                                   │ 의존
                    ┌──────────────▼──────────────────┐
                    │  Domain Layer (도메인 계층)        │
                    │  Model, UseCase, Service         │
                    │  ← 비즈니스 규칙이 여기에만 있음  │
                    └──────────────┬──────────────────┘
                                   │ 포트(인터페이스)로만 소통
                    ┌──────────────▼──────────────────┐
                    │  Infrastructure Layer (인프라)    │
                    │  JPA, MongoDB, REST Client       │
                    └─────────────────────────────────┘

핵심 규칙: 의존성은 항상 "바깥 → 안쪽" 방향만 허용
  - Presentation → Domain (OK)
  - Infrastructure → Domain (OK)
  - Domain → Infrastructure (절대 안됨!)
```

**이 구조의 장점:**

| 상황 | 스파게티 | 클린 아키텍처 |
|------|---------|-------------|
| DB 교체 | 전체 코드 수정 | `BookRepositoryAdapter` 만 교체 |
| 단위 테스트 | Spring + DB 필요 (30초) | 순수 Java (0.1초) |
| 비즈니스 로직 위치 | 여기저기 | 오직 도메인 계층 |
| 새 팀원 온보딩 | UseCase 파일 보면 기능 파악 가능 |

---

## 5. 클린 아키텍처 구조

### 헥사고날 아키텍처 (Hexagonal Architecture)

클린 아키텍처의 구체적인 구현 패턴 중 하나. "포트-어댑터 아키텍처"라고도 불린다.

```
                          ┌───────────────────────────────────────┐
                          │               도메인 (핵심)              │
  HTTP 요청               │                                         │
  ──────────►  Controller │  ┌─────────┐    ┌──────────────────┐  │  ◄── JPA (어댑터)
  (들어오는 어댑터)         │  │  Port   │───►│ Domain Service   │  │
                          │  │  (In)   │    │ (UseCase 구현)    │  │
                          │  └─────────┘    │                  │  │
  ──────────►  Controller │                 │  Domain Model    │  │  ◄── MongoDB
                          │                 │  (Book, Member)  │  │       (어댑터)
                          │                 └────────┬─────────┘  │
                          │                          │             │
                          │  ┌─────────┐            ▼             │  ◄── REST API
                          │  │  Port   │  BookRepositoryPort       │       (어댑터)
                          │  │  (Out)  │  (인터페이스만 알고 있음) │
                          │  └─────────┘                          │
                          └───────────────────────────────────────┘

포트(Port): 도메인이 외부와 소통하는 창구 (인터페이스)
어댑터(Adapter): 포트의 실제 구현체 (JPA, MongoDB, HTTP 클라이언트 등)
```

### 의존성 흐름 상세

```
[HTTP 요청]
    ↓
[BookController]          ← Presentation Layer
    ↓ (RegisterBookUseCase 인터페이스 호출)
[RegisterBookService]     ← Domain Layer (UseCase 구현)
    ↓ (BookRepositoryPort 인터페이스 호출)
[BookRepositoryAdapter]   ← Infrastructure Layer (포트 구현)
    ↓
[BookJpaRepository]       ← Infrastructure Layer (Spring Data JPA)
    ↓
[H2/MySQL Database]
```

**핵심**: `RegisterBookService`는 `BookRepositoryAdapter`의 존재를 모른다!
오직 `BookRepositoryPort` 인터페이스만 알고 있다.

---

## 6. 프로젝트 구조 설명

```
src/main/java/com/tutor/library/
│
├── _1_bad_example/                          # 1단계: 나쁜 코드 예시
│   └── BadBookController.java               # ← 여기서 시작! 문제가 뭔지 파악
│
├── _2_clean_code/                           # 2단계: 클린 코드 원칙
│   ├── naming/
│   │   ├── BadNamingExample.java            # 나쁜 이름 예시
│   │   └── GoodNamingExample.java           # 좋은 이름 예시
│   ├── functions/
│   │   ├── BadFunctionExample.java          # 나쁜 함수 예시
│   │   └── GoodFunctionExample.java         # 좋은 함수 예시
│   └── solid/
│       ├── srp/SingleResponsibilityPrinciple.java  # 단일 책임 원칙
│       ├── ocp/OpenClosedPrinciple.java            # 개방-폐쇄 원칙
│       └── dip/DependencyInversionPrinciple.java   # 의존성 역전 원칙
│
└── _3_clean_architecture/                   # 3단계: 클린 아키텍처
    ├── domain/                              # 도메인 계층 (핵심)
    │   ├── model/
    │   │   ├── Book.java                    # 도메인 모델 (순수 Java!)
    │   │   ├── BookStatus.java              # 매직 넘버 대신 Enum
    │   │   └── Member.java                  # 도메인 모델
    │   ├── port/
    │   │   ├── in/                          # 인커밍 포트 (유스케이스)
    │   │   │   ├── RegisterBookUseCase.java  # "시스템이 할 수 있는 것"
    │   │   │   ├── BorrowBookUseCase.java
    │   │   │   └── GetBooksUseCase.java
    │   │   └── out/                         # 아웃고잉 포트 (인프라 인터페이스)
    │   │       ├── BookRepositoryPort.java   # "DB에게 요청하는 것"
    │   │       └── MemberRepositoryPort.java
    │   └── service/                         # 도메인 서비스 (유스케이스 구현)
    │       ├── RegisterBookService.java
    │       ├── BorrowBookService.java
    │       └── GetBooksService.java
    │
    ├── infrastructure/                      # 인프라 계층 (기술 구현)
    │   ├── persistence/
    │   │   ├── BookJpaEntity.java            # JPA 엔티티 (도메인과 분리!)
    │   │   ├── BookJpaRepository.java        # Spring Data JPA
    │   │   ├── BookRepositoryAdapter.java    # 포트 구현 (어댑터)
    │   │   └── ...Member 관련 파일들
    │   └── config/
    │       └── DataLoader.java              # 초기 테스트 데이터
    │
    └── presentation/                        # 표현 계층 (HTTP)
        ├── BookController.java              # HTTP 요청/응답만 처리
        ├── GlobalExceptionHandler.java      # 예외 처리
        └── dto/
            ├── RegisterBookRequest.java     # 요청 DTO
            ├── BorrowBookRequest.java
            └── BookResponse.java            # 응답 DTO
```

### 각 계층이 무엇을 아는가?

```
Presentation Layer (BookController)
  - 알고 있는 것: HTTP, RegisterBookUseCase (인터페이스)
  - 모르는 것: DB, JPA, 실제 구현 클래스

Domain Layer (RegisterBookService)
  - 알고 있는 것: Book (도메인 모델), BookRepositoryPort (인터페이스)
  - 모르는 것: JPA, HTTP, Spring MVC, MySQL

Infrastructure Layer (BookRepositoryAdapter)
  - 알고 있는 것: JPA, Book (도메인 모델), BookRepositoryPort (구현해야 함)
  - 모르는 것: HTTP, Controller, Spring MVC
```

---

## 7. 실습: API 테스트하기

### 실행 방법

```bash
cd clean-architecture-tutor
./gradlew bootRun
```

서버 시작 후 콘솔에 아래가 출력됩니다:
```
==============================================
테스트 데이터가 로드되었습니다!
API 테스트: http://localhost:8080/api/books
H2 Console: http://localhost:8080/h2-console
  JDBC URL: jdbc:h2:mem:library
==============================================
```

---

### API 테스트 (curl)

#### 1. 책 등록

```bash
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "클린 코드",
    "author": "Robert C. Martin",
    "isbn": "9788966260959"
  }'
```

**응답:**
```json
{
  "id": 1,
  "title": "클린 코드",
  "author": "Robert C. Martin",
  "isbn": "9788966260959",
  "status": "AVAILABLE",
  "statusDescription": "대출 가능",
  "borrowedByMemberId": null,
  "borrowedAt": null
}
```

---

#### 2. 책 목록 조회

```bash
curl http://localhost:8080/api/books
```

---

#### 3. 책 대출 (회원 ID 1번이 책 1번을 대출)

```bash
curl -X POST http://localhost:8080/api/books/borrow \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": 1,
    "memberId": 1
  }'
```

**응답:**
```json
{
  "id": 1,
  "title": "클린 코드",
  "status": "BORROWED",
  "statusDescription": "대출 중",
  "borrowedByMemberId": "1",
  "borrowedAt": "2024-01-15T10:30:00"
}
```

---

#### 4. 이미 대출된 책 다시 대출 시도 (비즈니스 규칙 확인)

```bash
curl -X POST http://localhost:8080/api/books/borrow \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": 1,
    "memberId": 2
  }'
```

**응답 (409 Conflict):**
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "책 '클린 코드'는 현재 대출 중입니다."
}
```

---

### 테스트 실행

```bash
./gradlew test
```

**클린 아키텍처의 테스트 장점:**
- Spring 컨텍스트 없이 실행 → 빠름 (0.1초 이내)
- 실제 DB 없이 InMemory 구현체로 테스트
- 비즈니스 로직만 정확히 테스트 가능

---

## 핵심 정리

### 클린 코드 = 읽기 좋은 코드

1. **이름**: 변수/함수/클래스 이름만 봐도 의도를 알 수 있어야 한다
2. **함수**: 한 가지 일만 해야 한다, 20줄 이내 권장
3. **중복 제거**: 같은 로직은 한 곳에만 있어야 한다 (DRY)
4. **주석 최소화**: 코드 자체가 문서가 되도록 작성

### 클린 아키텍처 = 변화에 강한 구조

1. **도메인이 중심**: 비즈니스 규칙은 도메인 레이어에만 존재
2. **의존성 방향**: 항상 바깥 → 안쪽 (도메인은 인프라를 모른다)
3. **포트-어댑터**: 인터페이스로 소통, 구현체를 쉽게 교체 가능
4. **테스트 용이성**: 각 레이어를 독립적으로 테스트 가능

### "왜" 를 기억하라

```
클린 코드를 쓰는 이유:
  → 나 포함 팀 전체의 생산성을 높이기 위해

클린 아키텍처를 쓰는 이유:
  → 비즈니스가 변화해도 코드가 쉽게 따라갈 수 있도록
  → "MySQL을 MongoDB로 바꿔주세요" 같은 요청에 자신 있게 "OK"라고 할 수 있도록
```

---

## 추천 도서

- **클린 코드** - Robert C. Martin
- **클린 아키텍처** - Robert C. Martin
- **만들면서 배우는 클린 아키텍처** - Tom Hombergs (Java + Spring 실전서)
- **도메인 주도 설계** - Eric Evans
