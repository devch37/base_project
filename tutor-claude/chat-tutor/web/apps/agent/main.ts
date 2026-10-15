/**
 * 상담사 콘솔. SDK 의 CobrowseAgent 를 화면에 붙인다.
 * URL 파라미터: ?ws=ws://localhost:8082/ws  (클러스터 실습: 고객과 다른 서버에 붙어 보기)
 */
import { CobrowseAgent, type ChatMessage, type RoomStatus } from '../../sdk/src/index.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const params = new URLSearchParams(location.search);
const wsUrls = params.get('ws')?.split(',') ?? [`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`];
const agentId = () => $<HTMLInputElement>('agent-id').value.trim();

let agent: CobrowseAgent | null = null;
let currentRoom = '';
let viewport = { w: 1280, h: 800 };

interface RoomRow {
  roomId: string;
  customerId: string;
  agents: string[];
  closed: boolean;
  remoteControl: boolean;
  presence: { customerSharing: boolean; agentsViewing: string[]; nodes: string[] };
}

async function tenant<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

// ── 대기열 ─────────────────────────────────────────────────────────
async function loadRooms() {
  try {
    const rooms = await tenant<RoomRow[]>('GET', '/tenant/rooms');
    const ul = $('rooms');
    ul.replaceChildren();
    if (rooms.length === 0) ul.innerHTML = '<li class="muted">대기 중인 상담이 없습니다. 고객 페이지에서 "상담 시작"을 눌러 보세요.</li>';
    for (const r of rooms) {
      const li = document.createElement('li');
      const sharing = r.presence.customerSharing ? '<span class="badge ok">공유 중</span>' : '<span class="badge">오프라인</span>';
      // textContent 로 넣을 값(고객 ID)은 고객이 정한 문자열 → innerHTML 에 넣으면 XSS. 아래처럼 분리한다.
      li.innerHTML = `${sharing} ${r.closed ? '<span class="badge bad">종료</span>' : ''}<br><span class="mono"></span><br>`;
      li.querySelector('.mono')!.textContent = `${r.customerId} · ${r.roomId} · 담당 ${r.agents.join(',') || '-'}`;
      const btn = document.createElement('button');
      btn.textContent = r.roomId === currentRoom ? '보는 중' : '배정받고 입장';
      btn.disabled = r.closed || r.roomId === currentRoom;
      btn.onclick = () => join(r.roomId);
      li.appendChild(btn);
      ul.appendChild(li);
    }
  } catch (e) {
    $('rooms').innerHTML = '';
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = `목록 실패: ${(e as Error).message} — npm run tenant 와 채팅 서버가 떠 있나요?`;
    $('rooms').appendChild(li);
  }
}
$('refresh').onclick = loadRooms;
setInterval(loadRooms, 3000);
loadRooms();

// ── 입장 ───────────────────────────────────────────────────────────
async function join(roomId: string) {
  await leave();
  // 1) 고객사 서버에 "이 방을 내게 배정" 요청 (실제로는 상담 배분 시스템이 하는 일)
  await tenant('POST', '/tenant/rooms/assign', { roomId, agentId: agentId() });
  currentRoom = roomId;
  $('chat').replaceChildren();

  agent = new CobrowseAgent({
    urls: wsUrls,
    roomId,
    getToken: async () => (await tenant<{ token: string }>('POST', '/tenant/agent/token', { agentId: agentId() })).token,
    tokenRefreshMs: 5 * 60_000,
    iframe: $<HTMLIFrameElement>('mirror'),
    overlay: $<HTMLCanvasElement>('overlay'),
    onState: (s, d) => {
      $('state').textContent = s;
      $('state').className = `badge ${s === 'connected' ? 'ok' : s === 'stopped' ? 'bad' : 'warn'}`;
      log('sys', `연결 상태: ${s}${d ? ` (${d})` : ''}`);
    },
    onStatus: onStatus,
    onChat: addChat,
    onError: (m) => log('err', m),
    onViewport: (w, h, url) => {
      viewport = { w, h };
      $('url').textContent = url;
      fit();
    },
    onAck: (a) => log(a.ok ? 'in' : 'err', `ack ${a.cmdId} ${a.ok ? 'OK' : `거절: ${a.reason}`}${a.value !== undefined ? ` 값="${a.value}"` : ''}`),
    onResync: (r) => log('sys', `재동기화 요청: ${r}`),
  });
  agent.start();
  for (const id of ['resync', 'close', 'leave', 'send']) $<HTMLButtonElement>(id).disabled = false;
  loadRooms();
}

