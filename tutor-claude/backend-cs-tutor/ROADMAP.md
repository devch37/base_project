# ROADMAP — 전체 커리큘럼

> 우선순위: **P0** 반드시 깊게 · **P1** 중요 · **P2** 기본 이해 · **P3** 필요할 때
> 상태는 [PROGRESS.md](./PROGRESS.md)에서 관리. 이 문서는 "무엇을 어떤 순서로".

## 학습 순서 요약

```
0 Foundations(P1)
  └─ 1 Data Structures(P1) ─ 2 Algorithms(P2)
        └─ 3 Operating System(P0) ★ + Linux 프라이머
              ├─ 4 Network(P0) ★
              │     └─ 8 Web Server & Spring(P0) ── 9 Security(P0)
              ├─ 5 Database / PostgreSQL(P0) ★
              ├─ 6 Concurrency & JMM(P0)
              │     └─ 7 JVM Internals(P0)
              │           └─ 10 Cache(P1)
              │                 └─ 11 Distributed Systems(P1)
              │                       └─ 12 Messaging & Kafka(P1)
              └─ 13 Linux & Production(P0, 통합 심화)
                    └─ 14 Performance(P0) ── 15 Observability(P1)
                          └─ 16 System Design(P0) ── 17 Failure Engineering(P0)
```

전체 ~360h. 주 6h ≈ 14개월 / 주 8h ≈ 10개월. **깊이 > 속도.** P2인 Part 2는 뒤로 미뤄도 됨.

`docs/99-integration/` 의 Cross-Layer 통합 문서는 선수 Part가 끝날 때마다 작성/갱신.

---

## Part 0 — Computer Fundamentals `P1` · ~8h · 선수: 없음

> 방금 만든 `../c-tutor` 에 2진수·2의 보수·부동소수점·인코딩·메모리 계층이 이미 있음.
> 여기서는 **중복 개념은 c-tutor로 링크**하고, **백엔드에서 어떻게 나타나는지**만 다룬다.

| 모듈 | 내용 | 우선순위 | 백엔드 연결 |
|---|---|---|---|
| 0.1 수 체계와 비트 | 2진수/16진수, bit/byte, 비트 연산 (→ c-tutor ch02–03) | P2 | 권한 비트마스크, `flags` 컬럼, Redis bitmap |
| 0.2 정수 표현과 오버플로우 | 2의 보수, `int` 오버플로우 (→ c-tutor ch02) | P1 | `Integer` 오버플로우 버그, DB `SERIAL` 고갈, ID 생성 |
| 0.3 부동소수점 / IEEE 754 | `0.1+0.2≠0.3`, 정밀도 | P1 | **돈 계산은 `BigDecimal`/정수 cents**, `DOUBLE` 컬럼 함정 |
| 0.4 문자 인코딩 | ASCII, Unicode, UTF-8, 코드포인트 vs 바이트 | P1 | `String.length()`의 거짓말, DB charset/collation, `VARCHAR(n)` 의미, 이모지 저장 |
| 0.5 CPU·메모리 계층 | 레지스터/L1·L2·L3/RAM/디스크, 캐시 라인, latency 숫자표 | P1 | "왜 배열이 LinkedList보다 빠른가", DB 순차 I/O, mechanical sympathy |
| 0.6 프로그램 실행 | 명령어, fetch-decode-execute, user/kernel 모드, **시스템 콜 경계** | P1 | Java I/O 한 번이 syscall 한 번, `strace`로 관찰 |
| ✅ 통합 A | `java-line-to-cpu.md` 착수 (Part 7에서 완성) | | |

## Part 1 — Data Structures + Java Collections `P1` · ~14h · 선수: 0

| 모듈 | 내용 | Java/DB 연결 |
|---|---|---|
| 1.1 배열 / 동적 배열 | 연속 메모리, 랜덤 접근 O(1), resize 분할상환, 캐시 지역성 | `ArrayList`, `Arrays.asList` 함정, `ArrayDeque` |
| 1.2 연결 리스트 | 포인터 추적, 캐시 비친화 | `LinkedList` (거의 안 쓰는 이유) |
| 1.3 스택 / 큐 / 덱 | 호출 스택과의 관계 | `ArrayDeque`, `Stack`(레거시), BlockingQueue |
| 1.4 해시 테이블 + 충돌 | 버킷, load factor, 체이닝 vs 오픈 어드레싱, 해시 함수 | **`HashMap` 내부**(treeify at 8), `hashCode`/`equals` 계약, `ConcurrentHashMap` 세그먼트/CAS |
| 1.5 트리 / BST / 균형 트리 | 회전, Red-Black 불변식 | `TreeMap`/`TreeSet` (왜 RB인가) |
| 1.6 힙 | 배열로 구현, sift-up/down | `PriorityQueue`, 타이머 휠, top-K |
| 1.7 그래프 | 인접 리스트 vs 행렬 | 의존성 그래프, 순환 탐지 |
| 1.8 B-Tree / B+Tree | 디스크 페이지, fanout, "왜 디스크에선 BST가 아닌가" | **DB Index의 다리** → Part 5 |
| 1.9 확률적 자료구조 | Bloom Filter, HyperLogLog, Count-Min Sketch | 캐시 관통 방어, `PFCOUNT`, Cassandra |
| ✅ 통합 | "HashMap 동시 resize → 무한 루프(Java 7) → ConcurrentHashMap" | |

