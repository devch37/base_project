# TCP 심층 분석

## TCP의 핵심 보장

```
1. 신뢰성 (Reliability):   모든 데이터가 빠짐없이 전달됨
2. 순서 보장 (Ordering):   보낸 순서대로 수신
3. 오류 검출 (Error Check): 손상된 데이터 재전송
4. 흐름 제어 (Flow Control): 수신 버퍼 초과 방지
5. 혼잡 제어 (Congestion): 네트워크 과부하 방지
```

---

## 3-Way Handshake (연결 수립)

```
Client                              Server
  │                                   │
  │──── SYN (seq=x) ──────────────→   │  CLIENT: SYN_SENT
  │                                   │  SERVER: SYN_RECEIVED
  │   ←── SYN+ACK (seq=y, ack=x+1) ──│
  │                                   │
  │──── ACK (seq=x+1, ack=y+1) ────→  │  CLIENT: ESTABLISHED
  │                                   │  SERVER: ESTABLISHED
  │                                   │
  │  ←────── DATA 교환 ──────────────→ │

SYN: Synchronize (연결 시작 요청)
ACK: Acknowledgment (수신 확인)
seq: Sequence Number (ISN: Initial Sequence Number - 랜덤값)
```

### 왜 3-Way인가? 2-Way로는 안 되나?

```
2-Way의 문제:
  Client → SYN → Server: Server는 Client가 받았는지 모름
  Server → SYN+ACK → Client

Client가 SYN+ACK를 받았다는 것을 Server가 알아야
→ Client의 ACK가 필요 → 3-Way

양방향 연결 수립이 목적:
  - Client → Server 방향 동기화: SYN, SYN+ACK
  - Server → Client 방향 동기화: SYN+ACK, ACK
```

---

## 4-Way Handshake (연결 종료)

```
Client                              Server
  │                                   │
  │──── FIN (seq=u) ────────────────→ │  CLIENT: FIN_WAIT_1
  │                                   │  SERVER: CLOSE_WAIT
  │   ←── ACK (ack=u+1) ─────────────│  CLIENT: FIN_WAIT_2
  │                                   │
  │  (Server가 남은 데이터 전송 중...)  │
  │                                   │
  │   ←── FIN (seq=v) ───────────────│  SERVER: LAST_ACK
  │                                   │  CLIENT: TIME_WAIT
  │──── ACK (ack=v+1) ──────────────→ │
  │                                   │  SERVER: CLOSED
  │  (2*MSL 대기 후)                  │
  │                                   │  CLIENT: CLOSED
```

### TIME_WAIT란?

```
상태: 연결 종료 후 2*MSL(Maximum Segment Lifetime) 대기
      Linux 기본: MSL=60초 → TIME_WAIT=120초
      실제 커널: /proc/sys/net/ipv4/tcp_fin_timeout (기본 60초)

이유:
1. 마지막 ACK 분실 대비
   → 서버가 FIN을 재전송할 경우 처리하기 위해
2. 지연된 패킷 처리
   → 이전 연결의 패킷이 새 연결에서 잘못 처리되는 것 방지

문제: 대규모 서버에서 TIME_WAIT 소켓이 수십만 개 쌓임
```

### TIME_WAIT 줄이는 방법

```bash
# /etc/sysctl.conf 설정

# 1. SO_REUSEADDR - TIME_WAIT 소켓 포트 재사용
net.ipv4.tcp_tw_reuse = 1  # (클라이언트 측에서 포트 재사용)

# 2. TIME_WAIT 타임아웃 단축 (신중히!)
net.ipv4.tcp_fin_timeout = 30  # 기본 60초를 30초로

# 3. Keep-Alive로 연결 유지 (TIME_WAIT 자체를 줄임)
net.ipv4.tcp_keepalive_time = 60
net.ipv4.tcp_keepalive_intvl = 10
net.ipv4.tcp_keepalive_probes = 6

# 4. 로컬 포트 범위 확장 (클라이언트 측)
net.ipv4.ip_local_port_range = 1024 65535

# 주의: tcp_tw_recycle은 NAT 환경에서 문제 발생 → Linux 4.12에서 제거됨
```

---

## TCP 상태 머신 전체

```
                    [CLOSED]
                       │ passive open (listen)   active open (connect)
                       ↓                              │
                   [LISTEN] ←───────────────────────  │
                       │ SYN 수신                     │ SYN 전송
                       ↓                              ↓
                [SYN_RECEIVED]              [SYN_SENT]
                       │ SYN+ACK 전송         │ SYN+ACK 수신, ACK 전송
                       │ ACK 수신             ↓
                       └─────────→ [ESTABLISHED] ←────┘
                                      │   │
                           close()    │   │ FIN 수신
                           FIN 전송   │   ↓
                                      │ [CLOSE_WAIT]
                              [FIN_WAIT_1]   │ close()
                                      │   │ FIN 전송
                                      │   ↓
                              [FIN_WAIT_2]  [LAST_ACK]
                                      │   │ ACK 수신
                       FIN 수신       │   ↓
                       ACK 전송       │ [CLOSED]
                                      ↓
                               [TIME_WAIT]
                                  (2*MSL)
                                      │
                                      ↓
                                  [CLOSED]
```

