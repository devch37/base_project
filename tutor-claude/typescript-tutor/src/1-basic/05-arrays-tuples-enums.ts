/**
 * ============================================================================
 * 05. 배열 · 튜플 · 열거형 (Arrays, Tuples, Enums)
 * ============================================================================
 *
 * 실행:  npx tsx src/1-basic/05-arrays-tuples-enums.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 배열 타입
// ----------------------------------------------------------------------------
const names: string[] = ['철수', '영희'];      // 가장 흔한 표기
const ages: Array<number> = [10, 20, 30];       // 제네릭 표기 (동일한 의미)

// 여러 타입이 섞인 배열 → 유니온 배열
const mixed: (string | number)[] = ['a', 1, 'b', 2, 3];

// readonly 배열 → push/pop 등 변형 메서드 사용 불가 (불변)
const frozen: readonly number[] = [1, 2, 3];
// frozen.push(4); // ❌ readonly 배열은 수정 불가

// map/filter 같은 메서드는 콜백 매개변수 타입을 자동 추론
const doubled = ages.map((n) => n * 2); // number[]

// ----------------------------------------------------------------------------
// 2) 튜플 (tuple): "길이와 각 위치의 타입이 고정된 배열"
// ----------------------------------------------------------------------------
// [경도, 위도] 처럼 순서에 의미가 있는 데이터에 사용
let coordinate: [number, number] = [37.5665, 126.978];

// 이름표 붙은 튜플 (가독성 ↑) — 동작은 동일
let httpResult: [status: number, body: string] = [200, 'OK'];

// React의 useState 반환값이 대표적인 튜플: [값, 세터]
function useToggle(initial: boolean): [boolean, () => void] {
  let state = initial;
  const toggle = () => {
    state = !state;
  };
  return [state, toggle];
}

// 구조 분해로 꺼내 쓰기
const [status, body] = httpResult;

// 나머지 요소를 가진 튜플
type Args = [command: string, ...flags: string[]];
const cliArgs: Args = ['build', '--watch', '--minify'];

// ----------------------------------------------------------------------------
// 3) enum: 이름 있는 상수 집합
// ----------------------------------------------------------------------------
// 숫자 enum (기본): 0, 1, 2 ... 자동 할당
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

// 문자열 enum (실무에서 더 선호 — 로그/디버깅 시 값이 명확)
enum LogLevel {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
}

function log(level: LogLevel, message: string): void {
  console.log(`[${level}] ${message}`);
}

// ----------------------------------------------------------------------------
// 4) enum 대신 `as const` 객체 (요즘 실무에서 더 많이 쓰는 방식)
// ----------------------------------------------------------------------------
// enum은 컴파일 시 실제 JS 객체를 생성하고 트리셰이킹이 어려운 등 단점이 있어,
// "const 객체 + as const" 로 대체하는 팀이 많습니다.
const Role = {
  Admin: 'admin',
  Member: 'member',
  Guest: 'guest',
} as const; // as const → 값이 리터럴로 고정되고 전체가 readonly

// 값들의 유니온 타입을 뽑아내는 관용구: 'admin' | 'member' | 'guest'
type Role = (typeof Role)[keyof typeof Role];

function hasWriteAccess(role: Role): boolean {
  return role === Role.Admin || role === Role.Member;
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 05. 배열 · 튜플 · 열거형 ---');
console.log({ names, ages, mixed, doubled });
console.log('coordinate =', coordinate, '| status =', status, '| body =', body);
console.log('cliArgs =', cliArgs);
const [toggled, toggle] = useToggle(false);
console.log('useToggle 초기값 =', toggled);
toggle();
console.log('Direction.Left =', Direction.Left, '| Direction[2] =', Direction[2]);
log(LogLevel.Info, '서버 시작됨');
console.log('Role =', Role, '| hasWriteAccess("guest") =', hasWriteAccess('guest'));

export {};
