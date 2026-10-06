# PROGRESS

> 상태: ⬜ Not Started · 🟡 Learning · 🟢 Understood(Quiz≥80% + Feynman) · 🔵 Practiced(랩 완료) · ⭐ Mastered(14일+ 복습 통과 + 핵심질문 무참조 답변)
> 매 세션 끝에 Claude가 갱신. **읽음 ≠ 완료.**

---

## 현재 초점

- **다음 모듈**: `0.3 부동소수점 / IEEE 754` (Part 0)
- **진행 중**: 없음
- **선수지식 대기**: 없음
- 시작일: (미정) · 최근 학습일: —

> Part 0.1(수 체계), 0.2(정수 표현)는 `../c-tutor` ch02–03 으로 대체 학습 가능. 학습자가 c-tutor를
> 이미 봤다면 🟢 처리하고 0.3부터 시작.

---

## Part 0 — Computer Fundamentals `P1`

| 모듈 | 상태 | concept | internals | backend | senior | trouble | lab | quiz | feynman | 최근복습 | 다음복습 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 수 체계와 비트 | ⬜ | | | | | | | | | | |
| 0.2 정수 표현과 오버플로우 | ⬜ | | | | | | | | | | |
| 0.3 부동소수점 / IEEE 754 | ⬜ | | | | | | | | | | |
| 0.4 문자 인코딩 (UTF-8) | ⬜ | | | | | | | | | | |
| 0.5 CPU·메모리 계층 | ⬜ | | | | | | | | | | |
| 0.6 프로그램 실행 / syscall | ⬜ | | | | | | | | | | |

## Part 1 — Data Structures + Java Collections `P1`

| 모듈 | 상태 |
|---|---|
| 1.1 배열 / 동적 배열 → ArrayList | ⬜ |
| 1.2 연결 리스트 → LinkedList | ⬜ |
| 1.3 스택 / 큐 / 덱 → ArrayDeque | ⬜ |
| 1.4 해시 테이블 + 충돌 → HashMap 내부 | ⬜ |
| 1.5 트리 / BST / Red-Black → TreeMap | ⬜ |
| 1.6 힙 → PriorityQueue | ⬜ |
| 1.7 그래프 | ⬜ |
| 1.8 B-Tree / B+Tree → DB Index 다리 | ⬜ |
| 1.9 확률적 자료구조 (Bloom, HLL) | ⬜ |

## Part 2 — Algorithmic Thinking `P2`

| 모듈 | 상태 |
|---|---|
| 2.1 복잡도 (Big-O, 분할상환) | ⬜ |
| 2.2 자료구조 선택 (contains 함정) | ⬜ |
| 2.3 이진 탐색 / OFFSET→keyset 페이지네이션 | ⬜ |
| 2.4 재귀 / DFS / BFS | ⬜ |
| 2.5 정렬 / 외부 정렬 → Merge Join | ⬜ |
| 2.6 Greedy / DP / 분할정복 | ⬜ |
| 2.7 해싱 응용 / Consistent Hashing | ⬜ |

## Part 3 — Operating System `P0` ★

| 모듈 | 상태 |
|---|---|
| 3.1 프로세스 vs 스레드 | ⬜ |
| 3.2 컨텍스트 스위칭 | ⬜ |
| 3.3 CPU 스케줄링 / load average | ⬜ |
| 3.4 인터럽트 / 시스템 콜 | ⬜ |
| 3.5 가상 메모리 / 페이징 / TLB / page fault | ⬜ |
| 3.6 물리 메모리 / 스왑 / OOM Killer | ⬜ |
| 3.7 mmap / page cache / fsync | ⬜ |
| 3.8 프로세스 메모리 레이아웃 | ⬜ |
| 3.9 파일 시스템 / FD / ulimit | ⬜ |
| 3.10 소켓 | ⬜ |
| 3.11 I/O 모델 (blocking~epoll, C10K) | ⬜ |
| 3.12 epoll 내부 | ⬜ |
| 3.13 OS 동시성 (race, mutex, semaphore, deadlock) | ⬜ |
| + Linux 프라이머 | ⬜ |

## Part 4 — Network `P0` ★

