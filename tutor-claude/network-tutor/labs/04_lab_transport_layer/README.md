# Lab 04 — TCP/UDP 소켓 프로그래밍

## 실습 목표
- Python으로 TCP/UDP 서버-클라이언트를 직접 구현한다
- 3-way handshake와 4-way handshake를 tcpdump로 포착한다
- TIME_WAIT, CLOSE_WAIT 소켓 상태를 실제로 만들어보고 관찰한다

## 파일 목록
| 파일 | 설명 |
|------|------|
| `tcp_server.py` | TCP 에코 서버 |
| `tcp_client.py` | TCP 에코 클라이언트 |
| `udp_server.py` | UDP 에코 서버 |
| `udp_client.py` | UDP 에코 클라이언트 |
| `step_handshake.sh` | 3-way handshake 캡처 |
| `step_timewait.sh` | TIME_WAIT & CLOSE_WAIT 관찰 |
