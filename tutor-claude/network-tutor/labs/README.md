# Network Tutor — 실습 랩 가이드

이론 챕터와 1:1 대응하는 실습 랩입니다.
각 랩은 **실제로 실행 가능한 코드와 명령어**로 구성되어 있습니다.

---

## 실습 환경 준비

```bash
# 필수 도구 (macOS 기준)
brew install wireshark          # 패킷 분석 GUI
brew install nmap               # 포트 스캔
brew install httpie             # HTTP 테스트 (curl 대안)
brew install mtr                # traceroute + ping 통합
brew install arping             # ARP ping

# Python (기본 내장, 없으면)
python3 --version   # 3.8 이상 권장

# Docker (컨테이너 네트워킹 실습용)
# https://docs.docker.com/desktop/install/mac-install/

# tcpdump (macOS 기본 내장)
sudo tcpdump --version
```

---

## 랩 목록

| # | 랩 | 난이도 | 핵심 도구 | 예상 시간 |
|---|---|------|---------|---------|
| 1 | [기초 & OSI 계층 관찰](./01_lab_fundamentals/) | ⭐ | tcpdump, Wireshark | 30분 |
| 2 | [ARP & MAC 실습](./02_lab_data_link/) | ⭐⭐ | tcpdump, arp, arping | 30분 |
| 3 | [IP & 서브네팅 & 라우팅](./03_lab_network_layer/) | ⭐⭐ | Python, traceroute | 45분 |
| 4 | [TCP/UDP 소켓 프로그래밍](./04_lab_transport_layer/) | ⭐⭐⭐ | Python, tcpdump | 60분 |
| 5 | [DNS & HTTP & TLS 해부](./05_lab_application_layer/) | ⭐⭐⭐ | dig, curl, openssl | 60분 |
| 6 | [라우팅 심화 & 클라우드 VPC](./06_lab_routing_advanced/) | ⭐⭐⭐⭐ | Docker, 라우팅 실습 | 45분 |
| 7 | [방화벽 & 보안 실습](./07_lab_security/) | ⭐⭐⭐⭐ | iptables/pf, nmap | 60분 |
| 8 | [컨테이너 네트워킹 완전 분석](./08_lab_modern_networking/) | ⭐⭐⭐⭐ | Docker, veth, eBPF | 60분 |
| 9 | [백엔드 실무: LB, WebSocket, Rate Limit](./09_lab_backend_focus/) | ⭐⭐⭐⭐ | Python 서버 구현 | 90분 |
| 10 | [장애 시뮬레이션 & 분석](./10_lab_troubleshooting/) | ⭐⭐⭐⭐⭐ | 종합 | 90분 |

---

## 실습 원칙

1. **실행 전 이론 챕터 먼저 읽기** — 왜 이런 결과가 나오는지 예측하고 실행
2. **직접 타이핑** — 복붙 금지. 손에 익혀야 기억에 남는다
3. **결과를 분석** — "왜 이런 출력이 나왔지?" 를 항상 질문
4. **변형 실습** — 각 랩 말미의 "심화 도전"을 꼭 시도

---

## 랩 파일 구조

```
labs/01_lab_fundamentals/
├── README.md          ← 실습 목표 & 순서 안내
├── lab01_packet_observer.sh    ← 실행 스크립트
├── lab01_python_server.py      ← Python 서버 코드
└── (기타 코드 파일)
```
