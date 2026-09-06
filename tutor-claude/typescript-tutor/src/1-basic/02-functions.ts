/**
 * ============================================================================
 * 02. 함수와 타입 (Functions)
 * ============================================================================
 *
 * 함수는 "입력(매개변수)"과 "출력(반환값)"의 타입을 명확히 하는 것이 핵심입니다.
 * 실무에서 타입 표기를 가장 많이 하는 곳이 바로 함수의 시그니처입니다.
 *
 * 실행:  npx tsx src/1-basic/02-functions.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 매개변수 타입 + 반환 타입
// ----------------------------------------------------------------------------
// (a: number, b: number) 는 매개변수 타입, 화살표 뒤 `: number` 는 반환 타입
function add(a: number, b: number): number {
  return a + b;
}

// 반환 타입은 생략해도 추론됨. 하지만 "공개 API"에는 명시하는 걸 권장.
// (실수로 다른 타입을 반환하면 함수 정의부에서 바로 에러가 나기 때문)
const multiply = (a: number, b: number) => a * b; // 반환 타입 number 로 추론

// ----------------------------------------------------------------------------
// 2) 옵셔널 매개변수(?) 와 기본값
// ----------------------------------------------------------------------------
// greeting? → 있어도 되고 없어도 됨. 없으면 타입이 `string | undefined`
function greet(name: string, greeting?: string): string | number {
  // greeting 이 undefined 일 수 있으므로 기본값 처리 필요
  const g = greeting ?? '안녕하세요'; // ?? = null/undefined 일 때만 오른쪽 사용
  return `${g}, ${name}님!`;
}

// 기본값을 주면 매개변수는 자동으로 옵셔널이 됨 (타입은 string 으로 유지)
function createUser(name: string, role: string = 'member') {
  return { name, role };
}

// ----------------------------------------------------------------------------
// 3) 나머지 매개변수 (rest parameters)
// ----------------------------------------------------------------------------
// ...nums 는 "나머지 인자 전부를 배열로 모은다"
function sum(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

// ----------------------------------------------------------------------------
// 4) 함수 타입 (함수를 값으로 전달할 때)
// ----------------------------------------------------------------------------
// "number 두 개를 받아 number를 반환하는 함수" 라는 타입
type BinaryOp = (a: number, b: number) => number;

const operations: Record<string, BinaryOp> = {
  add: (a, b) => a + b,        // 매개변수 타입은 BinaryOp에서 추론되므로 생략 가능
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
};

// 콜백을 받는 함수
function repeat(times: number, action: (index: number) => void): void {
  for (let i = 0; i < times; i++) action(i);
}

// ----------------------------------------------------------------------------
// 5) 함수 오버로드 (overload): 인자 형태에 따라 반환 타입이 달라질 때
// ----------------------------------------------------------------------------
// "선언"을 여러 개 두고, 마지막 "구현"에서 실제 로직을 처리한다.
function parseInput(input: string): string[];
function parseInput(input: number): number[];
function parseInput(input: string | number): string[] | number[] {
  if (typeof input === 'string') {
    return input.split(','); // string[] 반환
  }
  return [input, input * 2]; // number[] 반환
}

const a1 = parseInput('a,b,c'); // 타입: string[]
const a2 = parseInput(10);       // 타입: number[]

// ----------------------------------------------------------------------------
// 6) 실무 팁: 객체 하나로 매개변수 받기 (named parameters 패턴)
// ----------------------------------------------------------------------------
// 매개변수가 3개 이상이면 순서 실수가 잦으므로 객체로 묶는 편이 안전합니다.
interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
}
function sendEmail({ to, subject, body, cc = [] }: SendEmailOptions): void {
  console.log(`메일 발송 → ${to} / 제목: ${subject} / 참조: ${cc.length}명`);
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 02. 함수 ---');
console.log('add(2,3) =', add(2, 3));
console.log('multiply(2,3) =', multiply(2, 3));
console.log('greet =', greet('철수'));
console.log('greet(인사 지정) =', greet('영희', '반가워요'));
console.log('createUser =', createUser('민수'));
console.log('sum(1..5) =', sum(1, 2, 3, 4, 5));
console.log('operations.subtract(10,4) =', operations.subtract!(10, 4));
repeat(3, (i) => console.log(`  repeat #${i}`));
console.log('parseInput("a,b,c") =', a1);
console.log('parseInput(10) =', a2);
sendEmail({ to: 'test@example.com', subject: '가입 환영', body: '...' });

export {};
