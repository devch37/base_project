import { describe, expect, it } from 'vitest';
import { EchoGuard } from '../src/echo-guard.ts';
import { backoffDelay } from '../src/backoff.ts';
import { absolutizeCss, isDangerousUrl, sanitizeAttribute } from '../src/sanitize.ts';

describe('EchoGuard (17장)', () => {
  it('방금 적용한 값이 짧은 시간 안에 돌아오면 메아리로 본다', () => {
    let now = 0;
    const g = new EchoGuard(300, () => now);
    g.markApplied('scroll:0', [0, 500]);
    expect(g.isEcho('scroll:0', [0, 500])).toBe(true);
    expect(g.isEcho('scroll:0', [0, 520])).toBe(false); // 다른 값 = 사용자가 직접 움직임
    now = 301;
    expect(g.isEcho('scroll:0', [0, 500])).toBe(false); // 시간이 지나면 같은 값이어도 사용자 동작
  });
});

describe('backoff + full jitter (09장)', () => {
  it('상한은 지수로 늘고 maxMs 에서 멈춘다', () => {
    const top = (a: number) => backoffDelay(a, { baseMs: 500, maxMs: 15_000 }, () => 0.999999);
    expect([0, 1, 2, 3, 4, 5, 6].map(top)).toEqual([499, 999, 1999, 3999, 7999, 14999, 14999]);
  });
  it('jitter 덕분에 같은 시도 횟수라도 대기 시간이 흩어진다', () => {
    const samples = new Set(Array.from({ length: 50 }, () => backoffDelay(5)));
    expect(samples.size).toBeGreaterThan(40);
  });
});

describe('sanitize', () => {
  it('공백·대소문자로 위장한 javascript: 도 잡는다', () => {
    expect(isDangerousUrl(' JaVa\tScRiPt:alert(1)')).toBe(true);
    expect(isDangerousUrl('https://ok')).toBe(false);
  });
  it('on* 속성은 버린다', () => {
    expect(sanitizeAttribute('onMouseOver', 'x()', 'https://a/')).toBeNull();
  });
  it('CSS 의 url() 을 절대화한다', () => {
    expect(absolutizeCss('a{background:url("../i.png")}', 'https://a.com/css/x.css')).toBe('a{background:url("https://a.com/i.png")}');
  });
});
