/**
 * 20장: SDK 를 "고객사가 가져다 쓸 수 있는 파일"로 만든다 (라이브러리 빌드).
 *
 *   dist/cobrowse-sdk.js       ES 모듈   — 고객사가 번들러(Vite/webpack)로 import 할 때
 *   dist/cobrowse-sdk.iife.js  즉시 실행 — 번들러 없는 사이트가 <script src> 한 줄로 붙일 때 (window.Cobrowse)
 *
 * 업무 화면 코드(앱)와 다른 점:
 *  - 고객사 페이지에 "끼어 들어가는" 코드다 → 전역 변수 오염 금지, 고객사 CSS/JS 와 충돌 금지
 *  - 의존성(@stomp/stompjs)을 함께 묶는다 → 고객사가 따로 설치할 필요 없게. 대신 크기에 민감해야 한다
 *  - 버전(__SDK_VERSION__)을 박아 둔다 → 장애 시 "어느 버전 SDK 였나"를 알 수 있게
 */
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8')) as { version: string };

export default defineConfig({
  define: { __SDK_VERSION__: JSON.stringify(pkg.version) },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true, // 고객사 사이트에서 난 오류를 원래 코드 위치로 추적하기 위해
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Cobrowse', // IIFE 빌드에서 window.Cobrowse 하나만 만든다
      formats: ['es', 'iife'],
      fileName: (format) => (format === 'es' ? 'cobrowse-sdk.js' : 'cobrowse-sdk.iife.js'),
    },
  },
});
