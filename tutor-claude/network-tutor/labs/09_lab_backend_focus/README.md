# Lab 09 — 백엔드 실무: LB, WebSocket, Rate Limit

## 실습 목표
- Python으로 라운드로빈 로드 밸런서를 직접 구현한다
- WebSocket 서버/클라이언트를 만들고 실시간 통신을 체험한다
- Circuit Breaker 패턴을 코드로 구현한다

## 파일 목록
| 파일 | 설명 |
|------|------|
| `load_balancer.py` | 라운드로빈 + Least Conn LB 구현 |
| `websocket_server.py` | WebSocket 채팅 서버 |
| `websocket_client.py` | WebSocket 채팅 클라이언트 |
| `circuit_breaker.py` | Circuit Breaker 패턴 구현 & 시뮬레이션 |
