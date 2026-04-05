# 캡슐화 & 역캡슐화 (Encapsulation / Decapsulation)

## 핵심 개념

데이터를 전송할 때 각 계층이 **자기 계층의 헤더(+트레일러)를 붙이는 것** = 캡슐화
수신 측에서 각 계층이 **자기 헤더를 벗겨내는 것** = 역캡슐화

이 덕분에 상위 계층은 하위 계층이 어떻게 동작하는지 몰라도 된다.
(HTTP는 TCP가 어떻게 데이터를 전달하는지 신경 안 씀)

---

## PDU (Protocol Data Unit)

각 계층에서 다루는 데이터 단위:

| 계층 | PDU 이름 | 설명 |
|------|----------|------|
| Application | 메시지(Message) / 데이터 | HTTP Request/Response 등 |
| Transport | 세그먼트(Segment) / 데이터그램 | TCP 세그먼트, UDP 데이터그램 |
| Network | 패킷(Packet) | IP 패킷 |
| Data Link | 프레임(Frame) | Ethernet 프레임 |
| Physical | 비트(Bit) | 0과 1의 전기 신호 |

---

## 캡슐화 과정 상세

`curl https://api.example.com/users` 실행 시 송신 측:

```
Step 1. Application Layer
─────────────────────────
HTTP Request 생성:
┌────────────────────────────────────────┐
│ GET /users HTTP/1.1                    │
│ Host: api.example.com                  │
│ Accept: application/json               │
└────────────────────────────────────────┘

Step 2. Transport Layer — TCP 헤더 추가
─────────────────────────────────────────
┌─────────────────┬──────────────────────┐
│   TCP Header    │     HTTP Data        │
│ src port: 52341 │  GET /users HTTP/1.1 │
│ dst port: 443   │  Host: ...           │
│ seq: 1001       │                      │
│ ack: ...        │                      │
│ flags: SYN/ACK  │                      │
└─────────────────┴──────────────────────┘
           ↑ 이게 "세그먼트"

Step 3. Network Layer — IP 헤더 추가
──────────────────────────────────────
┌───────────┬─────────────┬──────────────────────┐
│ IP Header │  TCP Header │     HTTP Data        │
│ src: 10.0.0.5 (내 IP)  │  GET /users ...      │
│ dst: 203.0.113.1        │                      │
│ TTL: 64   │             │                      │
│ protocol: TCP           │                      │
└───────────┴─────────────┴──────────────────────┘
           ↑ 이게 "패킷"

Step 4. Data Link Layer — Ethernet 헤더 + FCS 추가
────────────────────────────────────────────────────
┌────────────┬───────────┬─────────────┬──────────────────────┬─────┐
│  ETH HDR   │ IP Header │  TCP Header │     HTTP Data        │ FCS │
│ dst MAC    │ src IP    │ src port    │  GET /users ...      │ CRC │
│ src MAC    │ dst IP    │ dst port    │                      │     │
│ type: 0x800│           │             │                      │     │
└────────────┴───────────┴─────────────┴──────────────────────┴─────┘
           ↑ 이게 "프레임"

Step 5. Physical — 비트열로 변환 후 전송
──────────────────────────────────────────
01001000 01010100 01010100 01010000 ...
```

---

## 역캡슐화 과정 (수신 측)

```
Physical → Data Link → Network → Transport → Application

1. Physical: 전기 신호 → 비트열
2. Data Link: 비트열에서 프레임 추출, Ethernet 헤더 제거, FCS로 오류 검사
3. Network: IP 헤더 제거, 목적지 IP가 나인지 확인
4. Transport: TCP 헤더 제거, 포트로 어떤 프로세스에 전달할지 결정
5. Application: 완전한 HTTP 데이터 전달
```

---

## Ethernet 프레임 구조

```
 Preamble  Dest MAC  Src MAC  EtherType    Payload      FCS
┌─────────┬──────────┬────────┬──────────┬────────────┬───────┐
│  8 byte │  6 byte  │ 6 byte │  2 byte  │ 46~1500 B  │ 4 byte│
└─────────┴──────────┴────────┴──────────┴────────────┴───────┘

EtherType 주요 값:
  0x0800 → IPv4
  0x0806 → ARP
  0x86DD → IPv6
  0x8100 → VLAN-tagged (802.1Q)
```

