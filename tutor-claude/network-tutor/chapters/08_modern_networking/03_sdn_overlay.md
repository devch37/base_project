# SDN & 오버레이 네트워크 & eBPF

## SDN (Software Defined Networking)

```
전통 네트워크:
  각 스위치/라우터가 제어 기능(Control Plane) + 데이터 전달(Data Plane) 보유
  → 분산된 설정, 변경 어려움

SDN:
  Control Plane을 중앙화 (SDN Controller)
  Data Plane(스위치)은 Controller 지시만 따름

  [SDN Controller] ← 프로그래밍
        │ OpenFlow/gRPC
  ┌─────┴─────┐
  [스위치1] [스위치2]
  (데이터 전달만)

대표 구현:
  OpenFlow, ONOS, OpenDaylight
  VMware NSX, Cisco ACI
  AWS VPC가 SDN의 클라우드 구현체
```

---

## VXLAN (Virtual eXtensible LAN)

```
UDP로 L2 프레임을 캡슐화해서 L3 네트워크를 통해 L2 확장

캡슐화:
  외부 UDP Header (dst port: 4789)
  VXLAN Header (8 byte, VNI: 24bit)
  원본 Ethernet Frame (L2)

┌──────────┬────────────┬──────────────────────────────────────┐
│ IP/UDP   │ VXLAN HDR  │ Inner Ethernet Frame (L2 payload)    │
│ dst:4789 │ VNI=10001  │ [MAC][IP][TCP][HTTP Data]            │
└──────────┴────────────┴──────────────────────────────────────┘

VTEP (VXLAN Tunnel Endpoint):
  캡슐화/역캡슐화를 수행하는 논리 장치
  각 호스트의 물리 NIC가 VTEP 역할

장점: VLAN의 4094개 한계 → 1600만 개 (24bit VNI)
사용: OpenStack, Kubernetes(Flannel), AWS VPC 내부
```

---

## eBPF (extended Berkeley Packet Filter)

```
커널에서 사용자가 작성한 프로그램을 안전하게 실행
"리눅스 커널의 슈퍼파워"

기존:
  네트워크 기능 추가 → 커널 모듈 작성 → 재컴파일, 재부팅
  위험 (커널 크래시 가능)

eBPF:
  검증된 바이트코드를 커널에 삽입
  다양한 훅 포인트: XDP, TC, kprobe, tracepoint
  안전: verifier가 무한루프, 메모리 오류 등 검증

네트워킹 활용:
  XDP (eXpress Data Path):
    NIC 드라이버 레벨에서 패킷 처리
    커널 네트워크 스택 우회 → 최고 성능
    용도: DDoS 방어, 로드 밸런싱, 패킷 필터

  TC (Traffic Control):
    L3/L4 패킷 처리
    Cilium CNI가 TC Hook에서 L4 처리

  Socket 레벨:
    소켓 옵션, 연결 추적

대표 도구:
  Cilium: K8s CNI + Service Mesh
  Falco: 컨테이너 보안 모니터링
  Pixie: K8s 관찰가능성
  bcc, bpftrace: 성능 분석
```

### eBPF vs iptables 성능

```
서비스 수 증가에 따른 처리 시간:

iptables: O(n) - 규칙 수 비례
  10 서비스:   ~1μs
  10,000 서비스: ~100μs (10만 개 규칙)

eBPF Map: O(1) - 해시맵
  10 서비스:   ~0.5μs
  10,000 서비스: ~0.5μs (변화 없음)

대규모 K8s 클러스터에서 Cilium 전환이 급증하는 이유
```

---

## 면접 단골 질문

**Q. VXLAN과 VLAN의 차이는?**
> VLAN: 스위치 내 L2 격리, 802.1Q 태그, 4094개 제한. VXLAN: UDP로 L2 프레임 캡슐화, L3 네트워크를 통해 L2 확장, 1600만 개 VNI, 데이터센터간 VM 이동 가능.

**Q. eBPF XDP가 기존 iptables보다 빠른 이유는?**
> XDP는 NIC 드라이버 레벨에서 처리 → 커널 네트워크 스택(TCP/IP 스택, iptables) 전체를 우회. 패킷이 커널 메모리로 복사되기 전에 처리 가능. DDos 방어 시 PPS(패킷/초) 단위로 수천만 개 처리 가능.
