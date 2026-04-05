# ARP (Address Resolution Protocol)

## 왜 필요한가?

IP 주소는 알지만 MAC 주소를 모를 때 → MAC 주소를 알아내는 프로토콜

```
나: "10.0.0.5 IP를 가진 애 MAC이 뭐야?"
LAN 전체에 브로드캐스트 ─→ 10.0.0.5인 Host가 "나야! MAC=AA:BB:CC"로 응답
```

---

## ARP 동작 과정

```
Host A (10.0.0.1, MAC=11:22:33)가 Host B (10.0.0.5)에 패킷 전송:

Step 1. ARP 캐시 확인
─────────────────────
  ARP Cache에 10.0.0.5 → MAC 매핑 있음? → 있으면 바로 사용
                                          → 없으면 ARP Request

Step 2. ARP Request (브로드캐스트)
────────────────────────────────────
  Ethernet Dest: FF:FF:FF:FF:FF:FF (브로드캐스트)
  Ethernet Src:  11:22:33:xx:xx:xx
  ARP:
    Sender IP:  10.0.0.1
    Sender MAC: 11:22:33:xx:xx:xx
    Target IP:  10.0.0.5
    Target MAC: 00:00:00:00:00:00 (모름)

  → LAN 내 모든 호스트가 받음

Step 3. ARP Reply (유니캐스트)
────────────────────────────────
  10.0.0.5만 응답:
  Ethernet Dest: 11:22:33:xx:xx:xx (Host A에게 직접)
  ARP:
    Sender IP:  10.0.0.5
    Sender MAC: AA:BB:CC:xx:xx:xx ← 이걸 알고 싶었음!
    Target IP:  10.0.0.1
    Target MAC: 11:22:33:xx:xx:xx

Step 4. ARP 캐시에 저장 (일정 시간 후 만료)
──────────────────────────────────────────────
  10.0.0.5 → AA:BB:CC:xx:xx:xx  TTL: 300초
```

---

## ARP 캐시 확인 및 관리

```bash
# ARP 캐시 조회
arp -a
# 출력 예:
# ? (10.0.0.1) at 11:22:33:44:55:66 on en0 ifscope [ethernet]
# ? (10.0.0.5) at aa:bb:cc:dd:ee:ff on en0 ifscope [ethernet]

# Linux
ip neigh show
# 출력 예:
# 10.0.0.1 dev eth0 lladdr 11:22:33:44:55:66 REACHABLE
# 10.0.0.5 dev eth0 lladdr aa:bb:cc:dd:ee:ff STALE

# ARP 캐시 삭제
sudo arp -d 10.0.0.5

# 수동 ARP 항목 추가
sudo arp -s 10.0.0.99 aa:bb:cc:dd:ee:99
```

### ARP 캐시 상태
- **REACHABLE**: 최근 통신 확인됨
- **STALE**: 유효기간 지났지만 다음 통신 시 재검증
- **FAILED**: 응답 없음 (호스트 없거나 다운)
- **PERMANENT**: 수동 등록, 만료 없음

---

## Gratuitous ARP (GARP)

**누가 물어보지 않았는데 스스로 "내 IP는 X, MAC은 Y야"를 브로드캐스트**

### 사용 목적

```
1. IP 충돌 감지
   → 부팅 시 "나는 10.0.0.5야" 브로드캐스트
   → 다른 호스트가 같은 IP면 응답 → 충돌 감지

2. ARP 캐시 갱신 (Failover)
   → HA(High Availability) 시나리오:
     Active 서버 장애 → Standby가 Active의 IP로 GARP 전송
     → 전체 LAN의 ARP 캐시 즉시 업데이트
   → VRRP, Keepalived가 이 방식 사용

3. 클라우드 Elastic IP 이동
   → AWS EIP를 다른 인스턴스로 이동할 때 GARP로 전파
```

---

## Proxy ARP

라우터가 다른 네트워크의 호스트를 대신해서 ARP에 응답:

```
Host A (10.0.0.1/24) → "10.0.1.5 MAC이 뭐야?" ARP Request
Router → "내가 대신 응답할게" → 라우터 MAC 반환
Host A → 라우터로 패킷 전송 → 라우터가 10.0.1.5로 포워딩
```

- 기본 게이트웨이 없는 구성에서 사용
- 클라우드(AWS VPC)에서 기본 활성화 (각 EC2는 VPC 라우터의 MAC으로 응답받음)

---

## ARP Spoofing (보안 위협)

```
정상 상황:
  Host A 의 ARP 캐시: 10.0.0.1(GW) → 11:22:33:xx:xx:xx (실제 게이트웨이 MAC)

ARP Spoofing 공격:
  공격자가 가짜 ARP Reply 전송:
  "10.0.0.1(GW)의 MAC은 공격자MAC이야!" 를 Host A에게 전송
  "10.0.0.5(Host A)의 MAC은 공격자MAC이야!" 를 게이트웨이에게 전송

결과:
  Host A → 공격자 → 게이트웨이  (Man-in-the-Middle)
  Host A 의 모든 트래픽이 공격자를 경유
```

### 대응 방법
- **Dynamic ARP Inspection (DAI)**: 스위치에서 ARP 패킷 검증 (DHCP Snooping과 연계)
- **Static ARP**: 중요 서버는 ARP 항목 수동 고정
- **암호화**: 공격자가 트래픽을 가로채도 TLS로 내용 보호
- **네트워크 분리**: VLAN으로 신뢰할 수 없는 호스트와 격리

---

## 실습 과제

```bash
# 1. ARP 동작 실시간 관찰
sudo tcpdump -i en0 -n arp
# 다른 터미널에서:
ping 10.0.0.1  # 게이트웨이 ping
# ARP Request → ARP Reply 패킷 확인

# 2. ARP 캐시 비우고 재확인
sudo arp -d 10.0.0.1
ping -c 1 10.0.0.1
arp -a  # 다시 채워졌는지 확인

# 3. arping으로 GARP 테스트
# brew install arping
sudo arping -I en0 10.0.0.1  # ARP ping (L2 레벨)
```

## 면접 단골 질문

**Q. ARP는 몇 계층 프로토콜인가요?**
> L2와 L3 사이. IP(L3) 주소로 MAC(L2) 주소를 알아내는 프로토콜이라 엄밀히는 L2.5. EtherType 값은 0x0806.

**Q. ARP Spoofing을 방지하는 방법은?**
> Dynamic ARP Inspection (스위치 기능), 정적 ARP 항목, 네트워크 분리(VLAN), TLS 암호화.

**Q. Kubernetes에서 Pod IP를 변경할 때 어떻게 다른 노드들이 알게 되나?**
> 컨테이너 네트워크(Flannel, Calico 등)가 GARP 또는 BGP로 전파. CNI 플러그인마다 방식이 다름.
