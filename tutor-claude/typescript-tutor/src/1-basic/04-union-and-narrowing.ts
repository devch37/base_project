/**
 * ============================================================================
 * 04. 유니온 타입과 타입 좁히기 (Union & Narrowing)
 * ============================================================================
 *
 * 유니온(|) = "여러 타입 중 하나".
 * 유니온 값을 안전하게 쓰려면 "지금 이 값이 정확히 어떤 타입인지" 코드로 확인해서
 * 범위를 좁혀야 합니다. 이걸 "narrowing(좁히기)"라고 합니다.
 *
 * 실행:  npx tsx src/1-basic/04-union-and-narrowing.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 유니온 타입 기본
// ----------------------------------------------------------------------------
type Id = number | string;

function printId(id: Id): void {
  // id 는 number 또는 string. 공통으로 가능한 연산만 바로 쓸 수 있음.
  console.log('ID:', id);

  // number 전용 메서드나 string 전용 메서드는 좁힌 뒤에 사용
  if (typeof id === 'string') {
    console.log('  (문자열) 대문자:', id.toUpperCase());
  } else {
    console.log('  (숫자) 고정소수점:', id.toFixed(2));
  }
}

// ----------------------------------------------------------------------------
// 2) typeof 좁히기 — 원시 타입 판별에 사용
// ----------------------------------------------------------------------------
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return value.toLocaleString('ko-KR');
  return value ? '참' : '거짓'; // 여기서 value 는 boolean 으로 좁혀짐
}

// ----------------------------------------------------------------------------
// 3) 진리값(truthiness) 좁히기 — null/undefined 제거에 자주 사용
// ----------------------------------------------------------------------------
function getLength(text: string | null | undefined): number {
  if (!text) return 0;        // null, undefined, '' 를 한 번에 걸러냄
  return text.length;         // 여기서 text 는 string
}

// ----------------------------------------------------------------------------
// 4) in 연산자 좁히기 — 객체가 특정 프로퍼티를 갖는지로 판별
// ----------------------------------------------------------------------------
interface Dog {
  bark(): string;
}
interface Cat {
  meow(): string;
}
function speak(animal: Dog | Cat): string {
  if ('bark' in animal) return animal.bark(); // Dog 로 좁혀짐
  return animal.meow();                        // Cat 으로 좁혀짐
}

// ----------------------------------------------------------------------------
// 5) instanceof 좁히기 — 클래스 인스턴스 판별
// ----------------------------------------------------------------------------
class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}
function handleError(err: unknown): string {
  if (err instanceof ApiError) return `API 에러(${err.statusCode}): ${err.message}`;
  if (err instanceof Error) return `일반 에러: ${err.message}`;
  return '알 수 없는 에러';
}

// ----------------------------------------------------------------------------
// 6) 리터럴 유니온 + switch (실무에서 매우 흔한 패턴)
// ----------------------------------------------------------------------------
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

function describeMethod(method: HttpMethod): string {
  switch (method) {
    case 'GET':
      return '조회';
    case 'POST':
      return '생성';
    case 'PUT':
      return '수정';
    case 'DELETE':
      return '삭제';
    default:
      // 모든 case를 처리했다면 여기 method 의 타입은 never.
      // 나중에 HttpMethod에 값을 추가하면 이 줄에서 컴파일 에러가 나서
      // "처리 안 한 case가 있다"는 걸 알려준다. (완전성 검사)
      const _exhaustive: never = method;
      return _exhaustive;
  }
}

// ----------------------------------------------------------------------------
// 7) 타입 별칭으로 유니온에 이름 붙이기 + 옵셔널 체이닝
// ----------------------------------------------------------------------------
interface Profile {
  bio?: string;
  social?: {
    twitter?: string;
  };
}
function getTwitter(profile: Profile): string {
  // ?. → 앞이 null/undefined 면 즉시 undefined 반환 (에러 안 남)
  return profile.social?.twitter ?? '(없음)';
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 04. 유니온과 좁히기 ---');
printId(42);
printId('user-abc');
console.log('formatValue:', formatValue('hi'), formatValue(1234567), formatValue(true));
console.log('getLength(null) =', getLength(null), '| getLength("hello") =', getLength('hello'));
console.log('speak(dog) =', speak({ bark: () => '멍멍' }));
console.log('speak(cat) =', speak({ meow: () => '야옹' }));
console.log(handleError(new ApiError(404, 'Not Found')));
console.log(handleError(new Error('그냥 에러')));
console.log('describeMethod("POST") =', describeMethod('POST'));
console.log('getTwitter =', getTwitter({ social: { twitter: '@ts' } }));
console.log('getTwitter(빈 프로필) =', getTwitter({}));

export {};
