import { describe, expect, it } from 'vitest';
import { isAllowedOrigin, originOf, sameOrigin } from '@ex/01-origin.ts';

describe('연습 01 Origin', () => {
  it('originOf', () => {
    expect(originOf('https://shop.example.com/a/b?x=1#y')).toBe('https://shop.example.com');
    expect(originOf('https://shop.example.com:443/')).toBe('https://shop.example.com');
    expect(originOf('http://localhost:5173/apps')).toBe('http://localhost:5173');
  });
  it('sameOrigin', () => {
    expect(sameOrigin('http://localhost:5173/a', 'http://localhost:5173/b')).toBe(true);
    expect(sameOrigin('http://localhost:5173', 'http://localhost:8080')).toBe(false);
    expect(sameOrigin('http://a.com', 'https://a.com')).toBe(false);
    expect(sameOrigin('https://a.com', 'https://api.a.com')).toBe(false);
  });
  it('isAllowedOrigin', () => {
    const allow = ['https://shop.example.com', 'http://localhost:*'];
    expect(isAllowedOrigin('https://shop.example.com', allow)).toBe(true);
    expect(isAllowedOrigin('http://localhost:5174', allow)).toBe(true);
    expect(isAllowedOrigin('https://shop.example.com.evil.com', allow)).toBe(false); // 접두어 함정
    expect(isAllowedOrigin('https://evilshop.example.com', allow)).toBe(false);
    expect(isAllowedOrigin('http://shop.example.com', allow)).toBe(false); // scheme 다름
    expect(isAllowedOrigin(null, allow)).toBe(false);
    expect(isAllowedOrigin('null', allow)).toBe(false); // sandbox iframe 등은 문자열 "null" 을 보낸다
  });
});
