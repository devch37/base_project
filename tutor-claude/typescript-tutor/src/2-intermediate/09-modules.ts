/**
 * ============================================================================
 * 09. 모듈 시스템 (Modules)
 * ============================================================================
 *
 * 파일 = 모듈. `import` / `export` 로 코드를 나누고 조합합니다.
 * 이 레슨은 옆의 `lib/` 폴더(math.ts, logger.ts, index.ts)와 함께 봅니다.
 *
 * 실행:  npx tsx src/2-intermediate/09-modules.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) named import — 중괄호로 골라서 가져온다
// ----------------------------------------------------------------------------
import { circleArea, clamp, PI } from './lib/math.js';
//                                        ^^^^ NodeNext 설정에서는 확장자 필수.
//   왜 .ts 가 아니라 .js? → import 경로는 "컴파일 결과(JS) 기준"으로 해석되기 때문.
//   tsx/ts-node 로 실행할 때도 이 규칙을 따릅니다.

// 이름 바꾸기(alias)
import { circleArea as area } from './lib/math.js';

// ----------------------------------------------------------------------------
// 2) default import — 이름을 마음대로 붙일 수 있다
// ----------------------------------------------------------------------------
import Logger from './lib/logger.js';

// ----------------------------------------------------------------------------
// 3) 타입 전용 import (import type) — 런타임 코드에 영향 없음
// ----------------------------------------------------------------------------
// 타입만 필요할 때는 `import type` 을 쓰면
//  (1) 의도가 명확하고 (2) 번들러가 확실히 제거할 수 있습니다.
import type { Range } from './lib/math.js';
import type { LogLevel } from './lib/logger.js';

// 값과 타입을 같이 가져올 때는 인라인 type 지시자 사용
import { type Range as R2, clamp as clamp2 } from './lib/math.js';

// ----------------------------------------------------------------------------
// 4) 네임스페이스 import — 모듈 전체를 객체처럼
// ----------------------------------------------------------------------------
import * as MathUtils from './lib/math.js';

// ----------------------------------------------------------------------------
// 5) 배럴 파일에서 한 번에 가져오기
// ----------------------------------------------------------------------------
import { Logger as BarrelLogger, circleArea as barrelArea } from './lib/index.js';

// ----------------------------------------------------------------------------
// 사용 예시
// ----------------------------------------------------------------------------
const validRange: Range = { min: 0, max: 100 };
const level: LogLevel = 'info';

function normalize(value: number, range: R2): number {
  return clamp2(value, range.min, range.max);
}

console.log('--- 09. 모듈 ---');
console.log('PI =', PI);
console.log('circleArea(2) =', circleArea(2), '| alias area(3) =', area(3));
console.log('normalize(150, 0~100) =', normalize(150, validRange));
console.log('MathUtils.clamp(-5, 0, 10) =', MathUtils.clamp(-5, 0, 10));

const log = new Logger('09-modules');
log.info(`현재 로그 레벨: ${level}`);

const blog = new BarrelLogger('barrel');
blog.debug(`barrelArea(1) = ${barrelArea(1)}`);

/**
 * ----------------------------------------------------------------------------
 * 참고: 선언 파일(.d.ts)
 * ----------------------------------------------------------------------------
 * - 타입만 들어있는 파일. JS 라이브러리에 타입을 "덧씌울" 때 사용.
 * - npm의 `@types/xxx` 패키지가 바로 이 .d.ts 모음입니다.
 * - 전역 타입 확장 예 (별도 파일 env.d.ts):
 *
 *     declare global {
 *       namespace NodeJS {
 *         interface ProcessEnv {
 *           DATABASE_URL: string;
 *         }
 *       }
 *     }
 *     export {};
 *
 * ----------------------------------------------------------------------------
 * CommonJS vs ESM (아주 짧게)
 * ----------------------------------------------------------------------------
 * - CommonJS(옛 Node): const x = require('x'); module.exports = ...
 * - ESM(표준):          import x from 'x';     export default ...
 * - 이 프로젝트는 package.json 의 "type": "module" + tsconfig "NodeNext" 로 ESM 사용.
 */

export {};
