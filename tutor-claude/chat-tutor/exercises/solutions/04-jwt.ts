/** 연습 04 해답 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
const unb64 = (s: string) => Buffer.from(s, 'base64url').toString('utf8');
const mac = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest();

export function sign(payload: Record<string, unknown>, secret: string): string {
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify(payload));
  return `${head}.${body}.${b64(mac(`${head}.${body}`, secret))}`;
}

export function verify(token: string, secret: string, nowSec: number): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('format');
  const [h, p, s] = parts as [string, string, string];
  let header: { alg?: string };
  try {
    header = JSON.parse(unb64(h));
  } catch {
    throw new Error('format');
  }
  if (header.alg !== 'HS256') throw new Error('alg');
  const expected = mac(`${h}.${p}`, secret);
  const given = Buffer.from(s, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new Error('signature');
  const payload = JSON.parse(unb64(p)) as Record<string, unknown>;
  if (typeof payload.exp === 'number' && nowSec >= payload.exp) throw new Error('expired');
  return payload;
}