## Part 2 — Algorithmic Thinking for Backend `P2` · ~10h · 선수: 1

> 코딩테스트 훈련이 아니라 **성능을 판단**하기 위한 알고리즘.

| 모듈 | 내용 |
|---|---|
| 2.1 복잡도 | Big-O, 분할상환, 공간 복잡도, 실행계획 cost 읽기 |
| 2.2 자료구조 선택 | `list.contains()` 반복의 O(n²), Set/Map으로 교체 |
| 2.3 탐색 / 이진 탐색 | **OFFSET 페이지네이션이 느려지는 이유 → keyset(cursor) 페이지네이션** |
| 2.4 재귀 / DFS / BFS | 의존성 해석, 순환 탐지, 최단 경로/크롤 |
| 2.5 정렬 | 안정성·in-place·**외부 정렬 → DB Merge Join / `ORDER BY` disk sort** |
| 2.6 Greedy / DP / 분할정복 | 직관 + 백엔드 예시(레이트리미터, diff, 머지) |
| 2.7 해싱 응용 | **Consistent Hashing**(가상 노드, 리밸런싱), 체크섬, dedup |

## Part 3 — Operating System `P0` ★ · ~30h · 선수: 0, (1) · **가장 무거움**

| 모듈 | 내용 | 백엔드 연결 |
|---|---|---|
| 3.1 프로세스 vs 스레드 | 주소 공간, PCB, fork/exec, 좀비/고아 | JVM = 1 프로세스 N 스레드, `ps -eLf` |
| 3.2 컨텍스트 스위칭 | 무엇이 저장되나, 비용, 언제 | `vmstat` cs, 스레드 과다 생성의 대가 |
| 3.3 CPU 스케줄링 | CFS, 타임슬라이스, nice, run queue, **load average의 진짜 의미** | `top` load, 코어 수 대비 |
| 3.4 인터럽트 / 시스템 콜 | trap, user↔kernel 전환 비용 | I/O 한 번의 실제 비용 |
| 3.5 가상 메모리 | 주소 변환, 페이지 테이블, TLB, page fault(minor/major), demand paging | JVM 힙이 실제로는 가상 주소 |
| 3.6 물리 메모리 / 스왑 | OOM Killer, `free` 출력, RSS vs VSZ vs PSS | 컨테이너 메모리 한계 → OOM Kill |
| 3.7 mmap / page cache | dirty page, writeback, `fsync` | **DB·Kafka가 page cache에 의존**, `free`의 buff/cache |
| 3.8 프로세스 메모리 레이아웃 | text/data/bss/heap/stack, brk, mmap | JVM 네이티브 메모리, 스택 크기 `-Xss` |
| 3.9 파일 시스템 / FD | inode, FD 테이블, open file 테이블, **FD 한계**(`ulimit`) | `Too many open files`, 커넥션=FD |
| 3.10 소켓 | FD로서의 소켓, 소켓 버퍼 | Part 4의 다리 |
| 3.11 I/O 모델 | blocking / non-blocking / 멀티플렉싱(select·poll·epoll) / async(io_uring), **C10K** | Tomcat NIO, Netty |
| 3.12 epoll 내부 | ready list, edge vs level trigger, 확장성 | Netty·Nginx의 기반 |
| 3.13 OS 동시성 | race condition, critical section, mutex, semaphore, monitor, **deadlock 4조건**, starvation, priority inversion | Part 6의 기반 |
| + Linux 프라이머 | `ps top vmstat free lsof ss strace` 최소셋 (이후 모든 랩에서 사용) | |
| 🧪 랩 | Spring 앱 → 스레드/FD/소켓 관찰, page fault 유발, FD 한계 도달 | |
| ✅ 통합 B | `http-request-lifecycle.md` 착수 | |

## Part 4 — Network `P0` ★ · ~28h · 선수: 3 · **가장 무거움**

