# NAT (Network Address Translation)

## 왜 NAT가 필요한가?

```
문제: IPv4 주소는 43억 개뿐인데 인터넷 기기는 수백억 개
해결: 사설 IP를 내부에서 쓰고, 인터넷에 나갈 때만 공인 IP로 변환

집에서 100대 기기가 인터넷을 사용해도 공인 IP는 1개만 필요!
```

---

## NAT 종류

### SNAT (Source NAT) — 가장 일반적

```
내부 PC가 인터넷에 접속할 때 출발지 IP 변환:

[PC: 192.168.1.5:52341] → [Router] → [인터넷 서버: 8.8.8.8:80]

나가는 패킷:
  Before: src=192.168.1.5:52341, dst=8.8.8.8:80
  After:  src=공인IP:60001, dst=8.8.8.8:80   ← src IP 변환

들어오는 응답:
  Before: src=8.8.8.8:80, dst=공인IP:60001
  After:  src=8.8.8.8:80, dst=192.168.1.5:52341 ← 역변환

NAT 테이블 (Connection Tracking):
  공인IP:60001 ↔ 192.168.1.5:52341
  공인IP:60002 ↔ 192.168.1.10:43210
  ...
```

### PAT (Port Address Translation) = Masquerading

여러 내부 IP를 **포트 번호**로 구분해서 하나의 공인 IP 공유:

```
[192.168.1.5:52341] ─┐
[192.168.1.6:38010] ─┤── [공인IP: 1.2.3.4] ──→ 인터넷
[192.168.1.7:44190] ─┘

NAT 테이블:
  1.2.3.4:60001 ↔ 192.168.1.5:52341
  1.2.3.4:60002 ↔ 192.168.1.6:38010
  1.2.3.4:60003 ↔ 192.168.1.7:44190
```

가정용 공유기, AWS NAT Gateway가 모두 PAT 방식.

### DNAT (Destination NAT) — 포트 포워딩

외부에서 내부 서버에 접근할 때 목적지 IP/포트 변환:

```
외부 클라이언트 → 공인IP:80 → (DNAT) → 내부서버:192.168.1.100:8080

포트 포워딩 규칙:
  공인IP:80  → 192.168.1.100:8080 (웹 서버)
  공인IP:22  → 192.168.1.200:22   (SSH 서버)
  공인IP:443 → 192.168.1.100:8443 (HTTPS 서버)
```

---

## AWS에서의 NAT

### NAT Gateway (SNAT)
```
Private Subnet (10.0.1.x) → NAT Gateway (Public Subnet) → 인터넷

인스턴스 IP: 10.0.1.5
NAT Gateway가 Elastic IP(공인IP)로 SNAT
→ 인터넷에서는 NAT Gateway의 Elastic IP로만 보임

용도: Private 서브넷의 EC2가 인터넷(패키지 다운로드 등)에 접근
주의: NAT Gateway는 단방향 (외부→내부 직접 접근 불가)
```

### Elastic IP + EC2 (Public Subnet)
```
EC2 → 직접 인터넷 게이트웨이로 연결
공인 IP = Elastic IP (고정 공인 IP)
NAT 없이 직접 통신
```

### AWS ALB/NLB = DNAT
```
클라이언트 → ALB(공인 IP) → (DNAT) → EC2(사설 IP)
ALB가 목적지 IP를 EC2의 사설 IP로 변환
```

---

## iptables로 NAT 구현 (Linux)

```bash
# SNAT (Masquerade) — 나가는 트래픽의 src IP를 공인 IP로 변환
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# 특정 공인 IP로 SNAT
iptables -t nat -A POSTROUTING -o eth0 -j SNAT --to-source 1.2.3.4

# DNAT — 포트 포워딩
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.1.100:8080

# NAT 테이블 확인
iptables -t nat -L -n -v

# Connection Tracking 테이블 확인
conntrack -L
```

---

## NAT의 한계 (백엔드 관련)

### 1. P2P, WebRTC 연결 문제
```
클라이언트 A (NAT 뒤) ↔ 클라이언트 B (NAT 뒤)
→ 직접 연결 불가 (둘 다 사설 IP)
→ 해결: STUN, TURN, ICE (NAT Traversal 기법)
```

### 2. Connection Tracking 테이블 고갈
```
대규모 서버에서 수십만 개의 동시 연결
NAT 테이블 항목 제한 → 새 연결 거부

확인:
cat /proc/sys/net/netfilter/nf_conntrack_count   # 현재 연결 수
cat /proc/sys/net/netfilter/nf_conntrack_max     # 최대 허용

증상: "nf_conntrack: table full, dropping packet" 로그
```

### 3. IP 투명성 손실
```
서버 측: 모든 요청이 NAT Gateway IP로만 보임
  → 클라이언트 실제 IP 추적 불가
  → 해결: X-Forwarded-For 헤더 (L7 LB), PROXY Protocol (L4 LB)
```

---

## 실습 과제

```bash
# 1. 현재 NAT 확인 (공인 IP vs 사설 IP)
curl ifconfig.me          # 공인 IP
ifconfig en0 | grep inet  # 사설 IP

# 2. iptables NAT 테이블 확인 (Linux)
sudo iptables -t nat -L -n --line-numbers

# 3. Connection Tracking
sudo conntrack -L 2>/dev/null | head -20
# 또는
cat /proc/net/ip_conntrack | head -20

# 4. 포트 포워딩 테스트
# 로컬에서 8080 포트를 80으로 포워딩
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
```

## 면접 단골 질문

**Q. NAT와 프록시의 차이는?**
> NAT: L3/L4에서 IP/포트 주소만 변환, 애플리케이션이 모름. 프록시: L7에서 동작, 새로운 연결을 맺어서 요청 중계, 헤더 수정 가능. 프록시는 클라이언트가 알거나(Forward Proxy) 모름(Reverse Proxy).

**Q. AWS Private 서브넷의 EC2가 인터넷에 접근하려면?**
> NAT Gateway를 Public 서브넷에 배치, Private 서브넷의 라우팅 테이블에서 0.0.0.0/0 → NAT Gateway로 설정. NAT Gateway가 Elastic IP(공인 IP)로 SNAT.

**Q. X-Forwarded-For 헤더가 왜 필요한가요?**
> NAT/프록시/LB를 거치면 서버는 실제 클라이언트 IP를 못 보고 중간 장비 IP만 봄. X-Forwarded-For에 원본 클라이언트 IP를 기록해서 서버가 실제 클라이언트 IP를 알 수 있게 함.