| 모듈 | 상태 |
|---|---|
| 4.1 TCP/IP 모델 / 캡슐화 | ⬜ |
| 4.2 링크 계층 (Ethernet, ARP) | ⬜ |
| 4.3 IP / 서브넷 / 라우팅 / NAT | ⬜ |
| 4.4 DNS / JVM DNS 캐시 | ⬜ |
| 4.5 UDP | ⬜ |
| 4.6 TCP 신뢰성 (handshake, 흐름/혼잡 제어, 재전송) | ⬜ |
| 4.7 연결 종료 / TIME_WAIT / CLOSE_WAIT | ⬜ |
| 4.8 Keep-Alive | ⬜ |
| 4.9 소켓 API / accept 큐 / somaxconn | ⬜ |
| 4.10 HTTP/1.1 | ⬜ |
| 4.11 HTTP/2 | ⬜ |
| 4.12 HTTP/3 + QUIC | ⬜ |
| 4.13 HTTPS / TLS | ⬜ |
| 4.14 Proxy / LB / Connection Pool | ⬜ |

## Part 5 — Database (PostgreSQL) `P0` ★

| 모듈 | 상태 |
|---|---|
| 5.1 DB 아키텍처 (프로세스/메모리) | ⬜ |
| 5.2 저장 구조 (page/tuple/TOAST) | ⬜ |
| 5.3 인덱스 (B+Tree, 복합, 왜 다 만들면 안 되나) | ⬜ |
| 5.4 기타 인덱스 (Hash/GIN/GiST/BRIN) | ⬜ |
| 5.5 쿼리 옵티마이저 / 통계 | ⬜ |
| 5.6 스캔 종류 | ⬜ |
| 5.7 조인 알고리즘 | ⬜ |
| 5.8 실행 계획 (EXPLAIN ANALYZE) | ⬜ |
| 5.9 트랜잭션 / ACID | ⬜ |
| 5.10 격리 수준 / 이상 현상 | ⬜ |
| 5.11 MVCC | ⬜ |
| 5.12 Vacuum / Autovacuum | ⬜ |
| 5.13 Lock / Deadlock | ⬜ |
| 5.14 WAL / Checkpoint / 복구 | ⬜ |
| 5.15 Buffer Cache | ⬜ |
| 5.16 Connection Pool / PgBouncer | ⬜ |
| 5.17 복제 / replication lag | ⬜ |
| 5.18 B-Tree vs LSM-Tree | ⬜ |

## Part 6 — Concurrency & JMM `P0`

| 모듈 | 상태 |
|---|---|
| 6.1 Concurrency vs Parallelism | ⬜ |
| 6.2 하드웨어 현실 (MESI, 재정렬, 배리어) | ⬜ |
| 6.3 JMM (happens-before, volatile) | ⬜ |
| 6.4 synchronized | ⬜ |
| 6.5 j.u.c.locks | ⬜ |
| 6.6 CAS / Atomic / ABA | ⬜ |
| 6.7 False Sharing | ⬜ |
| 6.8 스레드 풀 / 사이징 | ⬜ |
| 6.9 CompletableFuture | ⬜ |
| 6.10 Virtual Thread (Loom) | ⬜ |
| 6.11 Java 데드락 / jstack | ⬜ |

## Part 7 — JVM & Java Internals `P0`

| 모듈 | 상태 |
|---|---|
| 7.1 클래스 로더 | ⬜ |
| 7.2 바이트코드 / 인터프리터 | ⬜ |
| 7.3 JIT / escape analysis | ⬜ |
| 7.4 런타임 데이터 영역 / Metaspace | ⬜ |
| 7.5 객체 레이아웃 | ⬜ |
| 7.6 GC 기초 (TLAB, generational) | ⬜ |
| 7.7 세대별 GC / card table | ⬜ |
| 7.8 G1 | ⬜ |
| 7.9 ZGC / Shenandoah | ⬜ |
| 7.10 Safepoint / STW | ⬜ |
| 7.11 메모리 누수 / OOM 종류 | ⬜ |
| 7.12 진단 (힙덤프/스레드덤프/JFR/async-profiler) | ⬜ |
| 7.13 Off-heap / FFM | ⬜ |

