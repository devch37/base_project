/**
 * ============================================================================
 * 13. 매핑된 타입 (Mapped Types)
 * ============================================================================
 *
 * `{ [K in keyof T]: ... }`  — 기존 타입의 키를 하나씩 순회하며 새 타입을 만든다.
 * Partial / Readonly / Pick 등이 전부 이 문법으로 구현되어 있습니다.
 *
 * 실행:  npx tsx src/3-advanced/13-mapped-types.ts
 * ============================================================================
 */

interface User {
  id: number;
  name: string;
  email: string;
}

// ----------------------------------------------------------------------------
// 1) 기본: 모든 값을 boolean 으로 바꾸기
// ----------------------------------------------------------------------------
type Flags<T> = {
  [K in keyof T]: boolean;
};
type UserFlags = Flags<User>; // { id: boolean; name: boolean; email: boolean }

// "어떤 필드를 수정했는지" 추적하는 dirty 플래그 객체 등에 활용
const dirty: UserFlags = { id: false, name: true, email: false };

// ----------------------------------------------------------------------------
// 2) 수정자(modifier) 추가/제거: readonly, ?  앞에 + 또는 -
// ----------------------------------------------------------------------------
type MyPartial<T> = { [K in keyof T]?: T[K] };          // ? 추가
type MyReadonly<T> = { readonly [K in keyof T]: T[K] }; // readonly 추가

type MyRequired<T> = { [K in keyof T]-?: T[K] };            // ? 제거
type Mutable<T> = { -readonly [K in keyof T]: T[K] };       // readonly 제거

// ----------------------------------------------------------------------------
// 3) 값 타입 변형 — 각 프로퍼티를 "getter 함수"로
// ----------------------------------------------------------------------------
type Getters<T> = {
  [K in keyof T]: () => T[K];
};
type UserGetters = Getters<User>;
// { id: () => number; name: () => string; email: () => string }

// ----------------------------------------------------------------------------
// 4) 키 리매핑 (Key Remapping) — `as` 로 키 이름 자체를 바꾼다
// ----------------------------------------------------------------------------
// id -> getId, name -> getName ... (템플릿 리터럴 타입과 함께 — 14번 레슨 연결)
type GetterMethods<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type UserAccessor = GetterMethods<User>;
// { getId: () => number; getName: () => string; getEmail: () => string }

// 키 리매핑으로 특정 키 제거하기: never 를 반환하면 그 키는 사라진다
type RemoveId<T> = {
  [K in keyof T as K extends 'id' ? never : K]: T[K];
};
type UserWithoutId = RemoveId<User>; // { name: string; email: string }

// ----------------------------------------------------------------------------
// 5) 실무 예시: 폼 상태 타입 자동 생성
// ----------------------------------------------------------------------------
interface SignupForm {
  username: string;
  password: string;
  agreeToTerms: boolean;
}

// 각 필드마다 값 + 에러 메시지 + 터치 여부를 갖는 상태
type FormState<T> = {
  [K in keyof T]: {
    value: T[K];
    error: string | null;
    touched: boolean;
  };
};
type SignupFormState = FormState<SignupForm>;

const initialSignupState: SignupFormState = {
  username: { value: '', error: null, touched: false },
  password: { value: '', error: null, touched: false },
  agreeToTerms: { value: false, error: null, touched: false },
};

// ----------------------------------------------------------------------------
// 6) 실제 런타임 헬퍼: 객체를 순회해 매핑된 타입에 맞는 값 만들기
// ----------------------------------------------------------------------------
function makeGetters<T extends object>(obj: T): Getters<T> {
  const result = {} as Getters<T>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[key] = () => obj[key];
  }
  return result;
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 13. 매핑된 타입 ---');
console.log('dirty flags =', dirty);
console.log('initialSignupState =', JSON.stringify(initialSignupState, null, 2));

const user: User = { id: 7, name: '홍길동', email: 'g@x.com' };
const getters = makeGetters(user);
console.log('getters.name() =', getters.name(), '| getters.id() =', getters.id());

export {};
