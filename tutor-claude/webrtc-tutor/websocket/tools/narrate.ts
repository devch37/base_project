/**
 * narrate.ts — 데모 출력을 읽기 쉽게 만드는 아주 작은 도우미 (학습용)
 *
 * 데모 스크립트는 서버와 여러 클라이언트가 한 프로세스에서 같이 돌기 때문에
 * "누가 무슨 말을 했는지"가 한눈에 보여야 이해하기 쉽다.
 */
const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (c: keyof typeof C, s: string) => (useColor ? `${C[c]}${s}${C.reset}` : s);

export const say = {
  /** 장 제목 */
  title(s: string) {
    console.log('\n' + paint('bold', `━━ ${s} ━━`));
  },
  /** 설명(교육용 해설) */
  note(s: string) {
    console.log(paint('dim', `   ℹ ${s}`));
  },
  step(s: string) {
    console.log(paint('yellow', `\n▶ ${s}`));
  },
  server(s: string) {
    console.log(paint('cyan', `  [서버] `) + s);
  },
  client(name: string, s: string) {
    console.log(paint('green', `  [${name}] `) + s);
  },
  net(s: string) {
    console.log(paint('magenta', `  [네트워크] `) + s);
  },
  ok(s: string) {
    console.log(paint('green', `  ✔ ${s}`));
  },
  warn(s: string) {
    console.log(paint('red', `  ✖ ${s}`));
  },
};

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 조건이 참이 될 때까지 대기 (데모에서 "어딘가에서 일어날 일"을 기다릴 때) */
export async function until(cond: () => boolean, timeoutMs = 5000, label = '조건'): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (!cond()) {
    if (Date.now() > end) throw new Error(`시간 초과: ${label}`);
    await sleep(10);
  }
}

/** 이 파일이 `tsx file.ts` 로 직접 실행되었는가? (import 된 것이 아니라) */
export function isMain(importMetaUrl: string): boolean {
  return process.argv[1] !== undefined && importMetaUrl === new URL(`file://${process.argv[1]}`).href;
}
