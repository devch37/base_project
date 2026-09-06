# TypeScript 단계별 학습 프로젝트 (typescript-tutor)

> TypeScript를 **하나도 모르는 상태**에서 시작해서, 실무에 바로 쓸 수 있는 수준까지
> `basic → intermediate → advanced → practical` 4단계로 학습하는 프로젝트입니다.

---

## 이 프로젝트의 특징

- **단계별 구조**: `src/1-basic` → `src/2-intermediate` → `src/3-advanced` → `src/4-practical`
- **모든 코드에 한글 주석**: "왜 이렇게 쓰는지"까지 설명
- **바로 실행 가능**: 각 레슨 파일은 `tsx`로 즉시 실행되어 결과를 눈으로 확인
- **실무 지향**: `strict` 모드 기본 적용, 실제 프로젝트에서 쓰는 패턴 중심
- **연습문제 포함**: `exercises/` 폴더에 직접 풀어보는 문제

---

## 사전 준비 (딱 한 번)

```bash
cd typescript-tutor
npm install
```

> Node.js 18 이상이 필요합니다. (`node -v`로 확인)

---

## 레슨 실행 방법

각 레슨은 독립 실행됩니다. 원하는 파일을 골라서 실행하세요.

```bash
# 예: 첫 번째 레슨 실행
npm run lesson src/1-basic/01-types.ts

# 또는 npx tsx 직접 사용
npx tsx src/1-basic/01-types.ts

# basic 전체를 순서대로 실행
npm run basic

# 프로젝트 전체 타입 검사 (실행 없이 타입 오류만 확인 — 실무에서 CI에 사용)
npm run typecheck
```

---

## 전체 커리큘럼

### 📗 1단계: Basic — 타입의 기초

| 파일 | 주제 | 핵심 키워드 |
|------|------|------------|
| `src/1-basic/01-types.ts` | 기본 타입 | `string`, `number`, `boolean`, `any`, `unknown`, `never`, 타입 추론 |
| `src/1-basic/02-functions.ts` | 함수와 타입 | 매개변수/반환 타입, 옵셔널, 기본값, rest, 함수 타입, 오버로드 |
| `src/1-basic/03-objects-and-interfaces.ts` | 객체와 인터페이스 | `interface`, `type`, 옵셔널 프로퍼티, `readonly`, 인덱스 시그니처 |
| `src/1-basic/04-union-and-narrowing.ts` | 유니온과 좁히기 | `|`, 리터럴 타입, `typeof`/`in`/`instanceof`, 타입 좁히기 |
| `src/1-basic/05-arrays-tuples-enums.ts` | 배열·튜플·열거형 | `T[]`, `readonly`, 튜플, `enum` vs `as const` |

### 📘 2단계: Intermediate — 재사용 가능한 타입 설계

| 파일 | 주제 | 핵심 키워드 |
|------|------|------------|
| `src/2-intermediate/06-type-vs-interface.ts` | type vs interface | 확장, 선언 병합, 언제 무엇을 쓰나 |
| `src/2-intermediate/07-classes.ts` | 클래스 | 접근제어자, `readonly`, `abstract`, `implements`, 파라미터 프로퍼티 |
| `src/2-intermediate/08-generics.ts` | 제네릭 | 제네릭 함수/클래스/인터페이스, `extends` 제약, 기본 타입 파라미터 |
| `src/2-intermediate/09-modules.ts` | 모듈 시스템 | `export`/`import`, 타입 전용 import, 배럴 파일, `.d.ts` |
| `src/2-intermediate/10-type-guards.ts` | 타입 가드 | 사용자 정의 타입 가드, 판별 유니온(discriminated union), `never` 완전성 체크 |

### 📙 3단계: Advanced — 타입 레벨 프로그래밍

| 파일 | 주제 | 핵심 키워드 |
|------|------|------------|
| `src/3-advanced/11-utility-types.ts` | 내장 유틸리티 타입 | `Partial`, `Required`, `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited` |
| `src/3-advanced/12-conditional-types.ts` | 조건부 타입 | `T extends U ? X : Y`, `infer`, 분배 조건부 타입 |
| `src/3-advanced/13-mapped-types.ts` | 매핑된 타입 | `[K in keyof T]`, 키 리매핑, 수정자(`+`/`-`, `readonly`, `?`) |
| `src/3-advanced/14-template-literal-types.ts` | 템플릿 리터럴 타입 | `` `${A}-${B}` ``, `Uppercase`, 이벤트 이름 타입 |
| `src/3-advanced/15-decorators.ts` | 데코레이터 | TC39 표준 데코레이터, 클래스/메서드 데코레이터, 로깅·검증 예제 |

### 📕 4단계: Practical — 실무 패턴

| 파일 | 주제 | 핵심 키워드 |
|------|------|------------|
| `src/4-practical/16-api-response-design.ts` | API 응답 타입 설계 | 제네릭 응답 래퍼, 페이지네이션, DTO ↔ 도메인 분리 |
| `src/4-practical/17-result-error-handling.ts` | 에러 핸들링 | `Result<T, E>` 패턴, 예외 대신 값으로 에러 다루기 |
| `src/4-practical/18-runtime-validation.ts` | 런타임 검증 | 타입은 컴파일 타임에만 존재한다, 파서 만들기, `unknown` 다루기 |
| `src/4-practical/19-mini-project.ts` | 미니 프로젝트 | 지금까지 배운 것을 모아 만든 "할 일 관리 도메인" |

### ✏️ 연습문제

- `exercises/README.md` 참고. 각 단계별 문제와 풀이 힌트가 있습니다.

---

## 학습 순서 추천

1. `README.md`(이 파일)로 전체 그림 파악
2. `LEARNING_GUIDE.md`로 개념 흐름 이해
3. `src/1-basic/`부터 파일을 **직접 열어 주석을 읽으며** 실행
4. 각 단계 폴더의 `README.md`에서 요점 복습
5. `exercises/`로 손에 익히기

---

## 자주 쓰는 명령어 정리

```bash
npm run lesson <파일경로>   # 특정 레슨 실행
npm run typecheck           # 전체 타입 검사 (오류만 확인)
npm run build               # dist/ 에 JS로 컴파일
npm run clean               # dist/ 삭제
```
