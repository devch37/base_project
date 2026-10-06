# 99 — Cross-Layer 통합 문서

> **이 프로젝트에서 가장 중요한 부분.** 각 분야를 독립적으로가 아니라 **하나의 시스템**으로 이해한다.

각 문서는 선수 Part가 끝날 때마다 작성/확장된다. 완성 후에는 여러 모듈에서 역참조하며 계속 갱신한다.

| 문서 | 시나리오 | 완성 시점 | 상태 |
|---|---|---|---|
| [`java-line-to-cpu.md`](./java-line-to-cpu.md) | `int a = b + c;` → 바이트코드 → JIT → 기계어 → CPU 파이프라인 → 캐시/RAM | Part 7 후 | ⬜ |
| [`http-request-lifecycle.md`](./http-request-lifecycle.md) | NIC IRQ → 커널 TCP/IP → 소켓 버퍼 → epoll → Tomcat poller → worker thread → DispatcherServlet → Controller | Part 8 후 | ⬜ |
| [`transactional-method.md`](./transactional-method.md) | `@Transactional` → HikariCP → JDBC → BEGIN → PG backend → buffer/WAL → COMMIT → fsync → 예외/풀 고갈/lock wait | Part 5+8 후 | ⬜ |
| [`cached-read-path.md`](./cached-read-path.md) | `GET /product/123`: 브라우저 캐시 → CDN → Nginx → `@Cacheable` → Redis → PG buffer cache → disk | Part 10 후 | ⬜ |
| [`order-to-inventory.md`](./order-to-inventory.md) | 주문 → DB tx + Outbox → CDC → Kafka → 재고 컨슈머(멱등) → 각 단계 실패·복구 | Part 12 후 | ⬜ |
| [`ssh-into-slow-server.md`](./ssh-into-slow-server.md) | 느린 서버에 SSH — 첫 10개 명령어와 각각이 배제하는 가설 | Part 13~14 후 | ⬜ |
| [`final-incident.md`](./final-incident.md) | 증상은 API 타임아웃인데 근본 원인은 3계층 떨어진 다중 증상 인시던트 (**졸업시험**) | Part 17 후 | ⬜ |

## 목표

이 문서들을 다 쓰고 나면, 학습자는 **"Controller 코드 한 줄 아래에서 컴퓨터 시스템 전체가
어떻게 움직이는지"** 를 화이트보드에서 막힘없이 그릴 수 있어야 한다.

```
HTTP 요청
  → NIC → Linux Kernel → TCP → Socket → epoll
  → Tomcat → Java Thread → Spring MVC → HikariCP → PostgreSQL
  → Disk / Page Cache
```
