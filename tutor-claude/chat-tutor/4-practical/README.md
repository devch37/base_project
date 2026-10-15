# 4단계 · 운영 · 보안 · 다중 서버 (20~24)

| 장 | 한 줄 요약 |
|---|---|
| [20](20-sdk-and-tooling/) | SDK 는 남의 페이지에 산다: 전역·CSS·오류 격리, 좁은 공개 API, 프로토콜 버전, ES/IIFE 빌드 |
| [21](21-tls-proxy-upgrade/) | https 면 wss. 프록시는 Upgrade 를 명시적으로 넘겨야. **협상 heartbeat < idle timeout** (실측) |
| [22](22-browser-security-privacy/) | CORS(응답 읽기) ≠ WS Origin(연결 열기). CSWSH. 받는 쪽에서 다시 소독 + sandbox + CSP. 마스킹은 고객 브라우저에서 |
| [23](23-multi-server-hazelcast/) | 로컬 메모리 → 공유. **Topic = 메시지, IMap = 상태**. 소켓은 공유 불가. heartbeat(연결) vs TTL(데이터) |
| [24](24-failover-capstone/) | 장애 유형별 close code·동작 표. 재연결 = 새 epoch 스냅샷. 캡스톤 질문 10개 |
