/**
 * static.ts — 개발용 정적 파일 서버 + "요청 시 TypeScript 번들링"
 *
 * 브라우저는 `.ts` 를 실행하지 못하고, `import 'mediasoup-client'` 같은 bare import 도 해석하지 못한다.
 * 그래서 `.ts` 요청이 오면 esbuild 로 그 자리에서 번들(ESM)해서 JS 로 응답한다. (빌드 단계 없이 `tsx` 처럼 바로 실행)
 *
 *   GET /            → <chapter>/public/index.html
 *   GET /main.ts     → esbuild 로 번들한 JS (content-type: application/javascript)
 *   GET /style.css   → 그대로
 *
 * ⚠ 개발 편의용이다. 운영에서는 번들러(Vite/esbuild)로 미리 빌드한 정적 파일을 CDN/Nginx 로 서빙한다.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { build } from 'esbuild';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

export type StaticHandler = (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;

/** mounts: URL 접두사 → 디렉터리.  예) { '/': '/path/to/public' } */
export function createStaticHandler(mounts: Record<string, string>): StaticHandler {
  // 긴 접두사부터 매칭
  const entries = Object.entries(mounts).sort((a, b) => b[0].length - a[0].length);

  return async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return false;
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    for (const [prefix, dir] of entries) {
      if (!pathname.startsWith(prefix)) continue;
      let rel = pathname.slice(prefix.length);
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';

      // ★ 경로 탈출(path traversal) 방어: 정규화한 결과가 마운트 디렉터리 안에 있어야 한다.
      const root = resolve(dir);
      const file = resolve(join(root, normalize(rel)));
      if (file !== root && !file.startsWith(root + sep)) {
        res.writeHead(403).end('forbidden');
        return true;
      }

      try {
        const s = await stat(file);
        if (!s.isFile()) continue;
      } catch {
        continue;
      }

      if (file.endsWith('.ts')) {
        try {
          const out = await build({
            entryPoints: [file],
            bundle: true,
            format: 'esm',
            platform: 'browser',
            target: 'es2022',
            write: false,
            sourcemap: 'inline',
            logLevel: 'silent',
          });
          res.writeHead(200, { 'content-type': TYPES['.js']!, 'cache-control': 'no-store' }).end(out.outputFiles[0]!.text);
        } catch (e) {
          const msg = (e as Error).message;
          res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end(`번들 오류:\n${msg}`);
        }
        return true;
      }

      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      if (req.method === 'HEAD') res.end();
      else createReadStream(file).pipe(res);
      return true;
    }
    return false;
  };
}
