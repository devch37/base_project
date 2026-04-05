# OSPF (Open Shortest Path First)

## 개요

```
IGP(Interior Gateway Protocol) — 같은 AS 내부 라우팅
Link-State 알고리즘 기반
최단 경로: Dijkstra(다익스트라) 알고리즘 사용

특징:
  빠른 수렴 (Convergence): 장애 감지 후 수초 내 재계산
  확장성: Area 분할로 대규모 네트워크 지원
  비용(Cost) 기반: 인터페이스 대역폭으로 자동 계산
  표준: RFC 2328 (OSPFv2 for IPv4), RFC 5340 (OSPFv3 for IPv6)
```

---

## OSPF 동작 원리

### Step 1. 이웃 발견 (Neighbor Discovery)

```
라우터들이 Hello 패킷을 멀티캐스트(224.0.0.5)로 전송
같은 네트워크의 라우터가 응답 → 이웃(Neighbor) 관계 수립

Hello 패킷 내용:
  Router ID (라우터 고유 식별자)
  Area ID
  Hello/Dead Interval
  네트워크 마스크
  인증 정보 (선택)
```

### Step 2. LSDB 구축 (Link State Database)

```
모든 라우터가 LSA(Link State Advertisement)를 생성:
  "나(Router A)는 Router B(cost=1)와 Router C(cost=5)에 연결됨"

LSA를 Flooding으로 모든 라우터에 전달
→ 모든 라우터가 동일한 LSDB 보유
→ LSDB = 전체 네트워크 토폴로지 지도
```

### Step 3. 최단 경로 계산 (SPF)

```
각 라우터가 Dijkstra 알고리즘으로 자신을 루트로 한 SPF Tree 계산
→ 각 목적지까지 최소 비용 경로 결정
→ 라우팅 테이블에 반영
```

### 비용(Cost) 계산

```
Cost = Reference Bandwidth / Interface Bandwidth
기본 Reference Bandwidth = 100Mbps

  100Mbps Ethernet: cost = 100/100 = 1
  10Mbps Ethernet:  cost = 100/10  = 10
  1Gbps Ethernet:   cost = 100/1000 = 0.1 → 1로 반올림
  (문제: 1Gbps와 10Gbps가 같은 cost=1 → reference bandwidth 조정 필요)

권장: reference-bandwidth 10000 (10Gbps 기준)
  10Gbps: cost = 10000/10000 = 1
  1Gbps:  cost = 10000/1000 = 10
  100Mbps: cost = 10000/100 = 100
```

---

## OSPF Area

대규모 네트워크에서 LSDB 크기 제한을 위해 Area로 분할:

```
       Area 0 (Backbone)
      ┌─────────────────┐
      │  ABR    ABR     │
      │   ┼──────┼      │
      │  ABR    ABR     │
      └──┼──────┼───────┘
         │      │
    Area 1    Area 2
    (일반)    (일반)

Area 0: 모든 Area가 반드시 연결되어야 하는 백본 Area
ABR (Area Border Router): 두 Area를 연결하는 라우터
ASBR (AS Boundary Router): 다른 AS와 연결하는 라우터 (예: BGP로 외부 연결)

각 Area 내부: 상세 LSA만 교환
Area 간: Summary LSA (요약 경로만)
→ LSDB 크기 제한, 계산량 감소
```

---

## OSPF 실무 적용

```
Kubernetes에서의 OSPF 활용:
  Calico CNI는 BGP를 사용하지만
  일부 환경에서는 OSPF로 Pod 네트워크 라우팅

데이터센터 내부:
  ToR(Top of Rack) 스위치 간 OSPF
  ECMP로 여러 업링크 동시 사용

설정 예 (Cisco IOS):
  router ospf 1
    router-id 1.1.1.1
    network 10.0.0.0 0.0.0.255 area 0
    network 192.168.1.0 0.0.0.255 area 1
    auto-cost reference-bandwidth 10000
```

---

## 면접 단골 질문

**Q. OSPF와 RIP의 차이는?**
> RIP: Distance Vector, 홉 수 기준, 최대 15홉, 느린 수렴. OSPF: Link State, 대역폭 기반 비용, 빠른 수렴, 확장성 좋음. 현대 기업 네트워크는 OSPF 사용.

**Q. OSPF에서 Area 0이 왜 필요한가요?**
> 모든 Area가 Backbone을 통해 통신하도록 강제 → 라우팅 루프 방지. Area 간 직접 연결은 라우팅 루프를 유발할 수 있음.
