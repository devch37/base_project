# 네트워크 장비 — Hub vs Switch vs Router vs L4/L7

## 왜 알아야 하나?

"내 서비스가 느린데 네트워크 문제야?" 할 때 어떤 장비에서 병목이 생기는지 알아야 한다.
클라우드 VPC, 로드 밸런서, 컨테이너 네트워크도 결국 이 장비들의 소프트웨어 구현이다.

---

## 장비 비교 한눈에 보기

```
┌──────────┬──────────┬───────────────────────────────────────────┐
│  장비    │ OSI 계층 │ 동작 방식                                 │
├──────────┼──────────┼───────────────────────────────────────────┤
│ Hub      │  L1      │ 들어온 신호를 모든 포트에 복사 전송       │
│ Switch   │  L2      │ MAC 주소로 목적지 포트만 선택 전송        │
│ Router   │  L3      │ IP 주소로 최적 경로를 찾아 다른 네트워크  │
│ L4 LB    │  L4      │ TCP/UDP 포트로 트래픽 분산                │
│ L7 LB    │  L7      │ HTTP URL/헤더로 트래픽 분산               │
└──────────┴──────────┴───────────────────────────────────────────┘
```

---

## Hub (L1) — 거의 사용 안 함

```
[Host A] ──┐
[Host B] ──┼── [HUB] ── 모든 포트로 동시 전송
[Host C] ──┘
```

- 들어오는 전기 신호를 **모든 포트에 그대로 복사** → 브로드캐스트
- **충돌 도메인(Collision Domain)**이 전체 허브로 공유됨
- 현재는 관리 목적(패킷 미러링·스니핑)이 아니면 사용 안 함

---

## Switch (L2) — LAN의 핵심

```
[Host A: MAC=AA] ──┐
[Host B: MAC=BB] ──┼── [SWITCH]
[Host C: MAC=CC] ──┘
         │
         └── MAC 주소 테이블 (CAM Table)
             Port 1 → AA
             Port 2 → BB
             Port 3 → CC
```

### 동작 원리

1. **Learning**: 프레임이 들어오면 출발지 MAC + 포트를 테이블에 저장
2. **Forwarding**: 목적지 MAC이 테이블에 있으면 해당 포트로만 전송
3. **Flooding**: 목적지 MAC을 모르면 모든 포트에 전송 (허브처럼 동작)
4. **Filtering**: 출발지와 목적지가 같은 포트면 전송 차단

### 백엔드 개발자와의 관계
- AWS VPC 내부, 도커 브리지 네트워크가 소프트웨어 스위치(`iptables`, Open vSwitch)
- `docker network inspect bridge` 하면 L2 스위치 역할을 하는 `docker0` 브리지 확인 가능
- MAC flooding 공격: 스위치 CAM 테이블을 가득 채워서 허브처럼 동작하게 만드는 공격

---

## Router (L3) — 인터넷의 핵심

```
[네트워크 A: 10.0.1.0/24]         [네트워크 B: 10.0.2.0/24]
   [Host A: 10.0.1.5] ──┐         ┌── [Host B: 10.0.2.10]
                        └── [ROUTER] ──┘
                              │
                          라우팅 테이블
                          ─────────────────────────
                          Dest Network  Next Hop  Interface
                          10.0.1.0/24   직접 연결  eth0
                          10.0.2.0/24   직접 연결  eth1
                          0.0.0.0/0     203.0.113.1 eth2 (기본 게이트웨이)
```

### 라우터가 하는 일
1. 패킷 수신 → **IP 헤더** 확인 (목적지 IP)
2. 라우팅 테이블 조회 (가장 구체적인 경로 선택 = Longest Prefix Match)
3. 다음 홉(Next Hop)으로 포워딩
4. TTL 1 감소
5. MAC 주소는 매 홉마다 **새로 작성** (IP는 유지, MAC은 변경)

### 중요: 라우터는 MAC 주소를 변경한다

```
[Host A] → [Router] → [Router] → [Host B]

패킷 이동 시:
  IP: src=10.0.1.5, dst=10.0.2.10    ← 끝까지 유지
  MAC (구간 1): src=AA, dst=Router의MAC
  MAC (구간 2): src=Router의MAC, dst=BB ← 매 홉마다 변경
```

---

## L4 Load Balancer

