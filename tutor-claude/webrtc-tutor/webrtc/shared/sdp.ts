/**
 * sdp.ts — SDP(Session Description Protocol) 읽기 도구 (DOM/Node 어디서나 동작하는 순수 TS)
 *
 * SDP 는 "나는 이런 미디어를 이런 방식으로 주고받을 수 있어요"를 적은 **텍스트 명세서**다.
 * WebRTC 연결의 offer/answer 는 바로 이 텍스트를 서로 교환하는 일이다.
 * 처음 보면 암호문 같지만, 줄 단위(`<타입>=<값>`)로 읽으면 규칙은 단순하다.
 *
 *   v=0                                  버전
 *   o=- 4611731400430051336 2 IN IP4 127.0.0.1   세션 소유자/ID
 *   s=-                                  세션 이름
 *   t=0 0                                유효 시간 (0 0 = 무제한)
 *   a=group:BUNDLE 0 1                   ★ 여러 미디어를 하나의 전송 연결로 묶는다 (BUNDLE)
 *   m=video 9 UDP/TLS/RTP/SAVPF 96 97    ★ 미디어 섹션 시작: 종류, 포트(무의미), 프로토콜, 코덱 payload type 목록
 *   c=IN IP4 0.0.0.0                     연결 주소(ICE 를 쓰므로 의미 없음)
 *   a=mid:1                              이 미디어 섹션의 ID
 *   a=sendrecv                           방향 (sendrecv/sendonly/recvonly/inactive)
 *   a=rtpmap:96 VP8/90000                payload type 96 = VP8 코덱, 클럭 90kHz
 *   a=fmtp:97 apt=96                     96 의 재전송(RTX) 코덱 등 부가 파라미터
 *   a=rtcp-fb:96 nack                    피드백 기능: NACK(재전송 요청), PLI(키프레임 요청), transport-cc(대역폭 추정)
 *   a=ice-ufrag:xxxx / a=ice-pwd:yyyy    ★ ICE 연결 확인용 사용자명/비밀번호 (STUN 메시지의 인증에 쓰임)
 *   a=fingerprint:sha-256 AB:CD:...      ★ DTLS 인증서 지문 — 암호화 키 교환 때 상대가 "진짜 그 사람"인지 검증
 *   a=setup:actpass                      DTLS 역할 협상 (actpass → 상대가 active/passive 선택)
 *   a=candidate:...                      ICE 후보 (연결 가능한 주소들)
 *   a=extmap:... urn:...                 RTP 헤더 확장 (오디오 레벨, 전송 시퀀스 번호 등)
 *   a=ssrc:12345 cname:...               이 스트림을 식별하는 SSRC
 */

export interface SdpCandidate {
  foundation: string;
  component: number;
  protocol: string;
  priority: number;
  ip: string;
  port: number;
  /** host | srflx | prflx | relay */
  type: string;
  relatedAddress?: string;
  relatedPort?: number;
  tcpType?: string;
  raw: string;
}

export interface SdpCodec {
  payloadType: number;
  name: string;
  clockRate: number;
  channels?: number;
  fmtp?: string;
  feedback: string[];
}

export interface SdpMedia {
  kind: string;
  mid?: string;
  direction?: string;
  protocol: string;
  codecs: SdpCodec[];
  iceUfrag?: string;
  icePwd?: string;
  fingerprint?: string;
  setup?: string;
  candidates: SdpCandidate[];
  rids: string[];
  ssrcs: number[];
  extmaps: string[];
}

export interface SdpSummary {
  bundle: string[];
  media: SdpMedia[];
}

/** `a=candidate:` 한 줄(접두사 유무 모두 허용) 파싱 */
export function parseCandidate(line: string): SdpCandidate | null {
  const body = line.replace(/^a=/, '').replace(/^candidate:/, '').trim();
  const t = body.split(/\s+/);
  // foundation component protocol priority ip port typ <type> [raddr x rport y] [tcptype z] ...
  if (t.length < 8 || t[6] !== 'typ') return null;
  const c: SdpCandidate = {
    foundation: t[0]!,
    component: Number(t[1]),
    protocol: t[2]!.toLowerCase(),
    priority: Number(t[3]),
    ip: t[4]!,
    port: Number(t[5]),
    type: t[7]!,
    raw: body,
  };
  for (let i = 8; i < t.length - 1; i += 2) {
    if (t[i] === 'raddr') c.relatedAddress = t[i + 1];
    else if (t[i] === 'rport') c.relatedPort = Number(t[i + 1]);
    else if (t[i] === 'tcptype') c.tcpType = t[i + 1];
  }
  return c;
}

