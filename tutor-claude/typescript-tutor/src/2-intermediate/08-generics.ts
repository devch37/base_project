/**
 * ============================================================================
 * 08. 제네릭 (Generics)
 * ============================================================================
 *
 * 제네릭 = "타입을 매개변수로 받는" 기능.
 * "어떤 타입이든 동작하되, 그 타입 정보를 잃지 않게" 만들 때 사용합니다.
 * 배열(Array<T>), Promise<T>, Map<K, V> 등 표준 라이브러리가 전부 제네릭입니다.
 *
 * 실행:  npx tsx src/2-intermediate/08-generics.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 왜 필요한가? — any 를 쓰면 타입 정보가 사라진다
// ----------------------------------------------------------------------------
function firstAny(arr: any[]): any {
  return arr[0];
}
const x = firstAny([1, 2, 3]); // x 의 타입: any  → 이후 자동완성/검사 불가

// 제네릭으로 바꾸면 "들어온 배열의 원소 타입"을 그대로 반환
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const n = first([1, 2, 3]);       // number | undefined
const s = first(['a', 'b']);      // string | undefined
// <T> 는 호출 시 인자로부터 자동 추론됨. first<number>([1,2,3]) 처럼 명시도 가능.

// ----------------------------------------------------------------------------
// 2) 여러 타입 파라미터
// ----------------------------------------------------------------------------
function pair<K, V>(key: K, value: V): [K, V] {
  return [key, value];
}
const kv = pair('age', 30); // [string, number]

// ----------------------------------------------------------------------------
// 3) 제약 조건 (extends) — "T는 최소한 이런 모양이어야 한다"
// ----------------------------------------------------------------------------
interface HasLength {
  length: number;
}
// T 는 length 프로퍼티를 가진 무언가로 제한
function logLength<T extends HasLength>(item: T): T {
  console.log('  length =', item.length);
  return item;
}
logLength('hello');       // string 은 length 있음 → OK
logLength([1, 2, 3]);     // array 도 OK
// logLength(123);        // ❌ number 는 length 없음

// keyof 와 함께 쓰는 대표 패턴: 객체에서 안전하게 값 꺼내기
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { id: 1, name: '홍길동', active: true };
const name = getProp(user, 'name'); // 타입: string
// getProp(user, 'email');           // ❌ 'email' 은 user 의 키가 아님

// ----------------------------------------------------------------------------
// 4) 기본 타입 파라미터
// ----------------------------------------------------------------------------
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}
const r1: ApiResponse = { data: '아무거나', status: 200 };        // T = unknown
const r2: ApiResponse<number[]> = { data: [1, 2], status: 200 };  // T = number[]

// ----------------------------------------------------------------------------
// 5) 제네릭 클래스
// ----------------------------------------------------------------------------
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }
  pop(): T | undefined {
    return this.items.pop();
  }
  peek(): T | undefined {
    return this.items.at(-1);
  }
  get size(): number {
    return this.items.length;
  }
}

// ----------------------------------------------------------------------------
// 6) 제네릭 + 함수 타입 (실무: 범용 유틸)
// ----------------------------------------------------------------------------
// 배열을 특정 키 기준으로 그룹핑 — 반환 타입까지 정확히 유지
function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 08. 제네릭 ---');
console.log('first([1,2,3]) =', n, '| first(["a","b"]) =', s);
console.log('pair =', kv);
console.log('getProp(user, "name") =', name);
console.log('ApiResponse 예시 =', r1, r2);

const stack = new Stack<number>();
stack.push(10);
stack.push(20);
console.log('stack.pop() =', stack.pop(), '| size =', stack.size);

const people = [
  { name: '철수', team: 'A' },
  { name: '영희', team: 'B' },
  { name: '민수', team: 'A' },
];
console.log('groupBy team =', groupBy(people, (p) => p.team));

export {};
