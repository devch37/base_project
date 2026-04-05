# BGP (Border Gateway Protocol)

## BGP란?

```
인터넷을 연결하는 유일한 EGP(Exterior Gateway Protocol)
AS(Autonomous System) 간 라우팅 프로토콜
"인터넷의 접착제"

특징:
  경로 벡터(Path Vector) 알고리즘 — AS 경로 기반
  TCP 179 포트 사용 (신뢰성 있는 세션)
  대규모: 전 세계 약 90만 개 이상의 BGP 경로(Prefix) 처리
  정책 기반: 트래픽 엔지니어링, 비용 최적화 가능
```

---

## eBGP vs iBGP

```
eBGP (External BGP):
  다른 AS 간 BGP
  직접 연결된 라우터 간 (일반적으로 1홉)
  예: KT(AS3462)와 SKB(AS9318) 사이

iBGP (Internal BGP):
  같은 AS 내부 BGP
  AS 내 모든 라우터에 eBGP로 받은 경로 전파
  iBGP Full-Mesh 필요 (또는 Route Reflector)
  예: KT 내부 라우터들 간
```

---

## BGP 경로 속성 & 선택

```
BGP는 여러 경로 중 하나를 선택:

선택 순서 (Weight → Local Pref → AS Path 길이 → ...):

1. Weight (Cisco 전용): 높을수록 선호
2. Local Preference: AS 나갈 때 선호 경로 (높을수록 선호)
   예: 미국 트래픽은 미국 회선으로 (LP=200 vs 기본 100)
3. Locally Originated: 직접 생성한 경로 우선
4. AS Path Length: 짧을수록 선호
   예: [AS1 AS2] vs [AS1 AS2 AS3] → 전자 선호
5. Origin: IGP > EGP > Incomplete
6. MED (Multi-Exit Discriminator): 낮을수록 선호
   인접 AS에게 어느 진입점을 선호하는지 힌트
7. eBGP over iBGP
8. IGP Metric (Lowest): iBGP에서 next-hop까지 거리
9. Router ID: 낮을수록 선호 (타이브레이커)
```

---

## BGP와 인터넷 장애

```
2021년 10월 Facebook 6시간 다운 사례:
  원인: BGP 설정 변경으로 Facebook의 BGP 경로 전체 철회
  → 전 세계 라우터에서 facebook.com IP 경로 삭제
  → DNS 서버도 Facebook 네트워크 내에 있어서 접근 불가
  → 내부 접근도 불가 (VPN도 DNS 의존)
  복구: 현장에 기술자가 직접 접근해서 BGP 재설정

교훈: BGP 변경은 인터넷 전체에 영향. 변경 관리 중요.
```

---

## BGP 실무 (클라우드 관련)

```
AWS Direct Connect + BGP:
  회사 IDC ──[전용선]── AWS DX 엔드포인트
  BGP로 온프레미스 IP ↔ VPC 경로 교환
  Private ASN: 64512-65535 (AWS VPC용)

Kubernetes Calico (BGP 모드):
  각 노드가 BGP Speaker
  Pod CIDR을 BGP로 라우터에 광고
  → 외부에서 Pod IP로 직접 라우팅 가능 (오버레이 불필요)

Anycast:
  동일 IP를 여러 위치에서 BGP로 광고
  클라이언트는 라우팅상 가장 가까운 서버로 연결
  예: 8.8.8.8은 Google 데이터센터 어디든 광고
     1.1.1.1은 Cloudflare 전 세계 200개 이상 PoP에서 광고
```

---

## 면접 단골 질문

**Q. BGP가 왜 TCP를 사용하나요?**
> BGP 세션은 장기간 유지되는 신뢰성 있는 연결. 경로 정보는 대용량이 될 수 있음. TCP가 재전송, 순서 보장, 흐름 제어를 처리해서 BGP는 경로 정책에 집중 가능.

**Q. AS Path가 긴 경로를 피하는 이유는?**
> AS Path가 길면 더 많은 AS를 거침 → 더 많은 홉 → 지연 증가. 단, 실제 물리적 거리와 항상 일치하지 않음. 지연 최적화는 별도 메트릭(MED, Local Pref) 사용.
