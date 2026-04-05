# 네트워크 공격 & 방어

## DDoS (Distributed Denial of Service)

```
목표: 서비스 가용성 파괴 (정상 사용자 접근 불가)

공격 유형:
  Volume Based:    대역폭 포화 (UDP Flood, ICMP Flood)
  Protocol Based:  서버/장비 자원 소진 (SYN Flood, Ping of Death)
  Application:     L7 자원 소진 (HTTP Flood, Slowloris)
```

### SYN Flood

```
공격:
  공격자가 위조된(spoofed) 소스 IP로 SYN 대량 전송
  서버: SYN_RECEIVED 상태로 SYN Queue 가득 참
  → 정상 연결 요청(SYN) 처리 불가

  [공격자: 위조IP1] ─→ SYN ─→ [서버]
  [공격자: 위조IP2] ─→ SYN ─→ [서버]
  [공격자: 위조IP3] ─→ SYN ─→ [서버]
  서버 SYN Queue: ████████████ (가득)

방어:
  SYN Cookie: SYN Queue 없이 SYN+ACK에 쿠키 인코딩
  → 정상 클라이언트만 ACK+Cookie 반환 가능
  → 공격자의 위조 IP는 응답 못함

  Linux 활성화:
  sysctl net.ipv4.tcp_syncookies=1
```

### HTTP Flood (Layer 7 DDoS)

```
공격: 합법적인 HTTP 요청을 대량으로 전송
  → IP 차단이 어려움 (정상적인 프로토콜 사용)
  → 봇넷 사용

방어:
  Rate Limiting: IP당 요청 수 제한
  CAPTCHA: 봇 판별
  JA3 Fingerprint: TLS 클라이언트 특성 기반 차단
  WAF: 비정상 패턴 감지
  Cloudflare/AWS Shield: 대규모 DDoS 흡수
```

### Slowloris

```
공격: HTTP 요청을 매우 느리게 전송 (헤더를 조금씩)
  → 서버 연결 소켓 점유
  → 새 연결 수락 불가

GET / HTTP/1.1\r\n
Host: target.com\r\n
X-Header1: ...\r\n  ← 30초마다 1줄씩
X-Header2: ...\r\n  ← 영원히 종료 안 함

방어:
  연결 타임아웃 설정:
    client_header_timeout 10s  (Nginx)
  최소 전송 속도 설정
  연결 수 제한
```

---

## MITM (Man-in-the-Middle)

```
공격자가 통신 중간에 개입:

정상: Client ──────────────────── Server
공격: Client ── 공격자 ── Server

방법:
  ARP Spoofing: L2에서 가로채기
  DNS Spoofing: 가짜 DNS 응답
  Rogue AP: 가짜 Wi-Fi 핫스팟
  SSL Stripping: HTTPS → HTTP 강제 다운그레이드

방어:
  HTTPS 필수 (HSTS로 강제)
  인증서 피닝 (Certificate Pinning)
  HSTS Preload
  DNSSEC
```

---

## 포트 스캐닝 & 탐지

```
nmap 스캔 유형:
  TCP Connect: 완전한 3-way handshake → 느리지만 신뢰성 있음
  SYN (Half-Open): SYN만 전송, RST로 종료 → 빠름, 로그 남기기 어려움
  UDP: 응답 없으면 열린 것, ICMP Port Unreachable이면 닫힌 것
  OS Detection: TTL, TCP Window Size로 OS 추정

방어:
  포트 스캔 감지: Fail2Ban, IDS/IPS
  불필요한 포트 닫기
  Honeypot: 공격자를 속이는 가짜 서비스
  Stealth: 기본 포트 변경 (보안 효과 미미, "Security through obscurity")
```

---

## Zero Trust 보안 모델

```
기존 Perimeter 모델: "내부 네트워크는 신뢰"
  → VPN으로 내부망 접속 → 모든 서비스 접근 가능
  → 내부 침투 시 모든 것 노출

Zero Trust: "아무것도 신뢰하지 않는다, 항상 검증"
  원칙:
  1. 항상 인증 (Identity 기반)
  2. 최소 권한 (필요한 것만)
  3. 마이크로 세그멘테이션
  4. 모든 트래픽 암호화 (mTLS)
  5. 지속적 모니터링

구현:
  BeyondCorp (Google): 위치 무관, Identity + Device 기반 접근
  Cloudflare Access: Zero Trust 네트워크 서비스
  Istio/Envoy: 서비스 메시 + mTLS
```

---

## 실습 과제

```bash
# 1. SYN Cookie 상태 확인
sysctl net.ipv4.tcp_syncookies

# 2. nmap으로 포트 스캔 (자신의 서버에만!)
nmap -sS -p 1-1000 localhost   # SYN 스캔
nmap -sV localhost               # 서비스 버전 감지
nmap -O localhost                # OS 감지

# 3. 연결 수 제한 테스트 (stress test)
ab -n 10000 -c 100 http://localhost:8080/

# 4. fail2ban 상태 확인 (SSH 보호)
sudo fail2ban-client status sshd

# 5. 현재 연결 상태 모니터링
watch -n 1 'ss -s && echo "---" && ss -an | grep -c TIME-WAIT'
```

## 면접 단골 질문

**Q. DDoS와 DoS의 차이는?**
> DoS: 단일 공격 소스 → IP 차단으로 방어 가능. DDoS: 분산된 수백만 소스(봇넷) → IP 차단 어려움, 대역폭/자원 소진이 목적.

**Q. SYN Flood 방어에 SYN Cookie를 사용하면 단점은 없나요?**
> SYN Cookie는 TCP 옵션(Timestamp, Window Scale)을 상태 정보 없이 처리하지 않아 일부 TCP 기능 제한 가능. 하지만 최신 구현은 쿠키에 옵션 정보를 인코딩해서 이 문제를 줄임. SYN Flood 시에만 활성화하는 방식도 사용.

**Q. HTTPS 서비스에서 SSL Stripping 공격을 방어하는 방법은?**
> HSTS(HTTP Strict Transport Security): 브라우저에 "이 도메인은 항상 HTTPS로만 접속하라"고 지시. HSTS Preload: 브라우저에 내장. 첫 번째 접속(HTTP)에서는 여전히 취약 → Preload로 해결.
