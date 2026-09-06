/**
 * lib/index.ts — "배럴 파일(barrel file)"
 * ----------------------------------------------------------------------------
 * 여러 모듈의 export 를 한 곳에서 다시 내보내(re-export) 줍니다.
 * 사용하는 쪽에서 `import { circleArea, Logger } from './lib/index.js'` 처럼
 * 한 줄로 가져올 수 있어 편리합니다.
 *
 * 주의: 배럴 파일을 남용하면 번들 크기/순환 참조 문제가 생길 수 있어,
 *       큰 프로젝트에서는 신중히 사용하세요.
 */

export * from './math.js';            // math.ts 의 모든 named export 재노출
export { default as Logger } from './logger.js'; // default 를 named 로 바꿔 재노출
export type { LogLevel } from './logger.js';     // 타입만 재노출
