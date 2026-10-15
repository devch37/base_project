/**
 * 연습 01 (01장·22장) — 같은 출처(Origin) 판단
 *
 * originOf: URL 문자열에서 "scheme://host:port" 를 만든다. 기본 포트(http 80, https 443, ws 80, wss 443)는 생략.
 * sameOrigin: 두 URL 이 같은 출처인가?
 * isAllowedOrigin: 서버가 WebSocket 핸드셰이크의 Origin 헤더를 검사하는 함수.
 *   patterns 예: ['https://shop.example.com', 'http://localhost:*']  (포트 자리의 * 는 아무 포트)
 *   Origin 헤더가 없으면(null) 브라우저가 아닌 클라이언트 → 여기서는 거부한다 (보수적으로).
 *
 * 힌트: new URL() 을 써도 된다. 직접 문자열을 자르면 "https://example.com.evil.com" 같은 함정에 빠지기 쉽다.
 */
export function originOf(url: string): string {
  throw new Error('TODO: originOf');
}

export function sameOrigin(a: string, b: string): boolean {
  throw new Error('TODO: sameOrigin');
}

export function isAllowedOrigin(originHeader: string | null, patterns: string[]): boolean {
  throw new Error('TODO: isAllowedOrigin');
}
