import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['web/sdk/test/**/*.test.ts'],
    // DOM 이 필요한 테스트는 파일 맨 위에 `// @vitest-environment jsdom` 을 적는다
    environment: 'node',
  },
});
