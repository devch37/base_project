/**
 * 연습문제 실행 설정.
 *   npm run ex            → exercises/src (내가 푼 것)를 테스트
 *   npm run ex:solution   → exercises/solutions (해답)를 테스트
 * 테스트 파일은 '@ex/...' 로 import 하고, 여기서 그 경로를 src 또는 solutions 로 바꿔 준다.
 */
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const target = process.env.SOLUTION ? 'solutions' : 'src';

export default defineConfig({
  resolve: { alias: { '@ex': resolve(__dirname, target) } },
  test: { include: [resolve(__dirname, 'test/**/*.test.ts')], environment: 'node' },
});
