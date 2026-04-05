# UDP & QUIC

## UDP란?

```
UDP (User Datagram Protocol)

특징:
  ✗ 연결 수립 없음 (비연결)
  ✗ 순서 보장 없음
  ✗ 재전송 없음
  ✗ 흐름/혼잡 제어 없음
  ✓ 빠름 (오버헤드 최소)
  ✓ 브로드캐스트/멀티캐스트 가능
  ✓ 애플리케이션이 직접 제어 가능
```

### UDP 헤더 (8 byte — 매우 단순)

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┤
│          Source Port          │       Destination Port           │
├───────────────────────────────┴──────────────────────────────────┤
│             Length            │           Checksum               │
└──────────────────────────────────────────────────────────────────┘
```

TCP(최소 20byte) vs UDP(8byte) → 헤더 오버헤드 2.5배 차이

---

## UDP를 선택하는 상황

### 1. 실시간 미디어 (Streaming, 화상통화)
```
특성: 약간의 패킷 손실 OK, 지연이 더 치명적
  → TCP: 재전송 대기 중 다음 프레임도 대기 → 화면 끊김
  → UDP: 손실된 프레임은 그냥 스킵, 다음 프레임 출력

사용: WebRTC(영상통화), RTP/RTCP(스트리밍), SRTP(암호화)
```

### 2. DNS
```
특성: 요청/응답이 단 한 번, 작은 데이터
  → TCP: 3-way handshake 오버헤드가 요청 자체보다 큼
  → UDP: 단일 패킷으로 요청/응답

예외: DNS over TCP
  - 응답이 512 byte 초과 (truncation flag)
  - Zone Transfer (AXFR)
  - DNS over TLS (DoT)
```

### 3. 게임 (특히 FPS, 배틀로얄)
```
특성: 위치 정보 등 최신값만 중요, 이전 패킷 필요 없음
  → TCP: 이전 패킷 재전송 대기 → Head-of-Line Blocking
  → UDP: 손실 무시, 최신 패킷만 처리
  → 게임 자체 프로토콜로 필요한 신뢰성만 구현 (ACK 선택적 사용)
```

### 4. IoT, 텔레메트리
```
특성: 주기적 센서 데이터, 손실 허용
  → MQTT over UDP, CoAP (Constrained Application Protocol)
```

### 5. QUIC (HTTP/3)
```
UDP 위에서 TCP의 신뢰성을 직접 구현 → 더 빠른 연결 수립
```

---

## QUIC — 차세대 전송 프로토콜

### 왜 만들어졌나?

```
TCP의 한계:
1. 커널에 구현됨 → 업그레이드가 느림 (OS 업데이트 필요)
2. Head-of-Line Blocking:
   HTTP/2는 스트림 멀티플렉싱을 했지만
   TCP 레벨에서 패킷 순서 보장 → 하나 손실되면 전체 대기
3. 연결 수립 지연: TLS 1.3도 1-RTT, TCP+TLS = 1-3RTT

QUIC 해결책:
  UDP 위에 구현 → 사용자 공간(user space)에서 빠른 업데이트
  0-RTT / 1-RTT 연결 수립
  스트림 단위 독립적 손실 복구 (HOL Blocking 해결)
  연결 ID로 IP 변경에도 연결 유지 (Wi-Fi → LTE)
```

### QUIC 연결 수립

```
기존 HTTPS (TCP + TLS 1.3):
  TCP SYN           → 1/2 RTT
  TCP SYN+ACK       ←
  TCP ACK + TLS ClientHello →  1 RTT
  TLS ServerHello   ←
  TLS Finished      →  1/2 RTT
  첫 데이터         ←
  총: 1.5 RTT (일반) 또는 2.5 RTT

QUIC (0-RTT 재연결):
  Initial + ClientHello →
  첫 데이터 포함!         ←
  총: 0 RTT (캐시된 세션) or 1 RTT (최초)
```

### QUIC = HTTP/3의 기반

```
HTTP 버전 진화:
  HTTP/1.1: TCP, 순차 처리 (Keep-Alive로 연결 재사용)
  HTTP/2:   TCP, 멀티플렉싱 (한 TCP 연결에 여러 스트림)
            But: TCP HoL Blocking 여전히 존재
  HTTP/3:   QUIC(UDP 기반), 진정한 멀티플렉싱
            스트림별 독립 손실 복구

확인:
  curl -I https://www.google.com
  # alt-svc: h3=":443" ← HTTP/3 지원 표시
```

---

## UDP 실습

```bash
# 1. DNS 쿼리 (UDP 53)
dig @8.8.8.8 google.com
# +short: 간결한 출력
# UDP 패킷 하나로 요청/응답

# 2. DNS UDP 패킷 캡처
sudo tcpdump -i en0 -n 'udp port 53'
dig google.com   # 다른 터미널에서

# 3. UDP 소켓 확인
netstat -an -u
ss -unap

# 4. HTTP/3 지원 확인
curl -v --http3 https://www.cloudflare.com 2>&1 | head -30
# (curl이 HTTP/3 빌드된 경우)

# 5. nc(netcat)으로 UDP 통신
nc -ul 9999 &          # UDP 수신 대기
echo "hello" | nc -u localhost 9999  # UDP 전송
```

## 면접 단골 질문

**Q. DNS가 UDP를 사용하는 이유는?**
> DNS 쿼리/응답이 보통 512 byte 미만으로 단일 패킷에 담김. TCP의 3-way handshake 오버헤드가 DNS 요청 자체보다 비용이 큼. 손실 시 애플리케이션(리졸버)이 재시도.

**Q. QUIC이 UDP를 선택한 이유는?**
> TCP는 커널에 구현되어 있어 업그레이드가 OS 업데이트에 의존. UDP는 단순 전달만 하므로 그 위에서 필요한 신뢰성을 사용자 공간에서 직접 구현 가능. 빠른 프로토콜 진화 가능.

**Q. UDP 기반 스트리밍에서 패킷 손실을 어떻게 처리하나요?**
> FEC(Forward Error Correction): 여분 패킷을 미리 보내 복구. Interleaving: 패킷을 섞어서 연속 손실 영향 최소화. Jitter Buffer: 수신 측에서 일정 시간 모아 순서 재조립.
