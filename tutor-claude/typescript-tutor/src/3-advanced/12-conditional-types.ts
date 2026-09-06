/**
 * ============================================================================
 * 12. 조건부 타입 (Conditional Types)
 * ============================================================================
 *
 * `T extends U ? X : Y`  — "T가 U에 할당 가능하면 X, 아니면 Y".
 * 타입 레벨의 삼항 연산자입니다. 유틸리티 타입 대부분이 이걸로 만들어져 있습니다.
 *
 * 실행:  npx tsx src/3-advanced/12-conditional-types.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 기본 형태
// ----------------------------------------------------------------------------
type IsString<T> = T extends string ? 'yes' : 'no';
type A = IsString<'hello'>; // 'yes'
type B = IsString<number>;  // 'no'

// ----------------------------------------------------------------------------
// 2) infer — 조건부 타입 안에서 "타입을 추출"
// ----------------------------------------------------------------------------
// 배열의 원소 타입 꺼내기
type ElementType<T> = T extends (infer E)[] ? E : never;
type E1 = ElementType<string[]>;   // string
type E2 = ElementType<number[][]>; // number[]

// Promise 안의 타입 꺼내기 (내장 Awaited 의 단순 버전)
type Unwrap<T> = T extends Promise<infer U> ? U : T;
type U1 = Unwrap<Promise<number>>; // number
type U2 = Unwrap<string>;          // string (Promise 아니면 그대로)

// 함수의 반환 타입 꺼내기 (내장 ReturnType 의 재구현)
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type R1 = MyReturnType<() => { id: number }>; // { id: number }

// 첫 번째 매개변수 타입 꺼내기
type FirstParam<T> = T extends (first: infer P, ...rest: any[]) => any ? P : never;
type P1 = FirstParam<(name: string, age: number) => void>; // string

// ----------------------------------------------------------------------------
// 3) 분배 조건부 타입 (Distributive Conditional Types)
// ----------------------------------------------------------------------------
// 조건부 타입의 T가 "naked(벌거벗은) 타입 파라미터"이고 유니온이면,
// 유니온의 각 멤버에 조건이 개별 적용된 뒤 다시 합쳐진다.
type ToArray<T> = T extends any ? T[] : never;
type Arr = ToArray<string | number>; // string[] | number[]  (❗ (string|number)[] 아님)

// 분배를 "막고" 싶으면 대괄호로 감싼다
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Arr2 = ToArrayNonDist<string | number>; // (string | number)[]

// 분배를 이용해 유니온에서 특정 타입 제거 (내장 Exclude 재구현)
type MyExclude<T, U> = T extends U ? never : T;
type Left = MyExclude<'a' | 'b' | 'c', 'b'>; // 'a' | 'c'

// ----------------------------------------------------------------------------
// 4) 실무 예시: API 함수의 응답 타입을 요청에 따라 바꾸기
// ----------------------------------------------------------------------------
type ResponseFor<TEndpoint extends string> =
  TEndpoint extends `/users/${string}` ? { id: number; name: string } :
  TEndpoint extends `/orders/${string}` ? { orderId: string; total: number } :
  unknown;

declare function apiGet<T extends string>(endpoint: T): ResponseFor<T>;
// const user = apiGet('/users/1');   // 타입: { id: number; name: string }
// const order = apiGet('/orders/9'); // 타입: { orderId: string; total: number }

// ----------------------------------------------------------------------------
// 5) 런타임에서 확인 (타입은 실행 시 사라지므로 값으로 재현)
// ----------------------------------------------------------------------------
function unwrapValue<T>(value: T | Promise<T>): Promise<T> {
  return Promise.resolve(value);
}

console.log('--- 12. 조건부 타입 ---');
console.log('아래 값들의 "타입"은 조건부 타입으로 계산됩니다 (주석 참고).');
unwrapValue(42).then((v) => console.log('unwrapValue(42) 결과 =', v));
unwrapValue(Promise.resolve('hi')).then((v) => console.log('unwrapValue(Promise) 결과 =', v));

// 타입 별칭이 실제로 어떻게 좁혀지는지 "예시 값"으로 보여주기
const arrExample: Arr = ['a', 'b']; // string[] 도 OK, number[] 도 OK
console.log('Arr(분배) 예시 값 =', arrExample);
const arr2Example: Arr2 = ['a', 1]; // (string | number)[]
console.log('Arr2(비분배) 예시 값 =', arr2Example);

export {};
