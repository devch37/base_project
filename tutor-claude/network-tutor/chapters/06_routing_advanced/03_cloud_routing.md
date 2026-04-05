# 클라우드 네트워킹 라우팅

## AWS VPC 라우팅

```
VPC 라우팅 기본 구조:

Internet Gateway (IGW):
  VPC ↔ 인터넷
  Public Subnet의 Route Table: 0.0.0.0/0 → IGW

NAT Gateway:
  Private Subnet → 인터넷 (단방향 아웃바운드)
  Private Subnet Route Table: 0.0.0.0/0 → NAT GW

VPC Peering:
  VPC A ↔ VPC B (직접 연결)
  Route Table 양쪽에 추가 필요
  Transit하지 않음 (A-B Peering, B-C Peering → A-C 통신 불가)

Transit Gateway:
  허브 앤 스포크 방식으로 여러 VPC 연결
  A-B-C 모두 TGW를 통해 통신
  온프레미스 VPN/Direct Connect도 TGW로 집결
```

### VPC 라우팅 테이블 예시

```
Public Subnet Route Table:
  Destination      Target
  10.0.0.0/16      local        ← VPC 내부 통신
  0.0.0.0/0        igw-xxx      ← 인터넷

Private Subnet Route Table:
  Destination      Target
  10.0.0.0/16      local
  10.1.0.0/16      tgw-xxx      ← 다른 VPC (via Transit GW)
  0.0.0.0/0        nat-xxx      ← 인터넷 (NAT 경유)

DB Subnet Route Table:
  Destination      Target
  10.0.0.0/16      local        ← VPC 내부만, 인터넷 없음
```

---

## VPN과 Direct Connect

```
Site-to-Site VPN:
  온프레미스 ──[인터넷 + IPSec 터널]── AWS VPC
  BGP로 경로 교환
  지연: 인터넷 경유 (50~100ms)
  비용: 낮음, 구축 쉬움

AWS Direct Connect:
  온프레미스 ──[전용 회선]── AWS DX Location ── VPC
  BGP로 경로 교환
  지연: 낮음 (10~20ms)
  대역폭: 1Gbps ~ 100Gbps
  비용: 높음, 구축 시간 필요 (수주)
  사용: 대용량 데이터 이전, 규정 준수 (금융, 의료)
```

---

## PrivateLink

```
서비스 제공자의 서비스를 고객 VPC에서 프라이빗하게 접근:

제공자 VPC:
  [NLB] ← [API 서버들]

고객 VPC:
  [VPC Endpoint (ENI)] ── PrivateLink ── [제공자 NLB]

특징:
  트래픽이 인터넷 경유 안 함
  별도 VPC Peering, NAT 불필요
  고객 VPC의 IP로 접근
  AWS 서비스들도 PrivateLink 사용:
    com.amazonaws.ap-northeast-2.s3
    com.amazonaws.ap-northeast-2.secretsmanager
```

---

## 면접 단골 질문

**Q. VPC Peering과 Transit Gateway의 차이는?**
> VPC Peering: 1:1 연결, Transitive 라우팅 불가, 많아지면 관리 복잡. Transit Gateway: 허브 방식, 많은 VPC를 하나의 TGW로 연결, Transitive 라우팅 가능. 10개 이상 VPC 연결 시 TGW 권장.

**Q. Private Subnet의 EC2가 S3에 접근하는 방법은?**
> 방법 1: NAT Gateway를 통해 인터넷 경유 S3 접근 (비용 발생, 인터넷 경유). 방법 2: S3 VPC Gateway Endpoint 사용 (무료, 인터넷 경유 안 함, VPC Route Table에 S3 엔드포인트 추가).
