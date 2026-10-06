/**
 * ui.ts — 예제 페이지들이 공유하는 작은 UI 도우미
 *
 * 학습 페이지의 핵심은 "WebRTC 의 상태 변화를 눈으로 보는 것"이다. 그래서 모든 페이지가
 * 같은 형태의 로그 패널과 상태 배지를 쓴다.
 */

/** 화면 하단 로그 패널에 한 줄 추가. `window.__log` 에도 쌓아 두어 e2e 테스트가 읽을 수 있다. */
export function createLogger(el: HTMLElement | null, prefix = ''): (msg: string, cls?: 'ok' | 'warn' | 'err' | 'info') => void {
  const w = window as unknown as { __log?: string[] };
  w.__log ??= [];
  return (msg, cls = 'info') => {
    const line = `${new Date().toISOString().slice(11, 23)} ${prefix}${msg}`;
    w.__log!.push(line);
    console.log(line);
    if (!el) return;
    const div = document.createElement('div');
    div.className = `log ${cls}`;
    div.textContent = line;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  };
}

/** `<video>` 에 스트림을 연결. 자동재생 정책 때문에 muted + playsInline 을 기본으로 한다 */
export function attachStream(video: HTMLVideoElement, stream: MediaStream | null, muted = false): void {
  video.srcObject = stream;
  video.muted = muted;
  video.playsInline = true; // iOS Safari: 전체화면으로 넘어가지 않고 인라인 재생
  video.autoplay = true;
  void video.play().catch(() => {
    /* 자동재생이 막히면 사용자가 클릭할 때까지 대기 — 정상 */
  });
}

/** 상태 배지 갱신: <span id="..." class="badge"> */
export function setBadge(el: HTMLElement | null, text: string, kind: 'ok' | 'warn' | 'err' | 'idle' = 'idle'): void {
  if (!el) return;
  el.textContent = text;
  el.className = `badge ${kind}`;
}

export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 요소가 없습니다`);
  return el as T;
};

/** URL 쿼리 파라미터 */
export const qs = (name: string, fallback = ''): string => new URLSearchParams(location.search).get(name) ?? fallback;

/** 모든 예제 페이지가 공유하는 CSS (각 index.html 이 <style> 로 인라인하지 않아도 되도록 문자열로 제공) */
export const BASE_CSS = `
  :root { color-scheme: light dark; --bg:#0f1218; --fg:#e8ecf3; --mut:#8b95a7; --card:#171c26; --line:#252c3a; --ok:#3ecf8e; --warn:#f5b53d; --err:#ff6b6b; --acc:#6aa9ff; }
  * { box-sizing: border-box; }
  body { margin:0; font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans KR",sans-serif; background:var(--bg); color:var(--fg); }
  header { padding:14px 20px; border-bottom:1px solid var(--line); display:flex; gap:12px; align-items:baseline; flex-wrap:wrap; }
  header h1 { font-size:16px; margin:0; } header small { color:var(--mut); }
  main { padding:16px 20px; display:grid; gap:16px; max-width:1100px; margin:0 auto; }
  .row { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px; }
  .card h2 { margin:0 0 8px; font-size:13px; color:var(--mut); font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
  video { width:320px; max-width:100%; background:#000; border-radius:8px; aspect-ratio:16/9; }
  button { background:var(--acc); color:#06101f; border:0; border-radius:6px; padding:7px 12px; font-weight:600; cursor:pointer; }
  button.secondary { background:#2a3347; color:var(--fg); } button:disabled { opacity:.45; cursor:not-allowed; }
  input, select { background:#0c1017; color:var(--fg); border:1px solid var(--line); border-radius:6px; padding:6px 8px; }
  .badge { display:inline-block; padding:2px 8px; border-radius:99px; font-size:12px; font-weight:600; background:#2a3347; }
  .badge.ok { background:#12392a; color:var(--ok); } .badge.warn { background:#3d2f10; color:var(--warn); } .badge.err { background:#431c1c; color:var(--err); }
  #log { height:200px; overflow:auto; font:12px/1.45 ui-monospace,Menlo,monospace; background:#0a0d13; border-radius:8px; padding:8px; }
  .log.ok { color:var(--ok); } .log.warn { color:var(--warn); } .log.err { color:var(--err); } .log.info { color:#aab4c5; }
  pre { margin:0; white-space:pre-wrap; word-break:break-all; font:12px/1.4 ui-monospace,Menlo,monospace; max-height:220px; overflow:auto; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:10px; }
  .muted { color:var(--mut); }
`;

/** BASE_CSS 를 문서에 주입 */
export function injectBaseCss(): void {
  const s = document.createElement('style');
  s.textContent = BASE_CSS;
  document.head.appendChild(s);
}
