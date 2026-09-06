/**
 * ============================================================================
 * 11. 내장 유틸리티 타입 (Built-in Utility Types)
 * ============================================================================
 *
 * TypeScript가 기본 제공하는 "타입을 변형하는 타입"들입니다.
 * 실무에서 매일 씁니다. 특히 Partial / Pick / Omit / Record 는 필수.
 *
 * 실행:  npx tsx src/3-advanced/11-utility-types.ts
 * ============================================================================
 */

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  age?: number;
}

// ----------------------------------------------------------------------------
// 1) Partial<T> — 모든 프로퍼티를 옵셔널로
// ----------------------------------------------------------------------------
// "부분 업데이트(PATCH)" 요청 바디에 딱 맞음
type UserPatch = Partial<User>;
// = { id?: number; name?: string; email?: string; password?: string; age?: number }

function updateUser(user: User, patch: Partial<User>): User {
  return { ...user, ...patch };
}

// ----------------------------------------------------------------------------
// 2) Required<T> — 모든 프로퍼티를 필수로 (Partial의 반대)
// ----------------------------------------------------------------------------
type FullUser = Required<User>; // age 도 필수가 됨

// ----------------------------------------------------------------------------
// 3) Readonly<T> — 모든 프로퍼티를 읽기 전용으로
// ----------------------------------------------------------------------------
type FrozenUser = Readonly<User>;
const frozen: FrozenUser = { id: 1, name: 'a', email: 'e', password: 'p' };
// frozen.name = 'b'; // ❌

// ----------------------------------------------------------------------------
// 4) Pick<T, K> — 필요한 키만 골라내기
// ----------------------------------------------------------------------------
// 클라이언트에 내려줄 "공개 프로필" — 민감 정보 제외
type PublicUser = Pick<User, 'id' | 'name'>;
// = { id: number; name: string }

// ----------------------------------------------------------------------------
// 5) Omit<T, K> — 특정 키만 제외하기 (Pick의 반대)
// ----------------------------------------------------------------------------
type SafeUser = Omit<User, 'password'>;
// 회원가입 입력값: id는 서버가 생성하므로 제외
type CreateUserInput = Omit<User, 'id'>;

// ----------------------------------------------------------------------------
// 6) Record<K, V> — "키 집합 K, 값 타입 V" 인 객체
// ----------------------------------------------------------------------------
type Role = 'admin' | 'member' | 'guest';
const permissions: Record<Role, string[]> = {
  admin: ['read', 'write', 'delete'],
  member: ['read', 'write'],
  guest: ['read'],
  // 하나라도 빠지면 컴파일 에러 → 안전한 매핑 테이블
};

// ----------------------------------------------------------------------------
// 7) Exclude / Extract — 유니온에서 빼거나 뽑기
// ----------------------------------------------------------------------------
type T1 = Exclude<'a' | 'b' | 'c', 'a'>;        // 'b' | 'c'
type T2 = Extract<'a' | 'b' | 'c', 'a' | 'z'>;  // 'a'
type NonGuestRole = Exclude<Role, 'guest'>;      // 'admin' | 'member'

// ----------------------------------------------------------------------------
// 8) NonNullable<T> — null 과 undefined 제거
// ----------------------------------------------------------------------------
type T3 = NonNullable<string | null | undefined>; // string

// ----------------------------------------------------------------------------
// 9) 함수 관련: Parameters / ReturnType / Awaited
// ----------------------------------------------------------------------------
function createOrder(userId: number, items: string[]) {
  return { orderId: 'ord_1', userId, items, total: items.length * 1000 };
}
type CreateOrderParams = Parameters<typeof createOrder>; // [number, string[]]
type Order = ReturnType<typeof createOrder>;             // { orderId: string; ... }

async function fetchUser(): Promise<User> {
  return { id: 1, name: 'a', email: 'e', password: 'p' };
}
type FetchedUser = Awaited<ReturnType<typeof fetchUser>>; // Promise 를 벗겨낸 User

// ----------------------------------------------------------------------------
// 10) 문자열 유틸: Uppercase / Lowercase / Capitalize
// ----------------------------------------------------------------------------
type Greeting = Capitalize<'hello'>; // 'Hello'
type Shout = Uppercase<'hello'>;     // 'HELLO'

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 11. 유틸리티 타입 ---');
const u: User = { id: 1, name: '홍길동', email: 'g@x.com', password: 'secret' };
console.log('updateUser =', updateUser(u, { name: '이름변경', age: 20 }));

const publicView: PublicUser = { id: u.id, name: u.name };
console.log('PublicUser =', publicView);

const input: CreateUserInput = { name: '신규', email: 'n@x.com', password: 'pw' };
console.log('CreateUserInput =', input);

console.log('permissions.member =', permissions.member);

const params: CreateOrderParams = [1, ['book', 'pen']];
const order: Order = createOrder(...params);
console.log('order =', order);

export {};
