# VPN & 터널링

## VPN 개요

```
VPN = 공개 네트워크(인터넷)에 암호화된 사설 터널
      원격 사무실 연결, 재택근무, 사이트간 연결에 사용
```

---

## IPSec

```
L3 VPN 표준 프로토콜, 기업 VPN의 주류

2가지 모드:
  Transport Mode: IP 헤더 유지, 페이로드만 암호화
                  (호스트 간 직접 통신)
  Tunnel Mode:    IP 헤더 포함 전체 패킷을 캡슐화
                  (사이트 간 VPN 게이트웨이)

2가지 프로토콜:
  AH (Authentication Header):  무결성+인증 (암호화 없음)
  ESP (Encapsulating Security Payload): 암호화+무결성+인증

터널 수립 2단계 (IKE - Internet Key Exchange):
  Phase 1 (ISAKMP SA): 인증, 암호화 알고리즘 협상, 키 교환
  Phase 2 (IPSec SA):  실제 트래픽 암호화 파라미터 협상

AWS Site-to-Site VPN:
  온프레미스 ↔ AWS VPC
  IPSec over 인터넷
  이중화: 2개 VPN 터널 제공
```

---

## WireGuard — 현대적 VPN

```
특징:
  매우 단순한 코드베이스 (~4000줄 vs OpenVPN ~70000줄)
  최신 암호화: Curve25519, ChaCha20-Poly1305
  UDP 기반 (빠름, NAT 친화적)
  빠른 핸드셰이크: 1-RTT
  상태 저장 없음 (각 패킷 독립 처리)
  Linux 커널 내장 (5.6 이상)

사용 사례:
  Tailscale, Cloudflare Warp의 기반
  Kubernetes 노드 간 암호화 통신
  개인 VPN 서버

설정 예 (서버):
  [Interface]
  Address = 10.0.0.1/24
  ListenPort = 51820
  PrivateKey = <서버 개인키>

  [Peer]
  PublicKey = <클라이언트 공개키>
  AllowedIPs = 10.0.0.2/32

설정 예 (클라이언트):
  [Interface]
  Address = 10.0.0.2/24
  PrivateKey = <클라이언트 개인키>

  [Peer]
  PublicKey = <서버 공개키>
  Endpoint = vpn.example.com:51820
  AllowedIPs = 0.0.0.0/0  # 모든 트래픽을 VPN으로
  PersistentKeepalive = 25
```

---

## 터널링 프로토콜 비교

| 프로토콜 | 계층 | 특징 | 사용 사례 |
|---------|------|------|---------|
| IPSec | L3 | 표준, 복잡 | 기업 S2S VPN |
| WireGuard | L3 | 단순, 빠름 | 개인/소규모 VPN |
| OpenVPN | L3/L4 | 유연, TLS 기반 | 원격 접속 VPN |
| GRE | L3 | 암호화 없음 | 터널링만 (IPSec과 결합) |
| VXLAN | L2 over UDP | L2 확장 | 컨테이너 네트워크 |
| SSL/TLS VPN | L7 | HTTPS 기반 | 브라우저 기반 VPN |

---

## 면접 단골 질문

**Q. IPSec Tunnel Mode와 Transport Mode의 차이는?**
> Tunnel Mode: 원본 IP 헤더까지 캡슐화 → VPN 게이트웨이 간 통신에 사용. Transport Mode: 페이로드만 암호화, IP 헤더 노출 → 호스트 간 직접 암호화 통신.

**Q. WireGuard가 OpenVPN보다 빠른 이유는?**
> 커널 모드 동작 (OpenVPN은 유저 스페이스), 최신 암호화 알고리즘(ChaCha20-Poly1305, 하드웨어 가속), 단순한 코드 구조, UDP 기반.