| 모듈 | 내용 |
|---|---|
| 4.1 TCP/IP 모델 | 캡슐화, 패킷의 실제 바이트, OSI 대조 |
| 4.2 링크 계층 | Ethernet 프레임, MAC, ARP, L2 vs L3 (P2) |
| 4.3 IP | 주소, 서브넷/CIDR, 라우팅, TTL, NAT |
| 4.4 DNS | recursive vs iterative, 레코드, 캐싱/TTL, `dig`, **JVM DNS 캐시**(`networkaddress.cache.ttl`) |
| 4.5 UDP | fire-and-forget, 언제 쓰나 |
| 4.6 TCP 신뢰성 | 3-way handshake, seq/ACK, 슬라이딩 윈도우, **흐름 제어(rwnd)**, **혼잡 제어(cwnd, slow start, AIMD, BBR)**, 재전송(RTO, fast retransmit, SACK), Nagle + delayed ACK, `TCP_NODELAY` |
| 4.7 연결 종료 | 4-way, **TIME_WAIT**(왜 2MSL, 왜 클라이언트), **CLOSE_WAIT**(항상 내 버그), FIN vs RST |
| 4.8 Keep-Alive | TCP keepalive vs HTTP keep-alive (다른 것!) |
| 4.9 소켓 API / accept 큐 | SYN 큐 + accept 큐, `somaxconn`, backlog |
| 4.10 HTTP/1.1 | 메서드/상태/헤더, persistent connection, HOL 블로킹, chunked, 캐싱 헤더, 멱등성 시맨틱 |
| 4.11 HTTP/2 | 바이너리 프레이밍, 멀티플렉싱, HPACK, 스트림 우선순위, TCP HOL |
| 4.12 HTTP/3 + QUIC | 왜 UDP 위에, 0-RTT, connection migration (P2) |
| 4.13 HTTPS / TLS | 핸드셰이크(1.2 vs 1.3), 인증서 체인, SNI, 세션 재개, mTLS, TLS 종료 지점 |
| 4.14 Proxy / LB / Connection Pool | forward vs reverse proxy, L4 vs L7 LB, Nginx, 클라이언트측 커넥션 풀 |
| 🧪 랩 | `tcpdump`로 핸드셰이크 관찰, `ss -tan` 상태, CLOSE_WAIT 유발, TIME_WAIT 누적 측정, `openssl s_client` |
| ✅ 통합 B | `http-request-lifecycle.md` 완성: Browser→DNS→TCP→TLS→LB→Nginx→Tomcat→Dispatcher→Controller→Service→DB |

## Part 5 — Database (PostgreSQL) `P0` ★ · ~30h · 선수: 1, 3 · **가장 무거움**

| 모듈 | 내용 |
|---|---|
| 5.1 DB 아키텍처 | postmaster, connection당 backend 프로세스, shared buffers, WAL buffers, bgwriter, checkpointer, autovacuum |
| 5.2 저장 구조 | page(8KB), tuple, TOAST, heap file, visibility map, FSM, row 레이아웃 |
| 5.3 인덱스 (B+Tree) | 디스크상 구조, fanout, index-only scan, covering index, **복합 인덱스 컬럼 순서**, partial/expression index, **왜 다 만들면 안 되나**(쓰기 증폭, bloat) |
| 5.4 기타 인덱스 | Hash, GIN/GiST/BRIN 개요 |
| 5.5 쿼리 옵티마이저 | parse→rewrite→plan→execute, cost 모델, 통계(`ANALYZE`), selectivity, 추정이 틀리는 이유 |
| 5.6 스캔 종류 | seq / index / index-only / bitmap heap scan |
| 5.7 조인 알고리즘 | nested loop / hash join / merge join, `work_mem` |
| 5.8 실행 계획 | `EXPLAIN` vs `EXPLAIN (ANALYZE, BUFFERS)`, actual vs estimated, loops, buffers |
| 5.9 트랜잭션 / ACID | 각 글자가 어떻게 구현되나 |
| 5.10 격리 수준 | RC/RR/Serializable, 이상 현상(dirty/non-repeatable/phantom/write skew), PG는 RR=snapshot isolation |
| 5.11 MVCC | xmin/xmax, 스냅샷, 가시성 규칙, tuple 버전, HOT update, **UPDATE = insert + mark dead** |
| 5.12 Vacuum / Autovacuum | dead tuple, bloat, XID wraparound, `pg_stat_user_tables` |
| 5.13 Lock | row lock(`FOR UPDATE`), table lock, lock 모드, lock 큐, `pg_locks`, deadlock 탐지, advisory lock |
| 5.14 WAL | redo log, LSN, `synchronous_commit`, checkpoint, 크래시 복구 |
| 5.15 Buffer Cache | shared_buffers vs OS page cache(이중 버퍼링), clock sweep, `pg_buffercache` |
| 5.16 Connection Pool | 프로세스당 비용, PgBouncer, HikariCP 사이징, `max_connections` |
| 5.17 복제 | streaming(WAL shipping), sync vs async, replication lag, read replica, failover, logical replication → CDC |
| 5.18 B-Tree vs LSM-Tree | RocksDB/Cassandra, 쓰기 증폭 vs 공간 증폭, compaction, 언제 무엇 |
| 🧪 랩 | 1000만 row 생성, 인덱스 전후 `EXPLAIN ANALYZE`, 조인 타입 강제, `pg_stat_activity`로 slow query 관찰, deadlock 만들기, bloat+vacuum, 커넥션 고갈 |
| ✅ 통합 C | `transactional-method.md`: `@Transactional`→HikariCP→JDBC→BEGIN→backend→buffer/WAL→COMMIT→fsync, 예외/풀 고갈/lock wait |

