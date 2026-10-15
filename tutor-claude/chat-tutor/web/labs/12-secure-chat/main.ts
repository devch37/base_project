/**
 * 12장 실습: 같은 페이지에 고객·상담사 STOMP 클라이언트를 하나씩 두고 권한 규칙을 직접 두드려 본다.
 * 관찰 포인트
 *  - 토큰 없이 CONNECT → ERROR 프레임 + 연결 종료
 *  - 남의 방 구독 → ERROR 프레임 + "연결 전체"가 끊긴다 (구독 하나만 거절되는 게 아니다!)
 *  - 고객이 /close → 권한 없음
 *  - 토큰 수명(기본 40초)이 지나면 → 아무것도 안 해도 서버가 4001 로 끊는다 (조용히 구독만 하던 연결 포함)
 *  - 만료 전에 "토큰 갱신" → 연결이 유지된다
 *  - 상담사 배정 해제 → 4003 으로 끊긴다 (이미 구독 중인 연결이 계속 엿듣지 못하게)
 */
import { Client } from '@stomp/stompjs';
import { $, makeLog } from '../shared-log.ts';

let roomId = '';
const tokens: Record<'customer' | 'agent', string> = { customer: '', agent: '' };

async function tenant<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return JSON.parse(text) as T;
}

function info(text: string) {
  $('info').textContent = text;
}

$('start').onclick = async () => {
  try {
    const r = await tenant<{ roomId: string; token: string; expiresAt: string }>('/tenant/customer/session', {
      customerId: $<HTMLInputElement>('cid').value, ttlSeconds: Number($<HTMLInputElement>('ttl').value), newRoom: true,
    });
    roomId = r.roomId;
    tokens.customer = r.token;
    info(`room=${roomId} · 고객 토큰 만료 ${r.expiresAt} · ${r.token.slice(0, 40)}…`);
  } catch (e) {
    info(`실패: ${(e as Error).message}`);
  }
};
$('atoken').onclick = async () => {
  const r = await tenant<{ token: string; expiresAt: string }>('/tenant/agent/token', {
    agentId: $<HTMLInputElement>('aid').value, ttlSeconds: Number($<HTMLInputElement>('ttl').value),
  });
  tokens.agent = r.token;
  info(`상담사 토큰 만료 ${r.expiresAt} (상담사 토큰에는 방이 없다 → 배정은 서버가 매번 조회)`);
};
$('assign').onclick = async () => info(JSON.stringify(await tenant('/tenant/rooms/assign', { roomId, agentId: $<HTMLInputElement>('aid').value })));
$('unassign').onclick = async () => info(JSON.stringify(await tenant('/tenant/rooms/unassign', { roomId, agentId: $<HTMLInputElement>('aid').value })));

function pane(role: 'customer' | 'agent', title: string) {
  const root = $(`pane-${role}`);
  root.appendChild(($<HTMLTemplateElement>('pane')).content.cloneNode(true));
  const q = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;
  q('.title').textContent = title;
  const log = makeLog(q('.log'));
  let client: Client | null = null;

  const connect = (withToken: boolean) => {
    void client?.deactivate();
    client = new Client({
      brokerURL: `ws://${location.host}/ws`,
      connectHeaders: withToken ? { Authorization: `Bearer ${tokens[role]}` } : {},
      reconnectDelay: 0,
      debug: () => {},
    });
    client.onConnect = () => {
      q('.state').textContent = 'connected';
      log('sys', 'CONNECTED — 서버가 토큰을 검증하고 이 연결에 사용자(Principal)를 붙였다');
      client!.subscribe('/user/queue/errors', (m) => log('err', `업무 오류: ${m.body}`));
      client!.subscribe('/user/queue/token', (m) => log('sys', `토큰 갱신됨: ${m.body}`));
    };
    client.onStompError = (f) => log('err', `ERROR 프레임: ${f.headers.message}`);
    client.onWebSocketClose = (e) => {
      q('.state').textContent = `closed ${e.code}`;
      const meaning: Record<number, string> = { 4001: '토큰 만료', 4003: '강제 퇴장/배정 해제', 1002: '프로토콜 오류(ERROR 뒤 종료)' };
      log('sys', `연결 종료 code=${e.code} ${meaning[e.code] ?? ''} reason="${e.reason}"`);
    };
    client.activate();
  };

  q('.connect').onclick = () => connect(true);
  q('.connect-none').onclick = () => connect(false);
  q('.disconnect').onclick = () => void client?.deactivate();
  q('.sub-mine').onclick = () => {
    client?.subscribe(`/topic/rooms/${roomId}`, (m) => log('in', m.body));
    log('out', `SUBSCRIBE /topic/rooms/${roomId}`);
  };
  q('.sub-other').onclick = () => {
    client?.subscribe('/topic/rooms/r-someone-else', (m) => log('in', m.body));
    log('out', 'SUBSCRIBE /topic/rooms/r-someone-else');
  };
  q('.close-room').onclick = () => client?.publish({ destination: `/app/rooms/${roomId}/close`, body: '{}' });
  q('.send').onclick = () => {
    client?.publish({ destination: `/app/rooms/${roomId}/send`, body: JSON.stringify({ text: q<HTMLInputElement>('.text').value, from: '사칭 시도' }) });
  };
  q('.refresh').onclick = async () => {
    const r = role === 'customer'
      ? await tenant<{ token: string }>('/tenant/customer/token', { customerId: $<HTMLInputElement>('cid').value, roomId, ttlSeconds: Number($<HTMLInputElement>('ttl').value) })
      : await tenant<{ token: string }>('/tenant/agent/token', { agentId: $<HTMLInputElement>('aid').value, ttlSeconds: Number($<HTMLInputElement>('ttl').value) });
    tokens[role] = r.token;
    client?.publish({ destination: '/app/token/refresh', body: JSON.stringify({ token: r.token }) });
    log('out', 'SEND /app/token/refresh (연결은 그대로, 만료 시각만 연장)');
  };
}

pane('customer', '고객 (CUSTOMER)');
pane('agent', '상담사 (AGENT)');