## Part 8 — Web Server & Spring Internals `P0`

| 모듈 | 상태 |
|---|---|
| 8.1 Web Server vs WAS | ⬜ |
| 8.2 Servlet / DispatcherServlet | ⬜ |
| 8.3 Tomcat 아키텍처 (Connector, maxThreads/acceptCount) | ⬜ |
| 8.4 Connection vs Thread | ⬜ |
| 8.5 요청 흐름 (filter → Controller → converter) | ⬜ |
| 8.6 Thread-per-request 한계 | ⬜ |
| 8.7 블로킹 vs Reactive (WebFlux, Netty 이벤트 루프) | ⬜ |
| 8.8 Nginx | ⬜ |
| 8.9 HikariCP 내부 | ⬜ |

## Part 9 — Security `P0`

| 모듈 | 상태 |
|---|---|
| 9.1 AuthN vs AuthZ | ⬜ |
| 9.2 Session + Cookie | ⬜ |
| 9.3 Token / JWT | ⬜ |
| 9.4 OAuth 2.0 / OIDC | ⬜ |
| 9.5 비밀번호 저장 (bcrypt/Argon2, salt) | ⬜ |
| 9.6 암호 프리미티브 / TLS 인증서 체인 | ⬜ |
| 9.7 웹 취약점 (XSS/CSRF/CORS) | ⬜ |
| 9.8 인젝션 (SQLi/SSRF/역직렬화) | ⬜ |
| 9.9 Spring Security 필터 체인 | ⬜ |
| 9.10 운영 보안 | ⬜ |

## Part 10 — Caching `P1`

| 모듈 | 상태 |
|---|---|
| 10.1 캐시 계층 전체 | ⬜ |
| 10.2 지역성 / 히트율 | ⬜ |
| 10.3 패턴 (cache-aside, write-through/back) | ⬜ |
| 10.4 무효화 | ⬜ |
| 10.5 장애 모드 (Stampede/Penetration/Avalanche/Hot Key) | ⬜ |
| 10.6 Redis 내부 (싱글 스레드, 자료구조, 영속성) | ⬜ |
| 10.7 Redis 활용 (분산 락, 레이트리미터) | ⬜ |
| 10.8 CDN | ⬜ |

## Part 11 — Distributed Systems `P1`

| 모듈 | 상태 |
|---|---|
| 11.1 왜 분산 / 오류들 | ⬜ |
| 11.2 오류 모델 / timeout | ⬜ |
| 11.3 시간과 순서 (Lamport, vector clock) | ⬜ |
| 11.4 CAP / 일관성 모델 | ⬜ |
| 11.5 복제 / 쿼럼 | ⬜ |
| 11.6 파티셔닝 / Consistent Hashing | ⬜ |
| 11.7 합의 (Raft 직관) | ⬜ |
| 11.8 분산 트랜잭션 (2PC/Saga/Outbox) | ⬜ |
| 11.9 멱등성 | ⬜ |
| 11.10 회복탄력성 패턴 (retry/circuit breaker/bulkhead) | ⬜ |
| 11.11 분산 락 / fencing token | ⬜ |

## Part 12 — Messaging & Kafka `P1`

| 모듈 | 상태 |
|---|---|
| 12.1 왜 비동기 / queue vs log | ⬜ |
| 12.2 Kafka 아키텍처 (partition, commit log) | ⬜ |
| 12.3 page cache / zero-copy | ⬜ |
| 12.4 Producer (acks, 배치, 멱등) | ⬜ |
| 12.5 복제 / ISR | ⬜ |
| 12.6 Consumer / 리밸런스 / 오프셋 | ⬜ |
| 12.7 전달 시맨틱 | ⬜ |
| 12.8 순서 보장 | ⬜ |
| 12.9 Consumer Lag 분석 | ⬜ |
| 12.10 DLQ / 스키마 레지스트리 | ⬜ |
| 12.11 RabbitMQ 대조 | ⬜ |

## Part 13 — Linux & Production Ops `P0`