## Part 6 — Concurrency & Java Memory Model `P0` · ~18h · 선수: 3, (0.5)

| 모듈 | 내용 |
|---|---|
| 6.1 Concurrency vs Parallelism | 인터리빙, 공유 가변 상태가 문제의 근원 |
| 6.2 하드웨어 현실 | store buffer, **캐시 일관성(MESI)**, 재정렬(컴파일러+CPU), 메모리 배리어 |
| 6.3 JMM | happens-before, program order, visibility, atomicity, `volatile`(하는 것/안 하는 것), `final` 시맨틱 |
| 6.4 `synchronized` | monitor, enter/exit, wait/notify |
| 6.5 `j.u.c.locks` | ReentrantLock, 공정성, Condition, ReadWriteLock, StampedLock |
| 6.6 CAS / Atomic | `Atomic*`, `LongAdder`, **ABA 문제**, lock-free vs wait-free |
| 6.7 False Sharing | 캐시 라인, `@Contended`, 패딩 |
| 6.8 스레드 풀 | `ExecutorService`, core/max/queue/rejection, **사이징**(CPU-bound vs IO-bound, Little's Law 예고), `ForkJoinPool` common pool 함정 |
| 6.9 `CompletableFuture` | 조합, 어느 executor에서 콜백이 도나 |
| 6.10 Virtual Thread (Loom) | carrier thread, continuation, pinning, IO-bound에서만 이득, structured concurrency |
| 6.11 Java 데드락 | lock ordering, `jstack` 데드락 탐지, livelock, starvation |
| 🧪 랩 | 카운터 race 재현 → synchronized → AtomicInteger → LongAdder 벤치, visibility 버그(JCStress), 스레드 덤프 분석, VT vs PT 처리량(IO) |
| ✅ 통합 | "두 Tomcat worker가 같은 `@Service` 필드 → 왜 Spring bean은 stateless여야 하나" |

## Part 7 — JVM & Java Internals `P0` · ~20h · 선수: 3, 6

| 모듈 | 내용 |
|---|---|
| 7.1 클래스 로더 | bootstrap/platform/app, 위임 모델, 커스텀 로더, linking/verification |
| 7.2 바이트코드 | 오퍼랜드 스택, `javap`, 인터프리터 |
| 7.3 JIT | C1/C2, tiered, 프로파일링, 인라이닝, **escape analysis**, deopt |
| 7.4 런타임 데이터 영역 | heap, 스레드 스택, PC, **Metaspace(힙 아님!)**, code cache |
| 7.5 객체 레이아웃 | 헤더(mark word, klass pointer), compressed oops, 정렬, JOL |
| 7.6 GC 기초 | roots, reachability, mark-sweep-compact, copying, generational 가설, TLAB, bump pointer |
| 7.7 세대별 GC | young/old, minor/major/full, promotion, card table, write barrier |
| 7.8 G1 | region, concurrent marking, mixed GC, pause target, humongous |
| 7.9 ZGC / Shenandoah | colored pointer / load barrier, concurrent compaction, sub-ms pause, Trade-off |
| 7.10 Safepoint | STW, time-to-safepoint |
| 7.11 메모리 누수 / OOM | static 컬렉션, ThreadLocal, classloader leak; OOM 종류(heap/Metaspace/direct buffer/unable to create native thread/GC overhead) |
| 7.12 진단 | `jcmd`, 힙 덤프(MAT), 스레드 덤프, `jstat`, GC 로그, JFR+JMC, async-profiler 플레임그래프 |
| 7.13 Off-heap | direct ByteBuffer, Netty pooled allocator, FFM API 개요 |
| 🧪 랩 | 각 OOM 재현, 힙 덤프 분석, GC 로그 읽기, JFR 할당 폭풍, 핫 엔드포인트 플레임그래프 |
| ✅ 통합 A | `java-line-to-cpu.md` 완성 |

## Part 8 — Web Server & Spring Internals `P0` · ~16h · 선수: 3, 4, 6

| 모듈 | 내용 |
|---|---|
| 8.1 Web Server vs WAS | 정적 vs 동적 |
| 8.2 Servlet | 스펙, 생명주기, 컨테이너, `DispatcherServlet` |
| 8.3 Tomcat 아키텍처 | NIO Connector, acceptor, poller, worker 풀, **`maxThreads` vs `maxConnections` vs `acceptCount`(요청 큐)** |
| 8.4 Connection vs Thread | keep-alive, HTTP/2 멀티플렉싱 |
| 8.5 요청 흐름 | accept→parse→filter chain→DispatcherServlet→HandlerMapping→Adapter→Controller→MessageConverter→response |
| 8.6 Thread-per-request 한계 | "200 threads, 10,000 requests"의 실제 동작(accept 큐→refused/timeout) |
| 8.7 블로킹 vs Reactive | Servlet vs WebFlux, **Netty 이벤트 루프**, Reactor(Mono/Flux), backpressure, 언제 이득/비용 |
| 8.8 Nginx | 이벤트 드리븐, `worker_connections`, upstream, 버퍼링, LB 알고리즘(RR, least-conn, ip-hash, consistent hash) |
| 8.9 HikariCP 내부 | 사이징 공식, 커넥션 생명주기, leak detection, `connectionTimeout`, PS 캐시 |
| 🧪 랩 | `wrk`/`k6` 부하, Tomcat 스레드 풀 + accept 큐 관찰, 풀 튜닝, MVC vs WebFlux 비교, Nginx 앞단 |
| ✅ 통합 B | "동시 10,000 요청 — 201번, 5000번, 9999번 요청에 무슨 일이" |

## Part 9 — Security for Backend `P0` · ~14h · 선수: 4, 8

| 모듈 | 내용 |
|---|---|
| 9.1 AuthN vs AuthZ | identity, principal, credential |
| 9.2 Session + Cookie | 서버측 세션 스토어, 쿠키 속성(HttpOnly/Secure/SameSite), session fixation |
| 9.3 Token / JWT | 구조, 서명(HMAC vs RSA/EC), claims, 만료, **취소 문제**, refresh token, 저장 위치 |
| 9.4 OAuth 2.0 / OIDC | Authorization Code + PKCE, client credentials, SSO |
| 9.5 비밀번호 저장 | 해싱 vs 암호화, bcrypt/scrypt/Argon2, salt, pepper, work factor, timing attack |
| 9.6 암호 프리미티브 | 대칭 vs 비대칭, hash, HMAC, 전자 서명, 키 교환, TLS 인증서 체인, PKI |
| 9.7 웹 취약점 | XSS(stored/reflected/DOM), CSRF(+SameSite), CORS(무엇을 보호하나), clickjacking |
| 9.8 인젝션 | **SQL Injection**(prepared statement), command injection, **SSRF**(클라우드 메타데이터!), path traversal, **Java 역직렬화 RCE** |
| 9.9 Spring Security | 필터 체인, `SecurityContext`, method security, CSRF 처리, 요청 인증 흐름 |
| 9.10 운영 보안 | 시크릿 관리, 최소 권한, defense in depth, secure defaults |
| 🧪 랩 | 취약 엔드포인트 공격(SQLi, SSRF) 후 수정, JWT 뜯어보기, Spring Security 필터 체인 디버깅 |
| ✅ 통합 | "`Authorization: Bearer` → 필터 체인 → JWT 검증 → SecurityContext → `@PreAuthorize` → Controller" |

## Part 10 — Caching `P1` · ~14h · 선수: 1, 3, 4, 7

| 모듈 | 내용 |
|---|---|
| 10.1 캐시 계층 전체 | CPU 캐시 → OS page cache → 인프로세스 캐시 → Redis → HTTP 캐시(브라우저/CDN) → DB buffer cache, 각 계층의 granularity/일관성/eviction |
| 10.2 지역성 / 히트율 | 95% 히트율인데도 5% 미스가 지배하는 이유 |
| 10.3 패턴 | cache-aside(lazy), read-through, write-through, write-back, write-around, 일관성 함의 |
| 10.4 무효화 | TTL, 명시적, 버전 키; "두 가지 어려운 문제" |
| 10.5 장애 모드 | **Stampede/Dogpile**(→ lock, 요청 병합, 확률적 조기 만료), **Penetration**(→ null 캐싱, Bloom filter), **Avalanche**(→ TTL jitter), **Hot Key**(→ 로컬 캐시, 복제) |
| 10.6 Redis 내부 | **싱글 스레드 이벤트 루프**(왜 괜찮은가), 자료구조(string/hash/zset/stream/HLL/bitmap), 영속성(RDB/AOF), eviction 정책, pipelining, **왜 빠른가** |
| 10.7 Redis 활용 | 분산 락(Redlock 논쟁), 레이트리미터, 리더보드, 세션 스토어, pub/sub, streams |
| 10.8 CDN | edge 캐싱, 캐시 키, purge, `Cache-Control`/`ETag`/`Vary`, origin shield |
| 🧪 랩 | 엔드포인트에 cache-aside 추가 후 측정, stampede 재현→lock 수정, Redis `SLOWLOG`/`INFO`/hit-miss, `--hotkeys` |
| ✅ 통합 D | `cached-read-path.md`: `GET /product/123` 브라우저→CDN→Nginx→`@Cacheable`→Redis→DB |

## Part 11 — Distributed Systems `P1` · ~22h · 선수: 4, 5, 10

| 모듈 | 내용 |
|---|---|
| 11.1 왜 분산 | scale up vs out, stateless vs stateful, 분산 컴퓨팅의 오류들 |
| 11.2 오류 모델 | partial failure, 네트워크는 불신, **timeout(장애 감지의 유일한 방법)**, two generals |
| 11.3 시간과 순서 | 전역 시계 없음, NTP drift, **Lamport/vector clock/HLC**, "서버 간 ORDER BY timestamp는 거짓말" |
| 11.4 CAP / 일관성 모델 | CAP의 진짜 의미(파티션), PACELC, linearizable/sequential/causal/eventual, read-your-writes, monotonic reads |
| 11.5 복제 | single-leader/multi-leader/leaderless, sync vs async, **replication lag 대응**, quorum(R+W>N) |
| 11.6 파티셔닝 / 샤딩 | range vs hash, **consistent hashing**(가상 노드), 리밸런싱, hot partition, 샤딩된 세계의 보조 인덱스 |
| 11.7 합의 | 무엇을 위한 것(리더 선출, atomic commit, replicated log), **Raft 직관**(term, log replication, safety), etcd/ZK/KRaft/Patroni |
| 11.8 분산 트랜잭션 | 2PC(블로킹, 코디네이터 장애), **Saga**(orchestration vs choreography), 보상 트랜잭션, **Outbox 패턴 + CDC** |
| 11.9 멱등성 | 멱등 키, dedup 윈도우, exactly-once는 환상, at-least-once + 멱등 컨슈머 |
| 11.10 회복탄력성 패턴 | retry(backoff+jitter, 위험한 경우), timeout budget, **circuit breaker**(상태), bulkhead, load shedding, backpressure, graceful degradation |
| 11.11 분산 락 | 용례, 정확성(**fencing token**), 대안(리더 전용 작업, 파티션 소유권) |
| 🧪 랩 | read replica로 stale read 관찰, 멱등 엔드포인트(dedup 테이블), Resilience4j circuit breaker, consistent hashing 링 구현 |
| ✅ 통합 | "Order→Payment→Bank, 각 hop에서 timeout. 각 시스템 상태는? 어떻게 정확하게?" |

## Part 12 — Messaging & Kafka `P1` · ~18h · 선수: 5, 11

| 모듈 | 내용 |
|---|---|
| 12.1 왜 비동기 메시징 | 디커플링, 버퍼링, load leveling, fan-out; **queue vs log** |
| 12.2 Kafka 아키텍처 | broker, topic, **partition(병렬성·순서의 단위)**, segment, commit log, controller(KRaft) |
| 12.3 page cache 비밀 | **왜 빠른가**: 순차 I/O, zero-copy `sendfile`, OS page cache, JVM 내 캐싱 안 함 |
| 12.4 Producer | partitioner, 배치(`linger.ms`, `batch.size`), **`acks`(0/1/all)**, `min.insync.replicas`, 멱등 producer, 트랜잭션 |
| 12.5 복제 | ISR, leader/follower, unclean leader election, `acks=all` 내구성 |
| 12.6 Consumer | consumer group, 파티션 할당, **리밸런스**(STW, cooperative), `poll` 루프, 오프셋 커밋(auto vs manual), `max.poll.interval.ms` |
| 12.7 전달 시맨틱 | at-most-once, at-least-once, "exactly-once"(멱등 producer + 트랜잭션), **외부 side effect엔 여전히 멱등성 필요** |
| 12.8 순서 | 파티션 내에서만, 키로 순서 보장, 병렬성과의 Trade-off |
| 12.9 Consumer Lag | 의미, `kafka-consumer-groups`, 원인(느린 처리, 리밸런스 폭풍, poison pill), 해결(파티션 확장, 처리 병렬화, 배치, 튜닝) |
| 12.10 DLQ / 스키마 | retry 토픽, poison pill, 스키마 레지스트리(Avro/Protobuf), 호환성/진화 |
| 12.11 RabbitMQ 대조 | exchange/binding, ack/nack, 진짜 큐가 로그를 이기는 경우 |
| 🧪 랩 | produce/consume, 파티션 할당 관찰, consumer kill → 리밸런스+lag, `acks` 내구성 테스트(리더 kill), 멱등 컨슈머, poison pill → DLQ |
| ✅ 통합 E | `order-to-inventory.md`: 주문→DB tx+Outbox→CDC→Kafka→재고 컨슈머(멱등), 각 단계 실패·복구 |

## Part 13 — Linux & Production Ops `P0` · ~14h · 선수: 3, 4, 7 · **통합 심화**

| 모듈 | 내용 |
|---|---|
| 13.1 `/proc` | 커널이 노출하는 것 |
| 13.2 프로세스/스레드 | `ps`, `top`/`htop`, `/proc/<pid>/status`, `pidstat` |
| 13.3 CPU | `top` 필드(us/sy/wa/st/id), `mpstat`, run queue, load avg vs 코어, `perf top` |
| 13.4 메모리 | `free`(buff/cache!), `/proc/meminfo`, `vmstat`(si/so, page fault), OOM score |
| 13.5 디스크/IO | `iostat`(%util, await, IOPS), `iotop`, `df`/`du`, page cache dirty ratio |
| 13.6 네트워크 | `ss -s`, `ss -tanp`(상태), `ip`, `nstat`, 소켓 메모리, conntrack 한계 |
| 13.7 파일 디스크립터 | `lsof`, `/proc/<pid>/fd`, `ulimit -n`, systemd `LimitNOFILE`, `fs.file-max` |
| 13.8 추적 | `strace`(`-c`, `-f`), `ltrace`, `tcpdump`, `dig`, `curl -v` |
| 13.9 시그널 | SIGTERM vs SIGKILL, graceful shutdown, JVM SIGQUIT → 스레드 덤프 |
| 13.10 systemd | unit, `journalctl`, 리소스 제한, restart 정책 |
| 13.11 cgroup / namespace | 컨테이너의 CPU/메모리 제한, **JVM 컨테이너 인식**(`UseContainerSupport`, `MaxRAMPercentage`), **CPU throttling**(`nr_throttled`) |
| 🧪 랩 | 실행 중인 Spring 앱에 전체 도구 워크아웃, 디스크 풀·FD 고갈 시뮬레이션, 컨테이너 메모리 제한 → JVM 동작 |
| ✅ 통합 F | `ssh-into-slow-server.md`: 느린 서버 첫 10개 명령어와 각각이 배제하는 가설 |

## Part 14 — Performance Engineering `P0` · ~14h · 선수: 3~8, 13

| 모듈 | 내용 |
|---|---|
| 14.1 용어 | latency vs throughput vs response time vs service time, TPS/QPS/RPS |
| 14.2 백분위 | 평균의 거짓말, p50/p90/p95/p99/p99.9, **tail latency**, fan-out에서 p99 폭발, coordinated omission |
| 14.3 큐잉 이론 | **Little's Law (L=λW)** 와 용례(풀 사이징, 동시성 추정), **사용률-지연 곡선**(왜 80%가 벽), M/M/1 직관, **Universal Scalability Law**(contention + coherency) |
| 14.4 병목 분석 | **USE 방법**(Utilization, Saturation, Errors) per 자원, CPU-bound vs IO-bound vs lock-bound vs GC-bound 식별 |
| 14.5 프로파일링 | sampling vs instrumentation, **플레임그래프**(on-CPU, off-CPU, allocation), async-profiler, JFR, `perf` |
| 14.6 벤치마킹 | **JMH**(warmup, fork, DCE), 마이크로벤치 거짓말 피하기, 부하 테스트(open vs closed 모델, `k6`/`wrk`/Gatling), ramp |
| 14.7 백엔드 병목 시그니처 | N+1 쿼리, 커넥션 풀 부족, 스레드 풀 과소/과대, chatty 직렬화, lock contention, GC pause, 동기 로깅, 요청당 DNS 조회 |
| 14.8 용량 산정 | back-of-envelope, headroom, latency 숫자표 적용 |
| 🧪 랩 | 직렬화 선택 JMH, 느린 엔드포인트 플레임그래프+수정, 부하 램프로 사용률 벽 찾기, Little's Law로 풀 사이징 후 검증 |
| ✅ 통합 | "트래픽 2배에 응답 50ms→800ms(16배). 큐잉 곡선 어디, contention 어디?" |

## Part 15 — Observability `P1` · ~10h · 선수: 8, 13, 14

| 모듈 | 내용 |
|---|---|
| 15.1 세 기둥 | logs/metrics/traces, 각자 장단점, **비용 모델(cardinality)** |
| 15.2 로깅 | 구조적 로깅, 레벨, Correlation/Trace ID, MDC, 샘플링, PII |
| 15.3 메트릭 | counter/gauge/histogram/summary, Prometheus 모델, pull vs push, **label cardinality 폭발**, Micrometer, `rate`/`histogram_quantile` |
| 15.4 방법론 | **RED**(Rate/Errors/Duration) for 서비스, **USE** for 자원, four golden signals |
| 15.5 분산 트레이싱 | span, context 전파(W3C traceparent), OpenTelemetry, 샘플링, "지연이 실제로 어디" |
| 15.6 대시보드/알람 | SLI/SLO/에러버짓, alert fatigue, 증상 vs 원인 알람 |
| 15.7 중요 지표 | GC pause/빈도/할당률, GC 후 힙, 스레드 상태, HikariCP active/idle/pending/timeout, `pg_stat_*`, replication lag |
| 🧪 랩 | Micrometer+Prometheus+Grafana 계측, 두 서비스 간 OTel 트레이싱, RED 대시보드, SLO + burn-rate 알람 |
| ✅ 통합 | "트레이스에서 'db' span이 600ms. 이 span에서 정확한 slow query와 실행 계획까지 어떻게" |

## Part 16 — System Design `P0` · ~28h · 선수: 전체 · **캡스톤**

먼저 **16.0 방법론**: 요구사항 → 규모 추정(트래픽/저장/대역폭) → API 설계 → 데이터 모델 → 상위 아키텍처
→ 병목 deep dive → Trade-off → 장애 모드 → 진화.

각 설계는 **Traffic → API → App → Cache → DB → MQ 계층별 병목 분석**으로 마무리.

| 모듈 | 시스템 | 핵심 학습 |
|---|---|---|
| 16.1 | URL 단축기 | ID 생성, read-heavy, 캐싱, redirect 시맨틱 |
| 16.2 | 레이트리미터 | 알고리즘, 분산, Redis |
| 16.3 | 뉴스피드/타임라인 | fan-out on write vs read, hot user |
| 16.4 | 주문 + 재고 | 일관성, 오버셀 방지, 예약, saga |
| 16.5 | 결제 시스템 | 멱등성, ledger, 복식부기, reconciliation, "돈은 exactly-once" |
| 16.6 | 알림 시스템 | 멀티 채널, fan-out, dedup, 레이트 제한, retry, 우선순위 |
| 16.7 | 파일 업로드/저장 | 청킹, presigned URL, object storage, CDN, 스캔 파이프라인 |
| 16.8 | 채팅 시스템 | WebSocket, presence, 메시지 순서, 전달/읽음, fan-out, 저장 |
| 16.9 | 분산 ID 생성 | UUIDv7, Snowflake, ULID (횡단) |
| 16.10 | 인증 서비스 | 공유 서비스, 토큰 발급, 키 로테이션, 취소 |
| ✅ | 각 설계 후: "네 설계를 통과하는 요청 하나를 모든 계층에서 추적하고, 모든 풀/큐/버퍼를 짚고, 10배에서 처음 깨지는 곳" | |

## Part 17 — Failure Engineering `P0` · ~20h · 선수: 전체 + 16 · **최종 캡스톤**

각 시나리오: **증상 → 가설 트리 → 확인(Linux 명령/메트릭/로그/트레이스) → 근본 원인 → 해결 → 재발 방지** + 재현 랩.

| 모듈 | 장애 |
|---|---|
| 17.1 | CPU 100% (busy loop / GC / regex / 작업량 폭증) |
| 17.2 | 메모리 증가 / heap OOM / Metaspace OOM / native OOM / direct buffer OOM |
| 17.3 | GC Pause 스파이크 (할당률, humongous, promotion failure, 잘못된 collector) |
| 17.4 | Thread Pool 고갈 (Tomcat, 커스텀 executor) → rejected / queued / latency cliff |
| 17.5 | Connection Pool 고갈 (HikariCP) → leak vs 과소 vs 느린 DB |
| 17.6 | Slow Query / 플랜 회귀 (stale stats, parameter sniffing, 인덱스 누락, bloat) |
| 17.7 | DB Lock 경합 / Deadlock / long-running tx가 vacuum 차단 |
| 17.8 | Redis 장애/지연 (blocking 명령, `KEYS`, big key, swap, 싱글 스레드 포화) |
| 17.9 | Kafka Consumer Lag 폭증 (느린 처리, 리밸런스 폭풍, poison pill, 파티션 부족) |
| 17.10 | DNS 장애 / 느린 해석 (JVM DNS 캐시, resolver timeout) |
| 17.11 | Network Timeout 캐스케이드 / retry storm / thundering herd |
| 17.12 | CLOSE_WAIT 누적 (앱이 소켓을 안 닫음) |
| 17.13 | TIME_WAIT 누적 (짧은 아웃바운드 커넥션 과다, 풀링 없음) |
| 17.14 | File Descriptor 고갈 (`Too many open files`) |
| 17.15 | Disk 풀 / Disk IO 포화 (로그, WAL, temp) |
| 17.16 | Cascading Failure / 부분 장애 / backpressure 부재 |
| ✅ 통합 G | `final-incident.md`: 증상은 API 타임아웃인데 근본 원인이 3계층 떨어진 다중 증상 인시던트 (졸업시험) |

---

## Cross-Layer 통합 문서 (`docs/99-integration/`)

| 파일 | 시나리오 | 완성 시점 |
|---|---|---|
| `java-line-to-cpu.md` | `int a = b + c;` → 바이트코드 → JIT → 기계어 → 파이프라인 → 캐시/RAM | Part 7 |
| `http-request-lifecycle.md` | NIC IRQ → 커널 TCP/IP → 소켓 버퍼 → epoll → Tomcat → DispatcherServlet → Controller | Part 8 |
| `transactional-method.md` | `@Transactional` → HikariCP → JDBC → BEGIN → backend → buffer/WAL → COMMIT → fsync | Part 5+8 |
| `cached-read-path.md` | `GET /product/123`: 브라우저 캐시 → CDN → Nginx → `@Cacheable` → Redis → PG buffer cache | Part 10 |
| `order-to-inventory.md` | DB tx + Outbox → CDC → Kafka → 재고 컨슈머(멱등) → 각 단계 실패·복구 | Part 12 |
| `ssh-into-slow-server.md` | 느린 서버 첫 10개 명령어와 각각이 배제하는 가설 | Part 13~14 |
| `final-incident.md` | 다중 증상 인시던트, 근본 원인은 3계층 떨어짐 (졸업시험) | Part 17 |
