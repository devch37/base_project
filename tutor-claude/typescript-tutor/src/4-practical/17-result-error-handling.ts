/**
 * ============================================================================
 * 17. 에러 핸들링 — Result 패턴 (Practical)
 * ============================================================================
 *
 * JS의 try/catch 는 "무엇이 던져지는지" 타입으로 알 수 없습니다 (catch 는 unknown).
 * Rust/Go 스타일의 "에러를 값으로 반환하는" Result<T, E> 패턴을 배웁니다.
 * 예외를 쓰지 말라는 게 아니라, "예상 가능한 실패"는 값으로 다루자는 것입니다.
 *
 * 실행:  npx tsx src/4-practical/17-result-error-handling.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) Result 타입 정의 (판별 유니온)
// ----------------------------------------------------------------------------
type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
type Result<T, E = Error> = Ok<T> | Err<E>;

// 생성 헬퍼
const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
const err = <E>(error: E): Err<E> => ({ ok: false, error });

// ----------------------------------------------------------------------------
// 2) 도메인 에러를 타입으로 명시 (문자열 리터럴 유니온)
// ----------------------------------------------------------------------------
type ParseError =
  | { kind: 'EMPTY_INPUT' }
  | { kind: 'NOT_A_NUMBER'; received: string }
  | { kind: 'OUT_OF_RANGE'; value: number; min: number; max: number };

function parseAge(input: string): Result<number, ParseError> {
  const trimmed = input.trim();
  if (trimmed === '') return err({ kind: 'EMPTY_INPUT' });

  const num = Number(trimmed);
  if (Number.isNaN(num)) return err({ kind: 'NOT_A_NUMBER', received: input });

  if (num < 0 || num > 150) {
    return err({ kind: 'OUT_OF_RANGE', value: num, min: 0, max: 150 });
  }
  return ok(num);
}

// 에러를 사람이 읽는 메시지로 (switch 완전성 검사 — 10번 레슨)
function describeParseError(e: ParseError): string {
  switch (e.kind) {
    case 'EMPTY_INPUT':
      return '나이를 입력해 주세요.';
    case 'NOT_A_NUMBER':
      return `"${e.received}" 는 숫자가 아닙니다.`;
    case 'OUT_OF_RANGE':
      return `${e.value}는 허용 범위(${e.min}~${e.max})를 벗어났습니다.`;
  }
}

// ----------------------------------------------------------------------------
// 3) Result 조합 헬퍼 (map / andThen / unwrapOr)
// ----------------------------------------------------------------------------
function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

// ----------------------------------------------------------------------------
// 4) try/catch 를 Result 로 감싸는 어댑터 (외부 라이브러리 경계에서 사용)
// ----------------------------------------------------------------------------
function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 17. Result 패턴 ---');

for (const input of ['32', '  ', 'abc', '200', '25']) {
  const result = parseAge(input);
  if (result.ok) {
    console.log(`  "${input}" → 유효한 나이: ${result.value}`);
  } else {
    console.log(`  "${input}" → 실패: ${describeParseError(result.error)}`);
  }
}

// 조합 예시: 나이 파싱 → 성인 여부 판단 → 기본값 처리
const pipeline = andThen(parseAge('19'), (age) =>
  age >= 19 ? ok(`성인 (${age}세)`) : err({ kind: 'OUT_OF_RANGE' as const, value: age, min: 19, max: 150 }),
);
console.log('  조합 결과:', unwrapOr(pipeline, '미성년자'));

// JSON 파싱을 Result 로
const parsed = tryCatch(() => JSON.parse('{"name": "홍길동"}') as { name: string });
console.log('  JSON 파싱:', parsed.ok ? parsed.value : parsed.error.message);

const badParsed = tryCatch(() => JSON.parse('{ 깨진 json '));
console.log('  깨진 JSON:', badParsed.ok ? '성공' : `실패 - ${badParsed.error.message.slice(0, 30)}...`);

await tryCatchAsync(async () => {
  throw new Error('네트워크 타임아웃');
}).then((r) => console.log('  async 결과:', r.ok ? r.value : r.error.message));

const doubled = map(parseAge('21'), (n) => n * 2);
console.log('  map(파싱, *2):', doubled);

export {};
