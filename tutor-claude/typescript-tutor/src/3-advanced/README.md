# 3단계: Advanced — 타입 레벨 프로그래밍

타입 자체를 "계산"하는 단계입니다. 라이브러리를 만들거나, 반복되는 타입 정의를
자동화하거나, 프레임워크 코드를 읽을 때 필요한 지식입니다.

> ⚠️ 처음에는 어렵게 느껴지는 게 정상입니다. 각 예시의 "결과 타입" 주석을 먼저 보고,
> 어떻게 그렇게 되는지 거꾸로 따라가 보세요.

## 학습 목표

- 내장 유틸리티 타입을 외워서 바로 쓸 수 있다
- `T extends U ? X : Y` 와 `infer` 로 타입을 추출한다
- `[K in keyof T]` 로 타입을 변형하고 키를 리매핑한다
- 템플릿 리터럴 타입으로 문자열 규칙을 타입으로 표현한다
- 데코레이터의 동작 시점과 실무(NestJS) 패턴을 이해한다

## 레슨

| 순서 | 파일 | 한 줄 요약 |
|------|------|-----------|
| 11 | `11-utility-types.ts` | `Partial`/`Required`/`Readonly`/`Pick`/`Omit`/`Record`/`Exclude`/`ReturnType`/`Awaited` |
| 12 | `12-conditional-types.ts` | 조건부 타입, `infer`, 분배 조건부 타입, `Exclude` 재구현 |
| 13 | `13-mapped-types.ts` | `[K in keyof T]`, `+`/`-` 수정자, `as` 키 리매핑, 폼 상태 자동 생성 |
| 14 | `14-template-literal-types.ts` | `` `${A}-${B}` ``, `Capitalize`, 라우트 파라미터 추출 |
| 15 | `15-decorators.ts` | 클래스/메서드/프로퍼티 데코레이터, 팩토리, 표준 데코레이터 비교 |

## 핵심 요약 (치트시트)

```ts
// 조건부 + infer
type ElementType<T> = T extends (infer E)[] ? E : never;
type RT<T> = T extends (...a: any[]) => infer R ? R : never;

// 매핑 + 수정자 + 키 리매핑
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };

// 템플릿 리터럴
type Route = `/api/${string}`;
type EventName<T extends string> = `on${Capitalize<T>}`;
```

## 언제 쓰고 언제 멈춰야 하나

- ✅ 반복되는 타입 정의를 하나의 제네릭으로 통합할 때
- ✅ 라이브러리/공용 유틸의 타입 안정성을 높일 때
- ❌ 앱 비즈니스 로직에서 5줄이면 될 걸 20줄짜리 조건부 타입으로 만들 때
  → "동료가 읽고 이해할 수 있는가?"가 기준입니다.
