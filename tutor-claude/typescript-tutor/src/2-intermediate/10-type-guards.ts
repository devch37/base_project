/**
 * ============================================================================
 * 10. 타입 가드 & 판별 유니온 (Type Guards & Discriminated Unions)
 * ============================================================================
 *
 * 04번에서 배운 "좁히기"를 재사용 가능한 함수로 만들고,
 * 실무에서 가장 강력한 패턴인 "판별 유니온"을 배웁니다.
 *
 * 실행:  npx tsx src/2-intermediate/10-type-guards.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 사용자 정의 타입 가드 — 반환 타입에 `x is T` 를 쓴다
// ----------------------------------------------------------------------------
interface Cat {
  type: 'cat';
  meow(): void;
}
interface Dog {
  type: 'dog';
  bark(): void;
}
type Animal = Cat | Dog;

// 반환값이 true 이면, 호출한 쪽에서 animal 이 Cat 으로 좁혀진다.
function isCat(animal: Animal): animal is Cat {
  return animal.type === 'cat';
}

function handle(animal: Animal): void {
  if (isCat(animal)) {
    animal.meow(); // Cat 으로 좁혀짐
  } else {
    animal.bark(); // Dog 로 좁혀짐
  }
}

// ----------------------------------------------------------------------------
// 2) unknown 을 다루는 타입 가드 (실무: 외부 데이터 검증에 필수)
// ----------------------------------------------------------------------------
interface User {
  id: number;
  name: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as Record<string, unknown>).id === 'number' &&
    typeof (value as Record<string, unknown>).name === 'string'
  );
}

function processApiData(raw: unknown): string {
  if (!isUser(raw)) return '유효하지 않은 사용자 데이터';
  return `사용자 ${raw.name} (#${raw.id})`; // raw 는 User 로 좁혀짐
}

// ----------------------------------------------------------------------------
// 3) 판별 유니온 (Discriminated Union) — ⭐ 실무 핵심 패턴
// ----------------------------------------------------------------------------
// 각 멤버가 공통의 "판별 필드"(여기서는 status)를 리터럴 타입으로 가진다.
// switch 로 이 필드를 검사하면 나머지 필드가 자동으로 좁혀진다.
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; error: Error };

function render(state: RequestState): string {
  switch (state.status) {
    case 'idle':
      return '대기 중';
    case 'loading':
      return '불러오는 중...';
    case 'success':
      // 여기서만 state.data 에 접근 가능 (다른 case엔 data가 없음)
      return `${state.data.length}건 로드 완료`;
    case 'error':
      return `에러: ${state.error.message}`;
    default:
      return assertNever(state); // 아래 4)번 참고
  }
}

// ----------------------------------------------------------------------------
// 4) 완전성 검사 (Exhaustiveness Check) — never 를 활용
// ----------------------------------------------------------------------------
// 모든 case를 처리했다면 value 는 never. 만약 RequestState에 새 멤버를 추가하고
// switch에 case를 안 넣으면, 이 함수 호출부에서 컴파일 에러가 난다. → 실수 방지!
function assertNever(value: never): never {
  throw new Error(`처리되지 않은 케이스: ${JSON.stringify(value)}`);
}

// ----------------------------------------------------------------------------
// 5) 표준 라이브러리 타입 가드들
// ----------------------------------------------------------------------------
function examples(input: unknown): void {
  if (Array.isArray(input)) {
    console.log('  배열, 길이:', input.length);
  }
  // Array.prototype.filter + 타입 가드로 null 제거하기
  const items: (number | null)[] = [1, null, 2, null, 3];
  const clean: number[] = items.filter((x): x is number => x !== null);
  console.log('  null 제거:', clean);
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 10. 타입 가드 & 판별 유니온 ---');
handle({ type: 'cat', meow: () => console.log('  야옹') });
handle({ type: 'dog', bark: () => console.log('  멍멍') });
console.log(processApiData({ id: 1, name: '홍길동' }));
console.log(processApiData({ foo: 'bar' }));
console.log(render({ status: 'idle' }));
console.log(render({ status: 'success', data: ['a', 'b', 'c'] }));
console.log(render({ status: 'error', error: new Error('타임아웃') }));
examples([10, 20, 30]);

export {};
