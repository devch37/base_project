/**
 * ============================================================================
 * 18. 런타임 검증 (Practical)
 * ============================================================================
 *
 * ⭐ 가장 중요한 개념: "타입은 컴파일 후 완전히 사라진다."
 *    → API 응답, JSON 파일, localStorage, process.env ... 외부에서 들어온 데이터는
 *      TS가 아무것도 보장해 주지 못합니다. `as User` 는 거짓말일 뿐입니다.
 *    → 경계에서 "실제 값을 검사(parse)"해야 합니다.
 *
 * 이 레슨에서는 zod 같은 라이브러리의 축소판을 직접 만들며,
 * "런타임 검증기 + 타입 추론"이 어떻게 함께 동작하는지 배웁니다.
 *
 * 실행:  npx tsx src/4-practical/18-runtime-validation.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 0) 왜 `as` 가 위험한가
// ----------------------------------------------------------------------------
const rawFromApi: unknown = { id: '1', naem: '오타' }; // id가 문자열, name 오타
const wrong = rawFromApi as { id: number; name: string };
// wrong.id 는 "타입상" number 지만 "실제로는" 문자열 '1'. 런타임에 조용히 버그.
console.log('--- 18. 런타임 검증 ---');
console.log('as 캐스팅의 함정: typeof wrong.id =', typeof wrong.id, '(타입은 number라고 되어 있음)');

// ----------------------------------------------------------------------------
// 1) 미니 검증 라이브러리
// ----------------------------------------------------------------------------
type Validated<T> = { success: true; data: T } | { success: false; errors: string[] };

// 모든 검증기는 "unknown 을 받아 Validated<T> 를 반환하는 객체"
interface Validator<T> {
  parse(input: unknown, path?: string): Validated<T>;
}

// 검증기에서 타입을 뽑아내는 헬퍼 (zod의 z.infer 와 동일한 아이디어)
type Infer<V> = V extends Validator<infer T> ? T : never;

// --- 원시 타입 검증기 -------------------------------------------------------
const v = {
  string(): Validator<string> {
    return {
      parse(input, path = 'value') {
        return typeof input === 'string'
          ? { success: true, data: input }
          : { success: false, errors: [`${path}: 문자열이어야 합니다 (받은 값: ${typeof input})`] };
      },
    };
  },

  number(): Validator<number> {
    return {
      parse(input, path = 'value') {
        return typeof input === 'number' && !Number.isNaN(input)
          ? { success: true, data: input }
          : { success: false, errors: [`${path}: 숫자여야 합니다`] };
      },
    };
  },

  boolean(): Validator<boolean> {
    return {
      parse(input, path = 'value') {
        return typeof input === 'boolean'
          ? { success: true, data: input }
          : { success: false, errors: [`${path}: 불리언이어야 합니다`] };
      },
    };
  },

  // --- 조합기(combinator) -------------------------------------------------
  optional<T>(inner: Validator<T>): Validator<T | undefined> {
    return {
      parse(input, path) {
        if (input === undefined) return { success: true, data: undefined };
        return inner.parse(input, path);
      },
    };
  },

  array<T>(inner: Validator<T>): Validator<T[]> {
    return {
      parse(input, path = 'value') {
        if (!Array.isArray(input)) return { success: false, errors: [`${path}: 배열이어야 합니다`] };
        const result: T[] = [];
        const errors: string[] = [];
        input.forEach((item, i) => {
          const parsed = inner.parse(item, `${path}[${i}]`);
          if (parsed.success) result.push(parsed.data);
          else errors.push(...parsed.errors);
        });
        return errors.length ? { success: false, errors } : { success: true, data: result };
      },
    };
  },

  // 객체 스키마: { [key]: Validator } → Validator<{ [key]: 추론된 타입 }>
  object<S extends Record<string, Validator<unknown>>>(
    schema: S,
  ): Validator<{ [K in keyof S]: Infer<S[K]> }> {
    return {
      parse(input, path = 'value') {
        if (typeof input !== 'object' || input === null) {
          return { success: false, errors: [`${path}: 객체여야 합니다`] };
        }
        const obj = input as Record<string, unknown>;
        const data = {} as { [K in keyof S]: Infer<S[K]> };
        const errors: string[] = [];
        for (const key of Object.keys(schema)) {
          const parsed = schema[key]!.parse(obj[key], `${path}.${key}`);
          if (parsed.success) (data as Record<string, unknown>)[key] = parsed.data;
          else errors.push(...parsed.errors);
        }
        return errors.length ? { success: false, errors } : { success: true, data };
      },
    };
  },
};

// ----------------------------------------------------------------------------
// 2) 스키마 정의 → 타입은 자동 추론됨 (스키마와 타입을 두 번 쓰지 않는다!)
// ----------------------------------------------------------------------------
const UserSchema = v.object({
  id: v.number(),
  name: v.string(),
  email: v.string(),
  age: v.optional(v.number()),
  tags: v.array(v.string()),
});

// ✨ 이 한 줄로 아래 타입이 자동 생성됨:
//    { id: number; name: string; email: string; age: number | undefined; tags: string[] }
type User = Infer<typeof UserSchema>;

// ----------------------------------------------------------------------------
// 3) 실제 사용 — 경계에서 parse
// ----------------------------------------------------------------------------
function loadUser(raw: unknown): User {
  const result = UserSchema.parse(raw);
  if (!result.success) {
    throw new Error('사용자 데이터 검증 실패:\n  - ' + result.errors.join('\n  - '));
  }
  return result.data; // 여기서부터는 진짜로 User 임이 보장됨
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
const validRaw = {
  id: 1,
  name: '홍길동',
  email: 'gildong@example.com',
  tags: ['admin', 'vip'],
};
const user = loadUser(validRaw);
console.log('검증 통과:', user);

const invalidRaw = {
  id: '1', // 숫자여야 함
  name: '홍길동',
  // email 누락
  tags: ['ok', 123], // 원소는 문자열이어야 함
};
try {
  loadUser(invalidRaw);
} catch (e) {
  console.log((e as Error).message);
}

export {};