async function leave() {
  if (!agent) return;
  await agent.stop();
  agent = null;
  currentRoom = '';
  for (const id of ['resync', 'close', 'leave', 'send']) $<HTMLButtonElement>(id).disabled = true;
}

$('leave').onclick = () => void leave().then(loadRooms);
$('resync').onclick = () => agent?.requestResync('manual');
$('close').onclick = () => agent?.closeRoom();
$('send').onclick = sendChat;
$<HTMLInputElement>('text').addEventListener('keydown', (e) => e.key === 'Enter' && sendChat());

function sendChat() {
  const input = $<HTMLInputElement>('text');
  if (input.value.trim()) agent?.sendChat(input.value.trim());
  input.value = '';
}

function onStatus(s: RoomStatus) {
  if (s.type === 'consent') {
    $('consent').textContent = `원격 조작: ${s.remoteControl ? '허용됨' : '꺼짐'}`;
    $('consent').className = `badge ${s.remoteControl ? 'ok' : ''}`;
    log('sys', `고객이 원격 조작을 ${s.remoteControl ? '허용' : '해제'}했습니다`);
  } else if (s.type === 'presence') {
    log('sys', `presence: 고객 ${s.customerSharing ? '공유 중' : '오프라인'} · 보는 상담사 [${s.agentsViewing}] · 서버 [${s.nodes}]`);
  } else if (s.type === 'closed') {
    log('sys', '상담 종료됨');
  }
}

function addChat(m: ChatMessage) {
  const div = document.createElement('div');
  div.textContent = `${m.role === 'AGENT' ? (m.from === agentId() ? '나' : m.from) : `고객(${m.from})`}: ${m.text}`;
  $('chat').appendChild(div);
  $('chat').scrollTop = 1e9;
}

// ── 화면 배율 맞추기: 고객 화면(예: 1440×900)을 콘솔 영역에 맞게 축소 ──────────
function fit() {
  const stage = $('stage');
  const scale = Math.min(1, stage.clientWidth / viewport.w);
  const iframe = $<HTMLIFrameElement>('mirror');
  iframe.width = String(viewport.w);
  iframe.height = String(viewport.h);
  $('scaler').style.transform = `scale(${scale})`;
  stage.style.height = `${viewport.h * scale}px`;
}
window.addEventListener('resize', fit);
fit();

setInterval(() => {
  if (!agent) return;
  const s = agent.stats;
  const r = agent.receiver.stats;
  $('stats').innerHTML = [
    ['수신 메시지', s.messages], ['수신 KB', (s.bytes / 1024).toFixed(1)], ['프레임', s.frames], ['스냅샷', s.snapshots],
    ['순서 뒤바뀜', r.reordered], ['중복', r.duplicates], ['재동기화', r.resyncs], ['지연(ms)', s.lastLatencyMs],
  ].map(([k, v]) => `<div><span class="muted">${k}</span><b>${v}</b></div>`).join('');
}, 500);

function log(kind: 'in' | 'out' | 'sys' | 'err', text: string) {
  const el = $('log');
  const line = document.createElement('div');
  line.className = kind;
  line.textContent = `${new Date().toLocaleTimeString()} ${text}`;
  el.appendChild(line);
  if (el.childElementCount > 300) el.firstElementChild?.remove();
  el.scrollTop = 1e9;
}
