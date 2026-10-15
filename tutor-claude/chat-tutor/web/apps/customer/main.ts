/**
 * 고객사 웹사이트에 SDK 를 붙이는 코드 (20장).
 * 실제 고객사 개발자가 쓰는 코드라고 생각하자: SDK 의 공개 API(CobrowseCustomer)만 사용한다.
 *
 * URL 파라미터 (실습용)
 *   ?customer=customer-2              고객 ID
 *   ?ws=ws://localhost:8081/ws,ws://localhost:8082/ws   서버 직접 지정 (23·24장 클러스터 실습)
 *   ?ttl=40                           토큰 수명(초) — 만료·갱신 실습 (12장)
 */
import { CobrowseCustomer, type ChatMessage, type RoomStatus } from '../../sdk/src/index.ts';

const params = new URLSearchParams(location.search);
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const wsUrls = params.get('ws')?.split(',') ?? [`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`];
const ttlSeconds = params.has('ttl') ? Number(params.get('ttl')) : undefined;
if (params.has('customer')) $<HTMLInputElement>('cb-customer').value = params.get('customer')!;

// ── 고객사 사이트 자체의 동작 (SDK 와 무관한 "업무 화면 코드") ────────────
document.querySelectorAll<HTMLElement>('.plan').forEach((p) =>
  p.addEventListener('click', () => {
    document.querySelectorAll('.plan').forEach((x) => x.classList.remove('selected'));
    p.classList.add('selected');
    $('plan-desc').textContent = `선택: ${p.querySelector('b')!.textContent} — 보장 내용이 아래에 갱신됩니다.`;
  }),
);
$('add-beneficiary').addEventListener('click', () => {
  const li = document.createElement('li');
  li.textContent = `수익자 ${$('beneficiaries').children.length + 1} (법정상속인)`;
  $('beneficiaries').appendChild(li);
});
$('submit').addEventListener('click', () => toast('가입 신청이 접수되었습니다 (데모)'));
$<HTMLInputElement>('phone').addEventListener('input', (e) => {
  // 페이지가 입력을 가공하는 예: 숫자만 남기고 하이픈 자동 삽입 → 원격 입력 결과(ack)가 원래 값과 달라진다 (17장)
  const el = e.target as HTMLInputElement;
  const d = el.value.replace(/\D/g, '').slice(0, 11);
  el.value = d.length > 7 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d;
});
drawChart();

function toast(text: string) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

function drawChart() {
  const ctx = $<HTMLCanvasElement>('chart').getContext('2d')!;
  [30, 55, 40, 70, 62].forEach((v, i) => {
    ctx.fillStyle = '#2f6fed';
    ctx.fillRect(20 + i * 55, 80 - v, 30, v);
  });
}

// ── SDK 연결 ───────────────────────────────────────────────────────
let cobrowse: CobrowseCustomer | null = null;
let roomId = '';
let statsTimer = 0;

async function tenant<T>(path: string, body: unknown): Promise<T> {
  // 고객사 "자기" 서버에 묻는다. API 키는 그 서버에만 있다.
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

$('cb-start').addEventListener('click', async () => {
  const customerId = $<HTMLInputElement>('cb-customer').value.trim();
  let firstToken: string;
  try {
    const s = await tenant<{ roomId: string; token: string }>('/tenant/customer/session', { customerId, ttlSeconds });
    roomId = s.roomId;
    firstToken = s.token;
  } catch (e) {
    setState(`상담 시작 실패: ${(e as Error).message}`);
    return;
  }

  cobrowse = new CobrowseCustomer({
    urls: wsUrls,
    roomId,
    // 처음에는 받아 둔 토큰, 재연결·만료 때는 새로 받는다
    getToken: async (reason) => {
      if (reason === 'initial' && firstToken) return firstToken;
      return (await tenant<{ token: string }>('/tenant/customer/token', { customerId, roomId, ttlSeconds })).token;
    },
    tokenRefreshMs: ttlSeconds ? (ttlSeconds * 1000) / 2 : 5 * 60_000,
    mask: { maskSelectors: ['#memo'] }, // 고객사가 추가로 가릴 필드 (문의사항에 개인정보를 적을 수 있다)
    onState: (s, d) => setState(`${s}${d ? ` · ${d}` : ''}`),
    onStatus: onStatus,
    onChat: addChat,
    onError: (m) => addChat({ type: 'chat', id: crypto.randomUUID(), from: 'system', role: 'AGENT', text: `⚠ ${m}`, at: Date.now() }),
  });
  cobrowse.start();
  $<HTMLButtonElement>('cb-start').disabled = true;
  $<HTMLButtonElement>('cb-stop').disabled = false;
  $<HTMLButtonElement>('cb-control').disabled = false;
  $<HTMLButtonElement>('cb-send').disabled = false;
  statsTimer = window.setInterval(() => {
    const s = cobrowse!.stats;
    $('cb-stats').textContent = `room=${roomId} · 프레임 ${s.frames} · 메시지 ${s.messages} · ${(s.bytes / 1024).toFixed(1)}KB · 스냅샷 ${s.snapshots}`;
  }, 500);
});

$('cb-stop').addEventListener('click', async () => {
  await cobrowse?.stop();
  cobrowse = null;
  clearInterval(statsTimer);
  setState('종료');
  $<HTMLButtonElement>('cb-start').disabled = false;
  $<HTMLButtonElement>('cb-stop').disabled = true;
});

let control = false;
$('cb-control').addEventListener('click', () => {
  control = !control;
  cobrowse?.setRemoteControl(control);
  $('cb-control').textContent = `상담사 조작 허용: ${control ? '켜짐' : '꺼짐'}`;
  $('cb-control').classList.toggle('on', control);
});

$('cb-send').addEventListener('click', sendChat);
$<HTMLInputElement>('cb-text').addEventListener('keydown', (e) => e.key === 'Enter' && sendChat());
function sendChat() {
  const input = $<HTMLInputElement>('cb-text');
  if (input.value.trim()) cobrowse?.sendChat(input.value.trim());
  input.value = '';
}

function onStatus(s: RoomStatus) {
  if (s.type === 'presence') {
    $('cb-presence').textContent = s.agentsViewing.length
      ? `👀 상담사 ${s.agentsViewing.join(', ')} 님이 보고 있음 · 서버 ${s.nodes.join(',')}`
      : '상담사 대기 중';
  } else if (s.type === 'closed') {
    $('cb-presence').textContent = '상담이 종료되었습니다';
  }
}

function addChat(m: ChatMessage) {
  const div = document.createElement('div');
  div.textContent = `${m.role === 'CUSTOMER' ? '나' : m.from}: ${m.text}`;
  $('cb-chat').appendChild(div);
  $('cb-chat').scrollTop = 1e9;
}

function setState(text: string) {
  $('cb-state').textContent = text.length > 40 ? text.slice(0, 40) + '…' : text;
  $('cb-state').title = text;
}
