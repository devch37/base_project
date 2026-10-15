/** 연습 01 해답 */
export function originOf(url: string): string {
  // URL 이 기본 포트를 알아서 지워 준다 (https://a.com:443 → https://a.com)
  const u = new URL(url);
  return `${u.protocol}//${u.host}`;
}

export function sameOrigin(a: string, b: string): boolean {
  return originOf(a) === originOf(b);
}

export function isAllowedOrigin(originHeader: string | null, patterns: string[]): boolean {
  if (!originHeader) return false;
  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return false;
  }
  return patterns.some((p) => {
    const wildcardPort = p.endsWith(':*');
    const base = new URL(wildcardPort ? p.slice(0, -2) : p);
    if (base.protocol !== origin.protocol || base.hostname !== origin.hostname) return false; // 정확히 같은 호스트만
    return wildcardPort || base.port === origin.port;
  });
}
