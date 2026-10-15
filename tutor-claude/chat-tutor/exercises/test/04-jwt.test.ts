import { describe, expect, it } from 'vitest';
import { sign, verify } from '@ex/04-jwt.ts';

const SECRET = 'exercise-secret-0123456789-0123456789';

describe('연습 04 JWT', () => {
  const token = sign({ sub: 'c-1', role: 'CUSTOMER', exp: 2000 }, SECRET);
  it('발급·검증', () => {
    expect(token.split('.')).toHaveLength(3);
    expect(verify(token, SECRET, 1000)).toMatchObject({ sub: 'c-1', role: 'CUSTOMER' });
  });
  it('jwt.io 와 같은 표준 형식 (헤더 디코드)', () => {
    expect(JSON.parse(Buffer.from(token.split('.')[0]!, 'base64url').toString())).toEqual({ alg: 'HS256', typ: 'JWT' });
  });
  it('변조·다른 키·alg none·만료·형식 오류를 거부', () => {
    const [h, p, s] = token.split('.');
    const forged = Buffer.from(Buffer.from(p!, 'base64url').toString().replace('CUSTOMER', 'AGENT')).toString('base64url');
    expect(() => verify(`${h}.${forged}.${s}`, SECRET, 1000)).toThrow('signature');
    expect(() => verify(token, 'other-secret', 1000)).toThrow('signature');
    const none = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${p}.`;
    expect(() => verify(none, SECRET, 1000)).toThrow('alg');
    expect(() => verify(token, SECRET, 2000)).toThrow('expired');
    expect(() => verify('abc.def', SECRET, 1000)).toThrow('format');
  });
});
