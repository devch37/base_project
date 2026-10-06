# sample-app

랩 전반에서 재사용하는 Spring Boot 애플리케이션. **주문 / 재고 도메인.**

> 아직 코드 없음. **Part 8 (Web Server & Spring Internals)** 학습을 시작할 때
> Claude와 함께 최소 버전을 만들고, 이후 Part마다 기능을 추가한다.

## 점진적 확장 계획

| Part | 추가되는 것 |
|---|---|
| 8 Web Server | 최소 REST API (`POST /orders`, `GET /orders/{id}`), Tomcat 스레드/커넥션 관찰 |
| 5 Database | JPA + PostgreSQL, `@Transactional`, N+1, EXPLAIN 대상 쿼리 |
| 6 Concurrency | 재고 차감 동시성 버그 → 락 / 낙관적 락 / 원자적 연산 비교 |
| 7 JVM | 부하 시 GC 로그 / 힙 덤프 / 플레임그래프 |
| 9 Security | Spring Security, JWT 인증, 취약 엔드포인트(학습용) |
| 10 Cache | `@Cacheable` + Redis, cache-aside, stampede |
| 11 Distributed | 결제 서비스 호출, retry / circuit breaker, 멱등 키 |
| 12 Messaging | 주문 → Outbox → Kafka → 재고 컨슈머 |
| 13~15 Ops | Actuator, Micrometer, OTel, graceful shutdown |
| 16 System Design | 이 앱을 확장해 실제 설계 검증 |
| 17 Failure | 이 앱에 각종 장애 주입 |

## 스택 (예정)

- Java 21, Spring Boot 3.x
- Spring Web (Part 8), 이후 WebFlux 비교
- Spring Data JPA + PostgreSQL
- Spring Data Redis
- Spring Kafka
- Micrometer + Prometheus
- Testcontainers (통합 테스트)