export function summarizeSdp(sdp: string): SdpSummary {
  const lines = sdp.split(/\r?\n/).filter(Boolean);
  const summary: SdpSummary = { bundle: [], media: [] };
  let cur: SdpMedia | null = null;
  const sessionAttrs: { ufrag?: string; pwd?: string; fingerprint?: string; setup?: string } = {};

  for (const line of lines) {
    if (line.startsWith('a=group:BUNDLE')) {
      summary.bundle = line.slice('a=group:BUNDLE '.length).split(' ');
    } else if (line.startsWith('m=')) {
      const [kind, , protocol, ...pts] = line.slice(2).split(' ');
      cur = {
        kind: kind!,
        protocol: protocol!,
        codecs: pts.map((p) => ({ payloadType: Number(p), name: '', clockRate: 0, feedback: [] })),
        candidates: [],
        rids: [],
        ssrcs: [],
        extmaps: [],
        ...(sessionAttrs.ufrag ? { iceUfrag: sessionAttrs.ufrag } : {}),
        ...(sessionAttrs.pwd ? { icePwd: sessionAttrs.pwd } : {}),
        ...(sessionAttrs.fingerprint ? { fingerprint: sessionAttrs.fingerprint } : {}),
        ...(sessionAttrs.setup ? { setup: sessionAttrs.setup } : {}),
      };
      summary.media.push(cur);
      continue;
    }
    if (!line.startsWith('a=')) continue;
    const [key, ...restParts] = line.slice(2).split(':');
    const val = restParts.join(':');

    if (!cur) {
      // 세션 레벨 속성 (m= 이전). 미디어에 상속된다
      if (key === 'ice-ufrag') sessionAttrs.ufrag = val;
      else if (key === 'ice-pwd') sessionAttrs.pwd = val;
      else if (key === 'fingerprint') sessionAttrs.fingerprint = val;
      else if (key === 'setup') sessionAttrs.setup = val;
      continue;
    }

    switch (key) {
      case 'mid':
        cur.mid = val;
        break;
      case 'sendrecv':
      case 'sendonly':
      case 'recvonly':
      case 'inactive':
        cur.direction = key;
        break;
      case 'ice-ufrag':
        cur.iceUfrag = val;
        break;
      case 'ice-pwd':
        cur.icePwd = val;
        break;
      case 'fingerprint':
        cur.fingerprint = val;
        break;
      case 'setup':
        cur.setup = val;
        break;
      case 'candidate': {
        const c = parseCandidate(line);
        if (c) cur.candidates.push(c);
        break;
      }
      case 'rtpmap': {
        const m = /^(\d+) ([^/]+)\/(\d+)(?:\/(\d+))?/.exec(val);
        const codec = m && cur.codecs.find((c) => c.payloadType === Number(m[1]));
        if (m && codec) {
          codec.name = m[2]!;
          codec.clockRate = Number(m[3]);
          if (m[4]) codec.channels = Number(m[4]);
        }
        break;
      }
      case 'fmtp': {
        const sp = val.indexOf(' ');
        const codec = cur.codecs.find((c) => c.payloadType === Number(val.slice(0, sp)));
        if (codec) codec.fmtp = val.slice(sp + 1);
        break;
      }
      case 'rtcp-fb': {
        const sp = val.indexOf(' ');
        const pt = val.slice(0, sp);
        const fb = val.slice(sp + 1);
        for (const c of cur.codecs) if (pt === '*' || c.payloadType === Number(pt)) c.feedback.push(fb);
        break;
      }
      case 'rid': {
        const rid = val.split(' ')[0];
        if (rid) cur.rids.push(rid);
        break;
      }
      case 'ssrc': {
        const id = Number(val.split(' ')[0]);
        if (!cur.ssrcs.includes(id)) cur.ssrcs.push(id);
        break;
      }
      case 'extmap':
        cur.extmaps.push(val);
        break;
    }
  }
  return summary;
}

/** 사람이 읽기 좋은 한국어 요약 (UI/로그용) */
export function describeSdp(sdp: string): string {
  const s = summarizeSdp(sdp);
  const out: string[] = [];
  out.push(`BUNDLE(하나의 전송으로 묶임): ${s.bundle.join(', ') || '없음'}`);
  for (const m of s.media) {
    const real = m.codecs.filter((c) => c.name && !['rtx', 'red', 'ulpfec', 'flexfec-03'].includes(c.name.toLowerCase()) && !/^telephone-event$/i.test(c.name));
    out.push(`▸ ${m.kind} (mid=${m.mid ?? '?'}, ${m.direction ?? '?'})  코덱: ${real.map((c) => c.name).join(', ') || '없음'}`);
    out.push(`    ICE ufrag=${m.iceUfrag ?? '-'}  DTLS fingerprint=${(m.fingerprint ?? '-').slice(0, 30)}…  setup=${m.setup ?? '-'}`);
    if (m.candidates.length) out.push(`    후보 ${m.candidates.length}개: ${m.candidates.map((c) => `${c.type}/${c.protocol}`).join(', ')}`);
    if (m.rids.length) out.push(`    simulcast rid: ${m.rids.join(', ')}`);
  }
  return out.join('\n');
}

/** 후보 종류별 개수 */
export function countCandidateTypes(cands: Pick<SdpCandidate, 'type'>[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const c of cands) r[c.type] = (r[c.type] ?? 0) + 1;
  return r;
}
