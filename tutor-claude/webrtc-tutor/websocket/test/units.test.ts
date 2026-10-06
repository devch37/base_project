/** 순수 로직 단위 테스트: protocol / ratelimit / auth / reliable */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AuthError } from '../src/errors';
import { MemoryTicketStore, isOriginAllowed, issueTicket, verifyTicket } from '../src/auth';
import { parseEnvelope } from '../src/protocol';
import { TokenBucket } from '../src/ratelimit';
import { ReplayLog, SeqTracker } from '../src/reliable';

describe('protocol.parseEnvelope', () => {
  it('정상 메시지', () => {
    const r = parseEnvelope(JSON.stringify({ v: 1, type: 'chat.send', payload: { a: 1 } }));
    assert.equal(r.ok, true);
  });
  it('깨진 JSON', () => {
    const r = parseEnvelope('{oops');
    assert.deepEqual(r.ok ? null : r.code, 'bad_json');
  });
  it('버전 불일치 / type 형식 오류', () => {
    assert.equal(parseEnvelope(JSON.stringify({ v: 2, type: 'x' })).ok, false);
    assert.equal(parseEnvelope(JSON.stringify({ v: 1, type: 'Bad Type!' })).ok, false);
    assert.equal(parseEnvelope(JSON.stringify({ v: 1 })).ok, false);
  });
});

describe('TokenBucket', () => {
  it('버스트 허용 후 차단, 시간이 지나면 회복', () => {
    const t0 = 1_000_000;
    const b = new TokenBucket(3, 1, t0); // 용량 3, 초당 1개 충전
    assert.ok(b.tryTake(1, t0));
    assert.ok(b.tryTake(1, t0));
    assert.ok(b.tryTake(1, t0));
    assert.equal(b.tryTake(1, t0), false); // 버스트 소진
    assert.equal(b.tryTake(1, t0 + 500), false); // 0.5초 → 0.5 토큰
    assert.ok(b.tryTake(1, t0 + 1000)); // 1초 → 1 토큰
  });
  it('용량을 넘어 쌓이지 않는다', () => {
    const b = new TokenBucket(2, 100, 0);
    assert.equal(b.available(10_000), 2);
  });
});

describe('ticket auth', () => {
  const secret = 'test-secret';
  it('발급 → 검증', () => {
    const t = issueTicket({ sub: 'alice', extra: { room: 'lobby' } }, secret);
    const c = verifyTicket(t, secret);
    assert.equal(c.sub, 'alice');
    assert.equal(c.room, 'lobby');
  });
  it('변조/만료/누락 거절', () => {
    const t = issueTicket({ sub: 'alice', ttlSec: 10, now: 0 }, secret);
    assert.throws(() => verifyTicket(t, 'other-secret', 1000), (e) => e instanceof AuthError && e.code === 'bad_signature');
    assert.throws(() => verifyTicket(t, secret, 11_000), (e) => e instanceof AuthError && e.code === 'expired_ticket');
    assert.throws(() => verifyTicket(undefined, secret), (e) => e instanceof AuthError && e.code === 'missing_ticket');
    // payload 를 바꿔치기해도 서명이 맞지 않는다
    const [p, s] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p!, 'base64url').toString()), sub: 'admin' })).toString('base64url');
    assert.throws(() => verifyTicket(`${forged}.${s}`, secret, 1000), (e) => e instanceof AuthError && e.code === 'bad_signature');
  });
  it('1회용 저장소', async () => {
    const store = new MemoryTicketStore();
    assert.equal(await store.consume('j1', 1000), true);
    assert.equal(await store.consume('j1', 1000), false);
  });
});

describe('isOriginAllowed', () => {
  it('허용 목록 / 와일드카드 / Origin 없음', () => {
    assert.equal(isOriginAllowed('https://a.com', ['https://a.com']), true);
    assert.equal(isOriginAllowed('https://evil.com', ['https://a.com']), false);
    assert.equal(isOriginAllowed(undefined, ['https://a.com'], true), true);
    assert.equal(isOriginAllowed(undefined, ['https://a.com'], false), false);
    assert.equal(isOriginAllowed('https://x.com', '*'), true);
  });
});

describe('ReplayLog / SeqTracker', () => {
  it('seq 부여, since, 버퍼 초과 시 gap', () => {
    const log = new ReplayLog<{ seq?: number; n: number }>(3);
    for (let n = 1; n <= 5; n++) log.append((seq) => ({ seq, n }));
    assert.equal(log.lastSeq, 5);
    // 버퍼에는 seq 3,4,5 만 남음
    const ok = log.since(3);
    assert.ok(ok.ok && ok.items.map((i) => i.seq).join() === '4,5');
    assert.ok(log.since(2).ok); // 3번부터 필요 → 남아 있음
    const gap = log.since(1); // 2번부터 필요 → 이미 밀려남
    assert.ok(!gap.ok && gap.oldestSeq === 3);
    assert.ok(log.since(5).ok);
  });
  it('중복/누락 판정', () => {
    const t = new SeqTracker();
    assert.equal(t.accept(1), 'deliver');
    assert.equal(t.accept(2), 'deliver');
    assert.equal(t.accept(2), 'duplicate');
    assert.equal(t.accept(4), 'gap');
    assert.equal(t.last, 2); // gap 이면 전진하지 않는다
    assert.equal(t.accept(3), 'deliver');
  });
});
