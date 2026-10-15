/**
 * Vite 개발 서버 설정 (04장·21장).
 *
 * 프록시: 브라우저는 http://localhost:5173 하나만 바라보고, Vite 가 경로별로 뒤의 서버에 넘겨준다.
 *   /ws      → 채팅 서버(WebSocket). ws: true 가 없으면 Upgrade 헤더가 전달되지 않아 연결이 안 된다 (21장)
 *   /tenant  → 고객사 백엔드(Node, 3000)
 *   /api     → 채팅 서버 공개 API
 * 이렇게 하면 브라우저 입장에서는 전부 "같은 출처"라 CORS 문제가 생기지 않는다.
 * (일부러 다른 출처를 만들어 보는 실습: npm run dev:other-origin → 5174, 22장)
 */
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const chatTarget = process.env.CHAT_SERVER ?? 'http://localhost:8080';
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8')) as { version: string };

export default defineConfig({
  root: __dirname,
  define: { __SDK_VERSION__: JSON.stringify(pkg.version) },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/ws': { target: chatTarget.replace(/^http/, 'ws'), ws: true },
      '/api': { target: chatTarget },
      '/tenant': { target: process.env.TENANT_SERVER ?? 'http://localhost:3000' },
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        hub: resolve(__dirname, 'index.html'),
        customer: resolve(__dirname, 'apps/customer/index.html'),
        agent: resolve(__dirname, 'apps/agent/index.html'),
        lab07: resolve(__dirname, 'labs/07-raw-websocket/index.html'),
        lab08: resolve(__dirname, 'labs/08-stomp-chat/index.html'),
        lab12: resolve(__dirname, 'labs/12-secure-chat/index.html'),
        lab13: resolve(__dirname, 'labs/13-dom-events/index.html'),
        lab15: resolve(__dirname, 'labs/15-mutation-mirror/index.html'),
        lab15play: resolve(__dirname, 'labs/15-mutation-mirror/playground.html'),
        lab17: resolve(__dirname, 'labs/17-echo-loop/index.html'),
      },
    },
  },
});
