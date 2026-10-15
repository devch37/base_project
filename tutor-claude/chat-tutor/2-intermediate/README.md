# 2단계 · 실시간 통신과 인증 (07~12)

| 장 | 한 줄 요약 |
|---|---|
| [07](07-http-vs-websocket/) | GET + Upgrade → **101** → 양방향 프레임. ping/pong 으로 죽은 연결 정리. close code |
| [08](08-stomp-pubsub/) | STOMP = WebSocket 위의 규칙. `/app`→컨트롤러, `/topic`→구독자 전원, `/user/queue`→나에게만 |
| [09](09-heartbeat-reconnect/) | heartbeat 협상 = max(내 송신, 상대 요구). **지수 백오프 + jitter**, 재구독, 놓친 것 채우기 |
| [10](10-authn-authz/) | 인증(401) vs 인가(403). 쿠키·세션(상태 있음) vs 토큰(상태 없음). 우리는 다른 도메인이라 토큰 |
| [11](11-jwt/) | 헤더.페이로드.서명. **서명 ≠ 암호화**. 바뀌는 정보는 토큰에 넣지 않기. API 키는 서버에만 |
| [12](12-stomp-security/) | 101 이후는 **ChannelInterceptor** 만 본다. default deny. ERROR = 연결 종료. **토큰 만료 ≠ 소켓 종료** |

## 치트시트
```text
STOMP 프레임:  COMMAND\nheader:value\n\nbody\0
heartbeat:    클라→서버 = max(cx, sy), 서버→클라 = max(sx, cy)
재연결 대기:   random(0, min(max, base × 2^attempt))
close code:   1000 정상 · 1001 떠남 · 1006 비정상 · 1008 정책 · 1009 너무 큼 · 4001 토큰만료 · 4003 퇴장 · 4401 인증실패
```
