# Ethernet & MAC 주소

## Ethernet이란?

현재 LAN(Local Area Network)의 표준 프로토콜.
IEEE 802.3으로 표준화. 초기에는 동축 케이블 버스 방식이었지만 현재는 스위치 기반 Point-to-Point.

---

## MAC 주소 구조

```
AA : BB : CC : DD : EE : FF
│    │    │    │    │    └─ NIC 고유 번호 (제조사 할당)
└────┴────┘    └────┴────── OUI (Organizationally Unique Identifier)
  제조사 식별                       제조사 할당

예:
  00:1A:2B:... → Apple
  00:50:56:... → VMware (가상 머신)
  02:42:xx:xx → Docker 컨테이너

특수 MAC:
  FF:FF:FF:FF:FF:FF → 브로드캐스트 (LAN 전체)
  01:xx:xx:xx:xx:xx → 멀티캐스트 (첫 바이트 LSB=1)
```

### 가상화 환경에서의 MAC
- VMware, Docker, Hyper-V는 **가상 MAC 주소**를 생성
- 컨테이너마다 고유 MAC → veth pair로 호스트의 브리지에 연결
- 클라우드(AWS EC2)도 ENI(Elastic Network Interface)마다 고유 MAC

---

## Ethernet 프레임 구조 (복습 + 상세)

```
┌──────────┬──────────┬────────┬──────────┬────────────────┬───────┐
│ Preamble │ Dest MAC │Src MAC │EtherType │    Payload     │  FCS  │
│  7 byte  │  6 byte  │ 6 byte │  2 byte  │  46~1500 byte  │ 4byte │
└──────────┴──────────┴────────┴──────────┴────────────────┴───────┘
 + SFD(1B) = 총 8byte 프리앰블

Preamble: 수신 측과 클럭 동기화를 위한 패턴 (10101010...)
SFD (Start Frame Delimiter): 프레임 시작 표시 (10101011)
FCS (Frame Check Sequence): CRC-32 오류 검출
```

### 최소/최대 프레임 크기
- 최소 페이로드: **46 byte** (미만이면 패딩 추가) → 총 64 byte
- 최대 페이로드: **1500 byte** → 총 1518 byte
- 이유: 충돌 감지를 위한 최소 크기 보장 (CSMA/CD 시절 유산)

---

## CSMA/CD (역사적 맥락)

과거 버스형 Ethernet에서 충돌을 해결하던 방식.
현재 Full-Duplex Switch 환경에서는 사용 안 하지만, 개념은 알아야 함.

```
Carrier Sense    → 전송 전 채널이 비어있는지 확인
Multiple Access  → 여러 호스트가 동일 채널 공유
Collision        → 동시에 전송 시 충돌 발생
Detection        → 충돌 감지 후 랜덤 지연(Backoff) 후 재전송
```

**현재**: 스위치 환경에서 Full-Duplex → 충돌 없음, CSMA/CD 불필요

---

## 실습

```bash
# MAC 주소 확인
ifconfig en0 | grep ether
ip link show eth0

# ARP 테이블 (MAC↔IP)
arp -a
ip neigh

# 네트워크 인터페이스 통계 (프레임 오류 확인)
netstat -i
# RX-ERR, TX-ERR: 오류 프레임 수
# RX-DRP: 드롭된 프레임 (수신 버퍼 초과)
```

## 면접 단골 질문

**Q. IP 주소가 있는데 왜 MAC 주소가 필요한가요?**
> IP는 네트워크 간 논리 주소 (라우팅용). MAC은 동일 네트워크 내 물리 주소. 스위치는 IP를 모르고 MAC만 봄. 다른 네트워크로 이동할 때 IP는 유지, MAC은 다음 홉의 MAC으로 교체됨.