TCP/UDP 포트 기반으로 트래픽을 여러 서버에 분산:

```
Client → [L4 LB:443] → [Server 1:8443]
                     → [Server 2:8443]
                     → [Server 3:8443]
```

### 특징
- IP + 포트만 보고 결정 → **빠름**, **낮은 지연**
- HTTP 내용을 모름 (URL 기반 분기 불가)
- 구현: AWS NLB(Network Load Balancer), `iptables DNAT`

### 동작 방식 (DSR vs NAT)
```
NAT 방식:
  Client IP → LB가 Dest IP를 서버 IP로 변경 → 서버
  서버 응답 → LB가 Src IP를 자신의 IP로 변경 → Client

DSR(Direct Server Return) 방식:
  Client IP → LB가 MAC 주소만 변경 → 서버
  서버 응답 → LB를 거치지 않고 직접 Client로 (응답 트래픽 LB 우회)
  → 대용량 응답 트래픽 처리 시 유리
```

---

## L7 Load Balancer (Reverse Proxy)

HTTP 헤더, URL, 쿠키까지 분석해서 라우팅:

```
Client ─→ [L7 LB / Reverse Proxy]
              │
              ├── /api/*     → [API 서버 그룹]
              ├── /static/*  → [CDN / 정적 서버]
              └── /admin/*   → [관리 서버] (IP 기반 접근 제한)
```

### 특징
- **SSL Termination**: HTTPS → HTTP로 변환 (백엔드는 평문 처리 가능)
- **Session Sticky**: 쿠키/IP로 특정 서버에 고정
- **Circuit Breaker**: 장애 서버 자동 제외
- **Request Rewriting**: URL, 헤더 변환
- 구현: Nginx, HAProxy, AWS ALB(Application Load Balancer), Envoy

### 실무에서 L4 vs L7 선택

| 상황 | 추천 |
|------|------|
| TCP 게임 서버, WebSocket | L4 (지연 최소화) |
| HTTP API 서버 | L7 (URL 라우팅, 헬스체크) |
| 마이크로서비스 내부 통신 | L7 (Envoy/Istio, gRPC 지원) |
| DB 프록시 | L4 (ProxySQL은 L7급이지만 TCP 기반) |

---

## 방화벽 (Firewall)

```
인터넷 ──→ [방화벽] ──→ 내부 네트워크
                 │
                 ├── Packet Filter (L3/L4): IP, 포트, 프로토콜 기반 허용/차단
                 ├── Stateful Inspection: 연결 상태 추적
                 └── Application Firewall (L7): HTTP/DNS 내용 기반 필터링
```

### AWS Security Group vs NACL (Network ACL)
```
NACL (Stateless):
  - 서브넷 레벨
  - 인바운드/아웃바운드 규칙 각각 관리
  - 요청 들어올 때 허용해도 응답 나갈 때 별도로 허용 필요

Security Group (Stateful):
  - 인스턴스 레벨
  - 인바운드 허용하면 해당 연결의 아웃바운드 자동 허용
  - 실무에서 주로 사용
```

---

## 면접 단골 질문

**Q. 스위치와 라우터의 차이는?**
> 스위치: MAC 주소 기반, 같은 네트워크(LAN) 내 통신. 라우터: IP 주소 기반, 다른 네트워크 간 통신. 라우터는 TTL 감소 + MAC 주소 재작성.

**Q. L4 LB와 L7 LB 중 어떤 걸 선택해야 하나요?**
> URL 기반 라우팅, 헬스체크, SSL 종료가 필요하면 L7. 초저지연·고처리량 TCP 트래픽이면 L4.

**Q. Security Group이 Stateful이라는 게 무슨 뜻인가요?**
> 인바운드 허용된 연결에 대한 응답 트래픽은 아웃바운드 규칙 없이 자동 허용. Connection Tracking 테이블을 유지하기 때문.

## 실습 과제

```bash
# 1. 로컬 라우팅 테이블 확인
netstat -rn
# 또는
ip route show

# 2. 네트워크 인터페이스와 MAC 주소 확인
ifconfig
# 또는
ip link show

# 3. ARP 테이블 (L2 - MAC↔IP 매핑)
arp -a
# 또는
ip neigh show

# 4. 내가 보낸 패킷이 어떤 경로로 가는지
traceroute google.com
# 각 홉이 라우터 한 대씩
```