| 모듈 | 상태 |
|---|---|
| 13.1 /proc | ⬜ |
| 13.2 프로세스/스레드 (ps, top) | ⬜ |
| 13.3 CPU (top 필드, load avg) | ⬜ |
| 13.4 메모리 (free, vmstat) | ⬜ |
| 13.5 디스크/IO (iostat) | ⬜ |
| 13.6 네트워크 (ss, conntrack) | ⬜ |
| 13.7 파일 디스크립터 (lsof, ulimit) | ⬜ |
| 13.8 추적 (strace, tcpdump) | ⬜ |
| 13.9 시그널 / graceful shutdown | ⬜ |
| 13.10 systemd / journalctl | ⬜ |
| 13.11 cgroup / namespace / JVM 컨테이너 인식 | ⬜ |

## Part 14 — Performance Engineering `P0`

| 모듈 | 상태 |
|---|---|
| 14.1 용어 (latency vs throughput) | ⬜ |
| 14.2 백분위 / tail latency / coordinated omission | ⬜ |
| 14.3 큐잉 이론 (Little's Law, USL, 사용률-지연 곡선) | ⬜ |
| 14.4 병목 분석 (USE 방법) | ⬜ |
| 14.5 프로파일링 / 플레임그래프 | ⬜ |
| 14.6 벤치마킹 (JMH, 부하 테스트) | ⬜ |
| 14.7 백엔드 병목 시그니처 | ⬜ |
| 14.8 용량 산정 | ⬜ |

## Part 15 — Observability `P1`

| 모듈 | 상태 |
|---|---|
| 15.1 세 기둥 / cardinality | ⬜ |
| 15.2 구조적 로깅 / Correlation ID | ⬜ |
| 15.3 메트릭 / Prometheus / Micrometer | ⬜ |
| 15.4 RED / USE / golden signals | ⬜ |
| 15.5 분산 트레이싱 / OTel | ⬜ |
| 15.6 SLI/SLO/에러버짓 | ⬜ |
| 15.7 JVM·DB 중요 지표 | ⬜ |

## Part 16 — System Design `P0` (캡스톤)

| 모듈 | 상태 |
|---|---|
| 16.0 설계 방법론 | ⬜ |
| 16.1 URL 단축기 | ⬜ |
| 16.2 레이트리미터 | ⬜ |
| 16.3 뉴스피드 / 타임라인 | ⬜ |
| 16.4 주문 + 재고 | ⬜ |
| 16.5 결제 시스템 | ⬜ |
| 16.6 알림 시스템 | ⬜ |
| 16.7 파일 업로드 / 저장 | ⬜ |
| 16.8 채팅 시스템 | ⬜ |
| 16.9 분산 ID 생성 | ⬜ |
| 16.10 인증 서비스 | ⬜ |

## Part 17 — Failure Engineering `P0` (최종 캡스톤)

| 모듈 | 상태 |
|---|---|
| 17.1 CPU 100% | ⬜ |
| 17.2 각종 OOM | ⬜ |
| 17.3 GC Pause 스파이크 | ⬜ |
| 17.4 Thread Pool 고갈 | ⬜ |
| 17.5 Connection Pool 고갈 | ⬜ |
| 17.6 Slow Query / 플랜 회귀 | ⬜ |
| 17.7 DB Lock / Deadlock | ⬜ |
| 17.8 Redis 장애 | ⬜ |
| 17.9 Kafka Consumer Lag | ⬜ |
| 17.10 DNS 장애 | ⬜ |
| 17.11 Timeout 캐스케이드 / retry storm | ⬜ |
| 17.12 CLOSE_WAIT 누적 | ⬜ |
| 17.13 TIME_WAIT 누적 | ⬜ |
| 17.14 File Descriptor 고갈 | ⬜ |
| 17.15 Disk 풀 / IO 포화 | ⬜ |
| 17.16 Cascading Failure | ⬜ |

## Cross-Layer 통합 문서

| 문서 | 상태 |
|---|---|
| java-line-to-cpu.md | ⬜ |
| http-request-lifecycle.md | ⬜ |
| transactional-method.md | ⬜ |
| cached-read-path.md | ⬜ |
| order-to-inventory.md | ⬜ |
| ssh-into-slow-server.md | ⬜ |
| final-incident.md (졸업시험) | ⬜ |
