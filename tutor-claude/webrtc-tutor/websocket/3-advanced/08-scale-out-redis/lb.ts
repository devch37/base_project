/**
 * lb.ts — 아주 작은 L4(TCP) 로드밸런서 (학습용)
 *
 * 실무에서는 Nginx / HAProxy / AWS NLB·ALB / Envoy 를 쓴다. 여기서는 "로드밸런서가 뭘 하는지"를 보려고 직접 만든다.
 *
 * ★ L4(TCP) 로드밸런서는 WebSocket 을 몰라도 된다.
 *   WebSocket 은 결국 "오래 지속되는 TCP 연결 하나"이므로, 연결을 어느 백엔드로 보낼지 *한 번* 정하고 바이트를 그대로 중계하면 끝.
 *   (L7 LB 는 HTTP 를 해석하므로 Upgrade 헤더 전달 설정이 필요하다 → README 의 Nginx 설정)
 *
 * 알고리즘
 *   round-robin : 돌아가며 배정 (연결 수가 고르게 퍼짐)
 *   ip-hash     : 클라이언트 IP 해시로 항상 같은 백엔드 (sticky). 같은 사용자가 같은 노드로 가야 할 때
 * 장애 처리: 백엔드 연결에 실패하면 "일정 시간 죽은 것으로 표시"하고 다음 백엔드로 넘긴다 (패시브 헬스체크).
 */
import net from 'node:net';

export interface Lb {
  port: number;
  connectionsPerBackend(): Record<number, number>;
  close(): Promise<void>;
}

export async function startLb(backends: () => number[], mode: 'round-robin' | 'ip-hash' = 'round-robin'): Promise<Lb> {
  let rr = 0;
  const deadUntil = new Map<number, number>();
  const counts: Record<number, number> = {};
  const open = new Set<net.Socket>();

  const alive = () => backends().filter((p) => (deadUntil.get(p) ?? 0) < Date.now());

  const server = net.createServer((client) => {
    open.add(client);
    client.on('close', () => open.delete(client));
    client.on('error', () => {});
    client.pause(); // 백엔드에 연결될 때까지 클라이언트가 보낸 데이터를 읽지 않고 붙잡아 둔다

    const pick = (tried: Set<number>): number | undefined => {
      const candidates = alive().filter((p) => !tried.has(p));
      if (candidates.length === 0) return undefined;
      if (mode === 'ip-hash') {
        const ip = client.remoteAddress ?? '';
        let h = 0;
        for (const ch of ip) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return candidates[h % candidates.length];
      }
      return candidates[rr++ % candidates.length];
    };

    const tryConnect = (tried: Set<number>): void => {
      const port = pick(tried);
      if (port === undefined) return void client.destroy(); // 살아 있는 백엔드가 없다 (실무 LB 는 503 을 돌려준다)
      const upstream = net.connect(port, '127.0.0.1');
      upstream.on('error', () => {
        deadUntil.set(port, Date.now() + 3000); // 3초간 제외
        tried.add(port);
        if (!client.destroyed) tryConnect(tried); // 다음 백엔드로 재시도 (failover)
      });
      upstream.on('connect', () => {
        counts[port] = (counts[port] ?? 0) + 1;
        upstream.on('error', () => client.destroy());
        client.pipe(upstream);
        upstream.pipe(client);
        upstream.on('close', () => client.destroy());
        client.on('close', () => upstream.destroy());
        client.resume();
      });
    };
    tryConnect(new Set());
  });

  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  return {
    port: (server.address() as net.AddressInfo).port,
    connectionsPerBackend: () => ({ ...counts }),
    close: () =>
      new Promise<void>((r) => {
        for (const s of open) s.destroy();
        server.close(() => r());
      }),
  };
}
