# 1단계: Basic — 타입의 기초

TypeScript를 처음 접하는 분을 위한 단계입니다. "타입을 붙인다"는 감각을 익히는 것이 목표입니다.

## 학습 목표

- 타입 표기(annotation)와 타입 추론(inference)의 차이를 안다
- `any`를 피하고 `unknown`을 쓰는 이유를 이해한다
- 함수의 입출력에 타입을 붙일 수 있다
- `interface`로 객체 모양을 정의할 수 있다
- 유니온 타입을 `if`/`switch`로 안전하게 좁혀 쓸 수 있다

## 레슨

| 순서 | 파일 | 한 줄 요약 |
|------|------|-----------|
| 1 | `01-types.ts` | 원시 타입, 추론, `any`/`unknown`/`never`, 리터럴 타입 |
| 2 | `02-functions.ts` | 매개변수·반환 타입, 옵셔널/기본값/rest, 함수 타입, 오버로드 |
| 3 | `03-objects-and-interfaces.ts` | `interface`, 옵셔널/`readonly`, 확장, 인덱스 시그니처 |
| 4 | `04-union-and-narrowing.ts` | `|`, `typeof`/`in`/`instanceof` 좁히기, `switch` 완전성 검사 |
| 5 | `05-arrays-tuples-enums.ts` | 배열/`readonly` 배열, 튜플, `enum` vs `as const` |

## 실행

```bash
npx tsx src/1-basic/01-types.ts
# ...
npm run basic   # 5개 전부 순서대로
```

## 핵심 요약 (치트시트)

```ts
// 표기
const a: number = 1;
let b: string | null = null;

// 함수
function f(x: number, y = 0, ...rest: number[]): number { return x + y; }

// 객체
interface User { id: number; name?: string; readonly createdAt: Date; }

// 좁히기
function g(v: string | number) {
  if (typeof v === 'string') v.toUpperCase();
  else v.toFixed(2);
}

// enum 대체
const Color = { Red: 'red', Blue: 'blue' } as const;
type Color = (typeof Color)[keyof typeof Color];
```

## 흔한 실수

- **`any` 남용**: 타입 오류를 "숨기는" 것이지 "해결"이 아닙니다. `unknown` + 좁히기를 쓰세요.
- **옵셔널(`?`) 값을 그냥 사용**: `user.age + 1` → `age`가 `undefined`일 수 있음. `?? 0` 등으로 처리.
- **`==` 사용**: TS/JS 모두 `===`(엄격 비교)를 기본으로 쓰세요.
