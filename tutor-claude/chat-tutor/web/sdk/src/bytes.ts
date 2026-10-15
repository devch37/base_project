/**
 * 문자열 ↔ 바이트 ↔ base64, 그리고 gzip (14장).
 * 브라우저와 Node 18+ 양쪽에 있는 표준 API(TextEncoder, CompressionStream, btoa)만 쓴다.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** UTF-8 바이트 수. 문자열 길이(.length)와 다르다! "가".length = 1, utf8Bytes("가") = 3 */
export function utf8Bytes(s: string): number {
  return encoder.encode(s).length;
}

export function toUtf8(s: string): Uint8Array {
  return encoder.encode(s);
}

export function fromUtf8(b: Uint8Array): string {
  return decoder.decode(b);
}

/**
 * 바이트 → base64. 3바이트를 4글자로 바꾸므로 약 33% 커진다.
 * 그래도 쓰는 이유: STOMP 텍스트 프레임·JSON 안에는 임의의 바이트(0x00 등)를 그대로 넣을 수 없기 때문.
 */
export function toBase64(bytes: Uint8Array): string {
  let bin = '';
  const step = 0x8000; // String.fromCharCode(...큰 배열) 은 인자 개수 한도로 터진다 → 잘라서
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

export function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const blob = new Blob([bytes as BlobPart]);
  const out = blob.stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** gzip 압축. DOM 직렬화 JSON 은 태그·속성 이름이 반복돼서 보통 1/5~1/10 로 줄어든다. */
export function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  return pipe(bytes, new CompressionStream('gzip'));
}

export function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  return pipe(bytes, new DecompressionStream('gzip'));
}