**MTU (Maximum Transmission Unit)**
- Ethernet 기본 MTU: **1500 byte** (Payload 최대)
- 이보다 큰 패킷 → IP 단편화(Fragmentation) or TCP MSS로 분할
- Jumbo Frame: 9000 byte (데이터센터 내부 고속 링크에서 사용)

---

## IP 패킷 헤더 구조 (IPv4)

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┴─┴─┴─┼─┴─┴─┴─┴─┴─┴─┴─┼─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┤
│Version│  IHL  │  DSCP   │ECN│         Total Length         │
├───────┴───────┴─────────┴───┴──────┬─────────┬────────────┤
│         Identification              │  Flags  │ Frag Offset│
├─────────────────┬───────────────────┴─────────┴────────────┤
│   Time to Live  │      Protocol     │    Header Checksum   │
├─────────────────┴───────────────────┴────────────────────-─┤
│                      Source IP Address                      │
├─────────────────────────────────────────────────────────────┤
│                    Destination IP Address                   │
└─────────────────────────────────────────────────────────────┘
```

핵심 필드:
- **TTL (Time to Live)**: 라우터를 거칠 때마다 1 감소. 0 되면 패킷 폐기 + ICMP Time Exceeded 송신
  - `traceroute`가 이 원리를 이용함 (TTL=1,2,3... 순서로 보냄)
- **Protocol**: 상위 계층 프로토콜 번호 (TCP=6, UDP=17, ICMP=1)
- **Flags & Fragment Offset**: MTU 초과 시 단편화 정보

---

## TCP 세그먼트 헤더 구조

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┤
│          Source Port          │       Destination Port           │
├───────────────────────────────┴──────────────────────────────────┤
│                        Sequence Number                           │
├──────────────────────────────────────────────────────────────────┤
│                     Acknowledgment Number                        │
├──────────┬───────────────────────────────────────────────────────┤
│  Data    │  Reserved  │U│A│P│R│S│F│       Window Size           │
│  Offset  │            │R│C│S│S│Y│I│                             │
│          │            │G│K│H│T│N│N│                             │
├──────────┴───────────────────────────────────────────────────────┤
│           Checksum            │        Urgent Pointer           │
└──────────────────────────────────────────────────────────────────┘
```

핵심 필드:
- **Sequence Number**: 내가 보낸 데이터의 바이트 위치
- **Acknowledgment Number**: 상대방이 다음에 보내줘야 할 바이트 번호 (= 잘 받은 마지막 바이트 + 1)
- **Flags**: SYN(연결 시작), ACK(응답), FIN(연결 종료), RST(강제 종료), PSH(즉시 전달)
- **Window Size**: 수신 버퍼 여유 공간 (흐름 제어에 사용)

---

## 실습 과제

```bash
# 1. tcpdump로 실제 패킷 캡처 (lo 인터페이스에서)
sudo tcpdump -i lo -X -n 'tcp port 8080' &
curl http://localhost:8080/

# 2. 패킷 헤더 직접 분석
# -X: hex+ASCII 출력
# IP 헤더 20byte, TCP 헤더 20byte 확인

# 3. MTU 확인
ifconfig en0 | grep mtu
# 또는
ip link show eth0

# 4. Wireshark에서 확인
# - Frame (Layer 2): Ethernet II 섹션
# - Packet (Layer 3): Internet Protocol 섹션
# - Segment (Layer 4): Transmission Control Protocol 섹션
```

## 면접 단골 질문

**Q. MTU가 뭐고, 1500 byte를 초과하면 어떻게 되나요?**
> IP 단편화 발생. 수신 측에서 재조합. 성능 저하 원인이 됨. TCP MSS(Maximum Segment Size) 협상으로 단편화를 미리 방지함.

**Q. TTL이 왜 필요한가요?**
> 라우팅 루프 발생 시 패킷이 네트워크를 무한 순환하지 않도록 자동 폐기.

**Q. TCP는 왜 Sequence Number가 0이 아닌 랜덤값에서 시작하나요?**
> 이전 연결의 패킷과 구분하기 위해. ISN(Initial Sequence Number)을 랜덤으로 설정하지 않으면 네트워크에 지연된 이전 연결의 패킷이 새 연결에서 잘못 처리될 수 있음 (PAWS 메커니즘과 연관).
