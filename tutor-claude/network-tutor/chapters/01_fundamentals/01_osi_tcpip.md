# OSI 7계층 vs TCP/IP 4계층

## 왜 계층 모델이 필요한가?

네트워크는 너무 복잡하다. 케이블 물리 신호부터 애플리케이션 데이터까지 한 번에 다루면 장애 원인 추적, 프로토콜 교체, 개발이 불가능해진다.
계층 모델은 **관심사 분리(Separation of Concerns)**다 — 각 계층은 자기 일만 하고, 위아래 계층과 정해진 인터페이스로만 통신한다.

---

## OSI 7계층

```
┌─────────────────────────────────────┐
│  7. Application   (응용 계층)        │  HTTP, FTP, SMTP, DNS
│  6. Presentation  (표현 계층)        │  TLS/SSL, 압축, 인코딩
│  5. Session       (세션 계층)        │  세션 수립/유지/종료
│  4. Transport     (전송 계층)        │  TCP, UDP — 포트 번호
│  3. Network       (네트워크 계층)    │  IP, ICMP, 라우팅
│  2. Data Link     (데이터 링크 계층) │  Ethernet, MAC, ARP
│  1. Physical      (물리 계층)        │  케이블, 광섬유, 전기 신호
└─────────────────────────────────────┘
```

### 각 계층 상세

#### Layer 1 — Physical
- **역할**: 비트(0/1)를 전기 신호, 광 신호, 전파로 변환
- **장비**: 케이블, 허브, 리피터, NIC(Network Interface Card)
- **단위**: 비트(Bit)
- **개발자가 신경 쓸 일**: 거의 없음. 단, 고속 저지연 시스템(HFT, RDMA)에선 물리 계층 최적화가 의미 있음

#### Layer 2 — Data Link
- **역할**: 같은 네트워크(LAN) 안에서 프레임 전달, 오류 감지
- **장비**: 스위치, 브리지
- **주소**: MAC 주소 (48bit, `aa:bb:cc:dd:ee:ff`)
- **단위**: 프레임(Frame)
- **핵심 프로토콜**: Ethernet, ARP, VLAN(802.1Q)
- **개발자 관련**: 컨테이너 브리지 네트워킹(docker0), MAC flooding 공격

#### Layer 3 — Network
- **역할**: 다른 네트워크 간 패킷 라우팅 (출발지 → 목적지)
- **장비**: 라우터, L3 스위치
- **주소**: IP 주소 (IPv4 32bit, IPv6 128bit)
- **단위**: 패킷(Packet)
- **핵심 프로토콜**: IP, ICMP, IGMP
- **개발자 관련**: VPC 라우팅 테이블, Security Group(IP 기반 방화벽)

#### Layer 4 — Transport
- **역할**: 종단 간(end-to-end) 신뢰성 있는 데이터 전송, 포트로 프로세스 식별
- **단위**: 세그먼트(Segment, TCP) / 데이터그램(Datagram, UDP)
- **핵심 프로토콜**: TCP, UDP
- **개발자 관련**: 포트 충돌, TIME_WAIT, Keep-Alive, 소켓 프로그래밍

#### Layer 5 — Session
- **역할**: 통신 세션 수립, 유지, 종료, 동기화
- **실제 구현**: 현대 인터넷에서는 TCP(4계층)가 흡수. 독립적 구현체 거의 없음
- **예**: RPC 세션, NetBIOS

#### Layer 6 — Presentation
- **역할**: 데이터 형식 변환, 암호화, 압축
- **실제 구현**: TLS/SSL이 이 계층에 해당하지만 구현은 Transport 위에 얹힘
- **예**: SSL/TLS, ASCII↔Unicode 변환, JPEG 압축

#### Layer 7 — Application
- **역할**: 사용자/애플리케이션이 직접 사용하는 프로토콜
- **단위**: 메시지(Message) / 데이터(Data)
- **핵심 프로토콜**: HTTP, HTTPS, FTP, SMTP, DNS, SSH, gRPC
- **개발자 관련**: 거의 모든 백엔드 개발

