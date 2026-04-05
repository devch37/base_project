# Network Tutor

10년차 네트워크 엔지니어 관점에서 **백엔드 개발자**가 반드시 알아야 할 네트워크 지식을 체계적으로 정리한 학습 자료입니다.
"동작하니까 OK"가 아니라 **왜 그렇게 동작하는지**, **장애가 나면 어디를 봐야 하는지**까지 다룹니다.

---

## 학습 철학

- 단순 암기 X → **원리 이해 O**
- 이론만 X → **Wireshark·tcpdump 실습 병행**
- OSI 계층을 외우는 게 아니라 **패킷 하나가 어떻게 흐르는지** 눈으로 따라가기
- 백엔드 실무(API 서버, DB, 클라우드, 컨테이너)와 연결되는 포인트 집중

---

## 챕터 구성

| # | 챕터 | 난이도 | 핵심 키워드 |
|---|------|--------|------------|
| 1 | [네트워크 기초 & 모델](./chapters/01_fundamentals/) | ⭐ Basic | OSI 7계층, TCP/IP 4계층, 캡슐화 |
| 2 | [데이터 링크 계층](./chapters/02_data_link/) | ⭐⭐ Basic+ | Ethernet, MAC, ARP, VLAN |
| 3 | [네트워크 계층 (IP)](./chapters/03_network_layer/) | ⭐⭐ Intermediate | IPv4/6, 서브넷, 라우팅, NAT |
| 4 | [전송 계층 (TCP/UDP)](./chapters/04_transport_layer/) | ⭐⭐⭐ Intermediate | 3-way handshake, 흐름/혼잡제어, 소켓 |
| 5 | [애플리케이션 계층](./chapters/05_application_layer/) | ⭐⭐⭐ Intermediate | DNS, HTTP/2/3, TLS 1.3 |
| 6 | [라우팅 심화](./chapters/06_routing_advanced/) | ⭐⭐⭐⭐ Advanced | OSPF, BGP, ECMP, MPLS |
| 7 | [네트워크 보안](./chapters/07_security/) | ⭐⭐⭐⭐ Advanced | Firewall, VPN, DDoS, Zero Trust |
| 8 | [현대 네트워킹](./chapters/08_modern_networking/) | ⭐⭐⭐⭐⭐ Advanced | SDN, 컨테이너 네트워킹, Service Mesh |
| 9 | [백엔드 개발자 집중 과정](./chapters/09_backend_focus/) | ⭐⭐⭐⭐ Advanced | LB, CDN, WebSocket, gRPC, API GW |
| 10 | [장애 분석 & 툴킷](./chapters/10_troubleshooting/) | ⭐⭐⭐⭐ Advanced | tcpdump, Wireshark, curl, netstat |

---

## 추천 학습 순서

### Phase 1 — 기반 다지기 (2~3주)
```
챕터 1 → 챕터 2 → 챕터 3 → 챕터 4
```
- 패킷이 출발지에서 목적지까지 가는 전 과정을 그림으로 그릴 수 있어야 Phase 1 완료

### Phase 2 — 실무 프로토콜 (2~3주)
```
챕터 5 → 챕터 9
```
- HTTP, DNS, TLS 패킷을 Wireshark로 직접 열어보기
- 백엔드 서버에서 발생하는 네트워크 문제 시뮬레이션

### Phase 3 — 심화 & 인프라 (3~4주)
```
챕터 6 → 챕터 7 → 챕터 8
```
- 클라우드(AWS VPC, GCP VPN) 실습과 연계하면 효과 극대화

### Phase 4 — 장애 대응 능력 (상시)
```
챕터 10 → 실제 서버에서 반복 실습
```

---

## 실습 환경 추천

```bash
# Wireshark 설치 (GUI 패킷 분석)
brew install --cask wireshark

# 네트워크 시뮬레이터
brew install iproute2mac   # ip 명령어 macOS 지원

# HTTP 실습
brew install curl httpie

# DNS 분석
brew install dig bind

# 포트 스캔
brew install nmap
```

---

## 각 챕터 구성 방식

```
챕터_N/
├── README.md          ← 챕터 개요 & 학습 목표
├── 01_개념.md          ← 이론 + 다이어그램 (ASCII)
├── 02_개념.md
└── ...
```

각 파일 말미에는 **실습 과제**와 **면접 단골 질문**이 포함되어 있습니다.
