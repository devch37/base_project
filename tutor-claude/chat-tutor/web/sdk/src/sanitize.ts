/**
 * 속성·URL·CSS 정리 (16장·22장).
 *
 * 고객 쪽(직렬화)과 상담사 쪽(재현) "양쪽 모두"에서 쓴다.
 *   - 고객 쪽: 상담사 화면에서 제대로 보이도록 상대 URL → 절대 URL, 스크립트 제거
 *   - 상담사 쪽: 받은 데이터를 믿지 않는다. 악성 고객(또는 변조된 SDK)이 보낸
 *     onerror="..." 같은 속성이 상담사 브라우저에서 실행되면 상담사 계정이 털린다(XSS).
 *     → "방어는 받는 쪽에서 다시 한 번" (defense in depth)
 */

/** 통째로 버리는 태그. script 는 당연하고, base/meta refresh 는 문서의 주소·이동을 바꿀 수 있다. */
export const DROP_TAGS = new Set(['script', 'noscript', 'template', 'base', 'object', 'embed', 'applet']);

/** URL 이 들어가는 속성들 — 상대 경로를 절대 경로로 바꿔야 상담사 화면에서 이미지·CSS 가 보인다 */
const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'poster', 'background', 'cite', 'data', 'xlink:href']);

/** 상담사 화면에서 의미 없거나 위험한 속성 */
const DROP_ATTRS = new Set(['srcdoc', 'autofocus', 'nonce', 'integrity']);

export function isDangerousUrl(value: string): boolean {
  // 브라우저는 "java\nscript:" 처럼 공백·제어문자를 끼워도 javascript: 로 해석한다 → 제거 후 비교
  const v = value.replace(/[\u0000- ]/g, '').toLowerCase();
  return v.startsWith('javascript:') || v.startsWith('vbscript:') || v.startsWith('data:text/html');
}

export function absolutizeUrl(value: string, base: string): string {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  try {
    return new URL(trimmed, base).href;
  } catch {
    return trimmed; // URL 로 해석이 안 되면 그대로 둔다 (깨진 링크는 원래 페이지에서도 깨져 있다)
  }
}

/** srcset="a.png 1x, b.png 2x" 의 URL 부분만 절대화 */
export function absolutizeSrcset(value: string, base: string): string {
  return value
    .split(',')
    .map((part) => {
      const [url, ...descriptor] = part.trim().split(/\s+/);
      return [absolutizeUrl(url ?? '', base), ...descriptor].join(' ');
    })
    .join(', ');
}

/** CSS 안의 url(...) 과 @import "..." 를 절대화 */
export function absolutizeCss(css: string, base: string): string {
  return css
    .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (_m, q: string, url: string) => {
      if (isDangerousUrl(url)) return 'url()';
      return `url(${q}${absolutizeUrl(url, base)}${q})`;
    })
    .replace(/@import\s+(['"])([^'"]+)\1/gi, (_m, q: string, url: string) => `@import ${q}${absolutizeUrl(url, base)}${q}`);
}

/**
 * 속성 하나를 정리한다. null 을 돌려주면 "이 속성은 버린다".
 */
export function sanitizeAttribute(name: string, value: string, base: string): string | null {
  const n = name.toLowerCase();
  if (n.startsWith('on')) return null; // onclick, onerror, onload ... 이벤트 핸들러 = 스크립트
  if (DROP_ATTRS.has(n)) return null;
  if (URL_ATTRS.has(n)) {
    if (isDangerousUrl(value)) return null;
    return absolutizeUrl(value, base);
  }
  if (n === 'srcset') return absolutizeSrcset(value, base);
  if (n === 'style') return absolutizeCss(value, base);
  return value;
}

/** meta 태그 중 문서 동작을 바꾸는 것 (예: <meta http-equiv="refresh" content="0;url=evil">) */
export function isDangerousMeta(el: { tagName: string; getAttribute(n: string): string | null }): boolean {
  return el.tagName.toLowerCase() === 'meta' && el.getAttribute('http-equiv') !== null;
}
