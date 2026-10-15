import { describe, expect, it } from 'vitest';
import { decodeFrames, encodeFrame } from '@ex/03-stomp-frame.ts';

describe('연습 03 STOMP 프레임', () => {
  it('SEND 프레임을 만든다', () => {
    const f = encodeFrame({ command: 'SEND', headers: { destination: '/app/rooms/r1/send' }, body: '{"text":"hi"}' });
    expect(f).toBe('SEND\ndestination:/app/rooms/r1/send\n\n{"text":"hi"}\0');
  });
  it('여러 프레임 + heartbeat 섞인 데이터를 읽는다', () => {
    const data = '\nMESSAGE\ndestination:/topic/rooms/r1\nsubscription:sub-0\n\n{"a":1}\0\nMESSAGE\ndestination:/topic/rooms/r1\n\n{"a":2}\0';
    const frames = decodeFrames(data);
    expect(frames).toHaveLength(2);
    expect(frames[0]).toEqual({ command: 'MESSAGE', headers: { destination: '/topic/rooms/r1', subscription: 'sub-0' }, body: '{"a":1}' });
    expect(frames[1]!.body).toBe('{"a":2}');
  });
  it('heartbeat 만 있으면 프레임 0개', () => {
    expect(decodeFrames('\n')).toEqual([]);
  });
  it('헤더 이스케이프 왕복', () => {
    const original = { command: 'SEND', headers: { note: 'a:b\nc\\d' }, body: '' };
    expect(decodeFrames(encodeFrame(original))[0]).toEqual(original);
  });
  it('중복 헤더는 처음 것이 이긴다', () => {
    expect(decodeFrames('MESSAGE\nfoo:1\nfoo:2\n\n\0')[0]!.headers.foo).toBe('1');
  });
});