---

## 흐름 제어 (Flow Control)

**목적**: 수신 측 버퍼가 가득 차지 않도록 전송 속도 조절

```
TCP Header의 Window Size 필드 활용:

수신 측: "내 버퍼 여유 공간이 X byte야" → Window Size에 전달
송신 측: Window Size만큼만 ACK 없이 전송 가능

예:
  수신 버퍼: 64KB
  이미 처리 중: 20KB
  남은 공간: 44KB → Window Size=44KB를 전송

  송신 측: 44KB까지 전송 후 대기
  수신 측 처리 완료: Window Size=64KB 갱신
  송신 측: 다시 전송

Window Size = 0: Zero Window
  → 송신 측 전송 중단 ("TCP Window Full" in Wireshark)
  → 주기적으로 Window Probe 전송해서 재개 시점 확인
```

---

## 혼잡 제어 (Congestion Control)

**목적**: 네트워크 자체가 과부하되지 않도록 조절

```
혼잡 윈도우(cwnd, Congestion Window):
  네트워크 상황에 따라 동적으로 조절되는 전송 한도

알고리즘:

1. Slow Start (느린 시작 — 이름과 달리 지수 증가)
   cwnd: 1 → 2 → 4 → 8 → 16 ... (2배씩 증가)
   ssthresh(임계값) 도달 시 Congestion Avoidance로 전환

2. Congestion Avoidance (혼잡 회피 — 선형 증가)
   cwnd: +1 MSS per RTT (선형 증가)

3. 패킷 손실 감지:
   - Timeout: cwnd=1로 리셋, ssthresh=cwnd/2, Slow Start 재시작
   - 3 Duplicate ACK: ssthresh=cwnd/2, cwnd=ssthresh (Fast Retransmit)

현대 알고리즘:
  CUBIC (Linux 기본): 3차 함수 기반, 빠른 회복
  BBR (Google, 2016): 대역폭 측정 기반, 고속/장거리 링크에 효율적
```

```
cwnd 변화:
  ssthresh=16

  ▲
16│          ╭──────────────── Congestion Avoidance
  │        ╭╯ (+1 per RTT)
  │      ╭╯
8 │    ─╯  Slow Start 종료
  │  ╭╯   (ssthresh 도달)
4 │╭╯
2 ├╯
1 ┼
  └─────────────→ RTT
```

---

## 재전송 메커니즘

```
1. ACK 기반 재전송 (RTO - Retransmission Timeout)
   패킷 전송 후 RTO 내에 ACK 없으면 재전송
   RTT를 측정해서 RTO 계산: RTO ≈ SRTT + 4*RTTVAR

2. Fast Retransmit (빠른 재전송)
   같은 ACK가 3번 연속(Duplicate ACK) → RTO 기다리지 않고 즉시 재전송
   예: ACK 100이 3번 → "패킷 101이 분실됨" → 즉시 재전송

3. SACK (Selective ACK)
   "101은 없는데 102~200은 받았어" → 101만 재전송 (비효율 제거)
```

---

## 실습 과제

```bash
# 1. TCP 소켓 상태 확인
netstat -an | grep -E 'ESTABLISHED|TIME_WAIT|CLOSE_WAIT'
ss -an | grep -E 'ESTAB|TIME-WAIT|CLOSE-WAIT'

# 2. TIME_WAIT 개수 확인
ss -an | grep TIME-WAIT | wc -l

# 3. 커널 TCP 파라미터 확인
sysctl net.ipv4.tcp_fin_timeout
sysctl net.ipv4.ip_local_port_range

# 4. Wireshark로 3-way handshake 관찰
# 필터: tcp.flags.syn == 1 or tcp.flags.fin == 1
# → SYN, SYN+ACK, ACK 패킷 확인
# → 각 패킷의 Sequence Number, Window Size 확인

# 5. 연결 추적 실시간 모니터링
watch -n 1 'ss -s'
# tcp: total, established, timewait, etc.
```

## 면접 단골 질문

**Q. TIME_WAIT가 많이 쌓이면 어떤 문제가 생기나요? 어떻게 해결하나요?**
> 로컬 포트 고갈 (클라이언트 측), 메모리 사용. 해결: tcp_tw_reuse=1 (포트 재사용), Keep-Alive로 연결 유지, 포트 범위 확장.

**Q. CLOSE_WAIT 소켓이 계속 쌓이면 무엇을 의심해야 하나요?**
> 애플리케이션이 소켓을 close() 하지 않는 버그. 상대방이 FIN을 보냈는데 내 쪽에서 처리 안 하고 있는 상태. 리소스 누수(Resource Leak).

**Q. 흐름 제어와 혼잡 제어의 차이는?**
> 흐름 제어: 수신 측 버퍼 초과 방지 (수신 측이 Window Size로 제어). 혼잡 제어: 네트워크 경로의 혼잡 방지 (송신 측이 cwnd로 자율 제어).