---

## TCP/IP 4계층 (인터넷 모델)

OSI는 이론 모델, TCP/IP는 **실제 인터넷이 동작하는 방식**을 반영한 실용 모델이다.

```
┌─────────────────────────────────────┐
│  4. Application (응용)              │  HTTP, DNS, SMTP, FTP, SSH
│  3. Transport   (전송)              │  TCP, UDP
│  2. Internet    (인터넷)            │  IP, ICMP
│  1. Network Access (네트워크 접근)  │  Ethernet, ARP, Wi-Fi
└─────────────────────────────────────┘
```

### OSI vs TCP/IP 매핑

```
OSI                     TCP/IP
─────────────────────   ──────────────────
7. Application     ┐
6. Presentation    ├──→ 4. Application
5. Session         ┘
4. Transport       ───→ 3. Transport
3. Network         ───→ 2. Internet
2. Data Link       ┐
1. Physical        ├──→ 1. Network Access
                   ┘
```

**왜 OSI 5, 6 계층이 사라졌나?**
- HTTP, TLS가 알아서 처리함. 별도 계층으로 분리할 필요가 없었음.
- 현실 세계에서는 "5계층에서 장애"라고 말하는 엔지니어가 없다.

---

## 실제 패킷 흐름 예시

브라우저에서 `https://api.example.com/users` 호출 시:

```
[브라우저 - 송신 측]
                                          PDU
─────────────────────────────────────────────────
Application  HTTP GET /users (with TLS)   메시지
             ↓ TCP 헤더 추가 (포트 443)
Transport    [TCP HDR | HTTP 데이터]       세그먼트
             ↓ IP 헤더 추가 (src IP, dst IP)
Network      [IP HDR | TCP HDR | HTTP]    패킷
             ↓ Ethernet 헤더 + FCS 추가
Data Link    [ETH HDR | IP | TCP | HTTP | FCS] 프레임
             ↓ 전기 신호로 변환
Physical     01001101 01110101 ...         비트
─────────────────────────────────────────────────

[서버 - 수신 측] 역순으로 헤더 제거 (역캡슐화)
Physical → Data Link → Network → Transport → Application
```

---

## 계층별 주소 체계 요약

| 계층 | 주소 | 범위 | 예시 |
|------|------|------|------|
| 7 Application | URL / 도메인 | 전 세계 | `api.example.com` |
| 4 Transport | 포트 번호 | 호스트 내 프로세스 | `443`, `8080` |
| 3 Network | IP 주소 | 전 세계 | `203.0.113.1` |
| 2 Data Link | MAC 주소 | 동일 LAN 내 | `aa:bb:cc:dd:ee:ff` |

---

## 면접 단골 질문

**Q. OSI 7계층을 설명하고, 각 계층 프로토콜을 하나씩 말해보세요.**
> Layer 1~7 암기보다 **각 계층이 무엇을 해결하려 했는지**를 설명하는 게 더 좋은 답변

**Q. HTTP는 몇 계층? HTTPS는?**
> HTTP: Application(7). HTTPS: TLS가 Presentation(6)에 해당하지만 실제로는 Application 바로 아래 TCP 위에 구현. 실용적으로는 "Application 계층이지만 TLS로 암호화된다"고 답변

**Q. TCP와 UDP 차이를 계층 관점에서 설명하세요.**
> 둘 다 Transport(4)계층. TCP는 연결 지향·신뢰성 보장, UDP는 비연결·속도 우선.

---

## 실습 과제

1. `tcpdump -i en0 -n` 실행 후 `curl https://httpbin.org/get` — 어떤 패킷들이 오가나?
2. Wireshark에서 HTTP 패킷 열어보고 각 계층 헤더를 직접 확인
3. `ping google.com` — 어떤 계층 프로토콜이 사용되는가? (ICMP는 몇 계층?)
