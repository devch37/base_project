# 2단계: Intermediate — 재사용 가능한 타입 설계

기초 문법을 넘어서, "여러 곳에서 재사용되는 타입"을 설계하는 단계입니다.
제네릭과 판별 유니온은 실무 코드에서 매일 마주칩니다.

## 학습 목표

- `type`과 `interface`를 상황에 맞게 선택할 수 있다
- 클래스의 접근 제어자와 `abstract`/`implements`를 이해한다
- 제네릭으로 "타입 정보를 잃지 않는" 함수/클래스를 작성한다
- `import`/`export`와 타입 전용 import를 구분해서 쓴다
- 사용자 정의 타입 가드와 판별 유니온으로 안전하게 분기한다

## 레슨

| 순서 | 파일 | 한 줄 요약 |
|------|------|-----------|
| 6 | `06-type-vs-interface.ts` | 확장 방식 차이, 선언 병합, 선택 가이드라인 |
| 7 | `07-classes.ts` | `public`/`private`/`protected`/`readonly`, 파라미터 프로퍼티, `abstract`, `implements`, `#`필드 |
| 8 | `08-generics.ts` | 제네릭 함수/클래스, `extends` 제약, `keyof`, 기본 타입 파라미터 |
| 9 | `09-modules.ts` (+`lib/`) | named/default/`import type`/배럴 파일, NodeNext 확장자 규칙 |
| 10 | `10-type-guards.ts` | `x is T`, `unknown` 검증, 판별 유니온 + `never` 완전성 검사 |

## 실행

```bash
npx tsx src/2-intermediate/06-type-vs-interface.ts
npx tsx src/2-intermediate/09-modules.ts   # lib/ 폴더와 함께 동작
```

## 핵심 요약 (치트시트)

```ts
// 제네릭 + keyof
function get<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }

// 사용자 정의 타입 가드
function isString(x: unknown): x is string { return typeof x === 'string'; }

// 판별 유니온
type Result =
  | { ok: true; value: number }
  | { ok: false; error: string };

// 완전성 검사
function assertNever(x: never): never { throw new Error('unhandled'); }
```

## 흔한 실수

- **제네릭을 반환에 안 쓰면서 선언**: `function f<T>(x: T): void` 처럼 `T`가 한 번만 등장하면 제네릭이 불필요합니다.
- **NodeNext에서 확장자 누락**: 상대경로 import에 `.js`를 안 붙이면 `Cannot find module` 에러.
- **`as`로 억지 캐스팅**: 타입 가드를 만들 자리에 `value as User`를 남발하면 런타임 버그로 이어집니다.
