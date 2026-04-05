# VLAN (Virtual LAN)

## 왜 필요한가?

물리적으로 같은 스위치에 연결되어 있어도 **논리적으로 다른 네트워크**로 분리.

```
문제 상황:
  하나의 스위치에 개발팀(192.168.1.x)과 회계팀(192.168.2.x)이 연결됨
  → 개발팀 PC가 회계팀 트래픽을 브로드캐스트로 받음
  → 보안 취약 + 브로드캐스트 도메인 과도하게 큼

VLAN 해결:
  VLAN 10: 개발팀 → 포트 1~10
  VLAN 20: 회계팀 → 포트 11~20
  → 같은 스위치지만 서로 다른 네트워크처럼 격리
```

---

## VLAN 동작 원리

### Access 포트 (단말 연결)
- 하나의 VLAN에만 속함
- 태그 없이 전달 (단말은 VLAN을 모름)

### Trunk 포트 (스위치 간 / 라우터 연결)
- 여러 VLAN 트래픽을 하나의 링크로 전달
- **802.1Q 태그** 사용

---

## 802.1Q VLAN 태깅

```
일반 Ethernet 프레임:
┌──────────┬────────┬──────────┬────────────┬───────┐
│ Dest MAC │Src MAC │EtherType │  Payload   │  FCS  │
└──────────┴────────┴──────────┴────────────┴───────┘

802.1Q Tagged 프레임 (Trunk 포트):
┌──────────┬────────┬──────────┬────────────────┬──────────┬────────────┬───────┐
│ Dest MAC │Src MAC │  0x8100  │  TCI (2 byte)  │EtherType │  Payload   │  FCS  │
│          │        │(태그표시)│ PCP│DEI│VLAN ID │          │            │       │
│          │        │          │ 3b │ 1b│ 12bit  │          │            │       │
└──────────┴────────┴──────────┴────────────────┴──────────┴────────────┴───────┘

VLAN ID: 0~4095 (0과 4095는 예약), 유효 범위 1~4094
PCP (Priority Code Point): QoS 우선순위 (0~7)
DEI (Drop Eligible Indicator): 혼잡 시 드롭 대상 표시
```

---

## Inter-VLAN 라우팅

VLAN 간 통신은 L3 라우터가 필요:

```
방식 1 — Router-on-a-Stick (소규모)
─────────────────────────────────────
스위치 ──[Trunk]── 라우터
                      │ 서브인터페이스:
                      ├── eth0.10 (VLAN 10: 192.168.10.1)
                      └── eth0.20 (VLAN 20: 192.168.20.1)

방식 2 — L3 스위치 (대규모, 권장)
───────────────────────────────────
L3 스위치 내부에 SVI(Switch Virtual Interface) 생성:
  SVI VLAN 10 → 192.168.10.1 (VLAN 10의 기본 게이트웨이)
  SVI VLAN 20 → 192.168.20.1 (VLAN 20의 기본 게이트웨이)
  → 라우터 없이 스위치 내부에서 라우팅
```

---

## 클라우드/컨테이너에서의 VLAN

### AWS VPC와 VLAN
```
AWS VPC ≈ 거대한 가상 스위치 + 라우터
  Subnet   ≈ VLAN
  Security Group ≈ 소프트웨어 방화벽
  Route Table ≈ 라우터 라우팅 테이블

VPC Peering: 다른 VPC를 라우터로 연결 (다른 VLAN 간 통신처럼)
```

### Docker 네트워크
```bash
# Docker 브리지 네트워크 = 소프트웨어 스위치 + VLAN
docker network create --driver bridge mynet
# → 새 가상 브리지(vbridge) 생성
# → 같은 네트워크 컨테이너끼리만 L2 통신

# 컨테이너 격리:
# docker0 브리지: 기본 네트워크 (172.17.0.0/16)
# mynet 브리지:  커스텀 네트워크 (다른 서브넷)
# → 다른 브리지 = 다른 VLAN처럼 격리
```

### Kubernetes 네트워크
```
VLAN / Overlay Network:
  Flannel: VXLAN (UDP로 L2 프레임을 L3 위에 터널링)
  Calico:  BGP (L3 순수 라우팅)
  Weave:   VXLAN + 암호화

VXLAN = VLAN을 UDP로 감싸서 L3 네트워크 위에 L2 확장
  VXLAN ID (VNI): 24bit → 1600만 개의 가상 LAN
  (VLAN 12bit = 4094개 한계 극복)
```

---

## 실습 과제

```bash
# 1. Docker 네트워크 VLAN 유사 동작 확인
docker network ls
docker network inspect bridge
# → "Subnet", "Gateway" 확인 (가상 스위치 + 라우터)

# 2. 다른 Docker 네트워크 간 격리 확인
docker network create net_a
docker network create net_b
docker run -d --network net_a --name cont_a nginx
docker run -d --network net_b --name cont_b nginx
docker exec cont_a ping cont_b   # 실패 (다른 VLAN)
docker network connect net_b cont_a
docker exec cont_a ping cont_b   # 성공 (같은 네트워크 추가)

# 3. macOS VLAN 인터페이스 확인
ifconfig | grep vlan
```

## 면접 단골 질문

**Q. VLAN과 서브넷의 차이는?**
> VLAN: L2 논리 분리 (브로드캐스트 도메인 분리). 서브넷: L3 IP 주소 범위 분리. 보통 VLAN 하나에 서브넷 하나가 매핑되지만 반드시 그럴 필요는 없음.

**Q. VXLAN이 뭐고 왜 쓰나요?**
> VLAN ID는 12bit로 최대 4094개 제한. 대규모 클라우드 데이터센터에서는 수백만 테넌트를 지원해야 하므로 24bit VXLAN ID(~1600만)가 필요. UDP 위에 L2 프레임을 캡슐화해서 L3 네트워크를 통해 L2 확장.
