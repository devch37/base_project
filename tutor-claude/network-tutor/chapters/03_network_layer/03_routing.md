# 라우팅 (Routing)

## 라우팅 테이블 이해

라우터는 목적지 IP를 보고 **어느 인터페이스로 보낼지** 결정:

```bash
# Linux 라우팅 테이블
$ ip route show
default via 10.0.0.1 dev eth0           # 기본 게이트웨이
10.0.0.0/24 dev eth0 proto kernel       # 직접 연결된 네트워크
172.16.0.0/16 via 10.0.0.254 dev eth0   # 특정 경로
192.168.100.0/24 via 10.0.0.10 dev eth0 # 정적 경로
```

---

## Longest Prefix Match (가장 중요한 개념)

라우터가 목적지 IP에 맞는 라우팅 항목이 여러 개일 때 **가장 구체적인(긴 프리픽스) 경로 선택**:

```
라우팅 테이블:
  10.0.0.0/8    via 1.1.1.1  (A)
  10.0.1.0/24   via 2.2.2.2  (B)
  10.0.1.128/25 via 3.3.3.3  (C)
  0.0.0.0/0     via 4.4.4.4  (D = 기본 경로)

목적지 IP: 10.0.1.200

매칭:
  A: 10.0.0.0/8    → /8 매칭 ✓
  B: 10.0.1.0/24   → /24 매칭 ✓
  C: 10.0.1.128/25 → /25 매칭 ✓ ← 가장 긴 프리픽스 → 선택
  D: 0.0.0.0/0     → /0 매칭 ✓ (모든 IP 매칭)

→ C로 라우팅 (3.3.3.3으로 전달)
```

---

## 정적 라우팅 vs 동적 라우팅

### 정적 라우팅
관리자가 직접 경로 입력:

```bash
# 정적 경로 추가
ip route add 192.168.50.0/24 via 10.0.0.254
ip route add default via 10.0.0.1  # 기본 게이트웨이

# 장점: 단순, 예측 가능, 오버헤드 없음
# 단점: 장애 시 자동 우회 불가, 대규모 네트워크 관리 어려움
# 사용: 소규모 네트워크, 특정 경로 강제
```

### 동적 라우팅
라우터들이 서로 경로 정보를 교환:

```
프로토콜 분류:

IGP (Interior Gateway Protocol) — 같은 AS 내부:
  RIP    → 홉 수 기준, 소규모 (15홉 제한)
  OSPF   → 링크 상태, 중대형 기업 네트워크
  EIGRP  → Cisco 전용, 하이브리드 방식
  IS-IS  → ISP 백본, 대규모

EGP (Exterior Gateway Protocol) — AS 간:
  BGP    → 인터넷 전체 라우팅, ISP 연결
```

---

## 핵심 개념: AS (Autonomous System)

```
AS (자율 시스템):
  단일 관리 기관이 제어하는 라우터 그룹
  각 AS는 고유한 AS 번호(ASN) 보유

예:
  AS 7018 → AT&T
  AS 15169 → Google
  AS 3462 → KT (한국통신)
  AS 9318 → SK Broadband

인터넷 = BGP로 AS들을 연결한 거대한 네트워크
```

---

## ECMP (Equal-Cost Multi-Path)

같은 비용의 경로가 여러 개일 때 트래픽 분산:

```
라우팅 테이블:
  10.0.0.0/8 via 1.1.1.1 (cost=10)
  10.0.0.0/8 via 2.2.2.2 (cost=10)  ← 동일 비용

ECMP → 두 경로를 동시 사용 (로드 밸런싱)

분배 방식:
  Per-flow:    동일 Flow(src IP+port, dst IP+port)는 같은 경로
               → 패킷 순서 보장 (TCP에 안전)
  Per-packet:  매 패킷마다 번갈아 전송
               → TCP에서 패킷 순서 뒤바뀔 수 있음 (주의)

실무:
  AWS ALB → 여러 Target 그룹을 ECMP로 분산
  Kubernetes → kube-proxy의 iptables DNAT도 ECMP 원리
```

---

## 실습 과제

```bash
# 1. 라우팅 테이블 전체 확인
netstat -rn   # macOS/Linux
ip route show # Linux

# 2. 특정 IP로 가는 경로 확인
ip route get 8.8.8.8

# 3. traceroute — 실제 라우팅 경로 추적
traceroute google.com
traceroute -n 8.8.8.8  # DNS 없이 IP로

# 4. 각 홉에서 TTL 초과 동작 확인
# traceroute는 TTL=1,2,3... 순서로 UDP/ICMP 전송
# 라우터는 TTL=0 되면 "ICMP Time Exceeded" 반환 → 라우터 IP 노출

# 5. 기본 게이트웨이 확인
netstat -rn | grep default
ip route show default
```

## 면접 단골 질문

**Q. Longest Prefix Match가 무엇인가요?**
> 라우팅 테이블에서 목적지 IP와 매칭되는 항목이 여러 개일 때, 네트워크 프리픽스가 가장 긴 (= 가장 구체적인) 경로를 선택하는 규칙.

**Q. traceroute가 어떻게 동작하나요?**
> TTL=1부터 시작해서 목적지까지 하나씩 증가. 각 라우터는 TTL이 0이 되면 ICMP Time Exceeded를 응답. 이 응답의 출처 IP가 해당 홉의 라우터 IP. 목적지 도달 시 종료.

**Q. 기본 게이트웨이(0.0.0.0/0)는 왜 필요한가요?**
> 모든 목적지 IP에 대한 경로를 라우팅 테이블에 등록하는 것은 불가능. 알 수 없는 목적지는 기본 게이트웨이로 보내서 인터넷 또는 상위 라우터가 처리하도록 위임.
