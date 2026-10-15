/** 연습 03 해답 */
export interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

const escape = (v: string) => v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/:/g, '\\c');
const unescape = (v: string) => v.replace(/\\(\\|n|c)/g, (_m, c: string) => (c === 'n' ? '\n' : c === 'c' ? ':' : '\\'));

export function encodeFrame(f: StompFrame): string {
  const headers = Object.entries(f.headers).map(([k, v]) => `${escape(k)}:${escape(v)}`);
  return [f.command, ...headers].join('\n') + '\n\n' + f.body + '\0';
}

export function decodeFrames(data: string): StompFrame[] {
  const frames: StompFrame[] = [];
  for (const raw of data.split('\0')) {
    const text = raw.replace(/^[\r\n]+/, ''); // 앞의 heartbeat 줄바꿈 제거
    if (text === '') continue;
    const sep = text.indexOf('\n\n');
    const head = sep === -1 ? text : text.slice(0, sep);
    const body = sep === -1 ? '' : text.slice(sep + 2);
    const [command, ...lines] = head.split('\n');
    const headers: Record<string, string> = {};
    for (const line of lines) {
      const i = line.indexOf(':');
      if (i < 0) continue;
      const k = unescape(line.slice(0, i));
      if (!(k in headers)) headers[k] = unescape(line.slice(i + 1)); // 처음 것이 이긴다
    }
    frames.push({ command: command!.trim(), headers, body });
  }
  return frames;
}
