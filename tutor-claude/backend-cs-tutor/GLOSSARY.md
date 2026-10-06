# GLOSSARY — 횡단 용어 사전

> 여러 Part에 걸쳐 등장하는 용어의 **한 줄 정의 + 처음 깊게 다루는 위치**.
> 학습을 진행하며 Claude가 채운다. 헷갈릴 때 여기부터 본다.

| 용어 | 한 줄 정의 | 정의 위치 |
|---|---|---|
| System Call | user 코드가 커널 기능을 요청하는 경계. 모드 전환 비용 발생 | Part 0.6, 3.4 |
| Context Switch | CPU가 실행 중인 스레드를 바꾸는 것. 레지스터·스택 저장/복원 | Part 3.2 |
| Page Fault | 접근한 가상 페이지가 물리 메모리에 없어 커널이 개입. minor(메모리에 있음) vs major(디스크) | Part 3.5 |
| Page Cache | 커널이 파일 데이터를 캐싱하는 RAM 영역. DB·Kafka 성능의 핵심 | Part 3.7 |
| File Descriptor (FD) | 프로세스가 연 파일·소켓을 가리키는 정수. 한계 존재(`ulimit -n`) | Part 3.9 |
| epoll | 리눅스의 확장 가능한 I/O 이벤트 통지. Netty·Nginx의 기반 | Part 3.12 |
| TIME_WAIT | TCP 능동 종료 측이 2MSL 동안 유지하는 상태. 지연 패킷·재사용 안전 | Part 4.7 |
| CLOSE_WAIT | 상대가 FIN을 보냈는데 내 앱이 `close()`를 안 함. **거의 항상 앱 버그** | Part 4.7 |
| Congestion Control | 네트워크 혼잡을 감지해 전송 속도(cwnd)를 조절. slow start, AIMD, BBR | Part 4.6 |
| MVCC | 다중 버전 동시성 제어. 읽기가 쓰기를 막지 않음. PostgreSQL은 tuple 버전으로 | Part 5.11 |
| WAL | Write-Ahead Log. 데이터 파일보다 먼저 변경을 로그에 기록해 내구성·복구 보장 | Part 5.14 |
| Buffer Cache | DB가 페이지를 캐싱하는 공유 메모리(`shared_buffers`). OS page cache와 이중 | Part 5.15 |
| Vacuum | 죽은 tuple을 회수. 안 하면 bloat + XID wraparound 위험 | Part 5.12 |
| happens-before | JMM에서 한 동작의 결과가 다른 동작에 보이도록 보장하는 순서 관계 | Part 6.3 |
| CAS | Compare-And-Swap. lock 없이 원자적 갱신. ABA 문제 주의 | Part 6.6 |
| False Sharing | 서로 다른 스레드가 같은 캐시 라인의 다른 변수를 갱신해 성능 저하 | Part 6.7 |
| TLAB | Thread-Local Allocation Buffer. 스레드별 힙 할당 영역, 락 없이 bump pointer | Part 7.6 |
| Safepoint | 모든 스레드가 멈출 수 있는 지점. STW GC가 여기서 발생 | Part 7.10 |
| `acceptCount` | Tomcat이 worker가 다 찼을 때 OS accept 큐에 대기시키는 요청 수 | Part 8.3 |
| Little's Law | L = λW. 시스템 내 평균 개수 = 도착률 × 평균 체류시간. 풀 사이징의 기초 | Part 14.3 |
| Coordinated Omission | 부하 테스트가 느린 응답을 놓쳐 latency를 과소평가하는 오류 | Part 14.2 |
| Consistent Hashing | 노드 추가/제거 시 재배치를 최소화하는 해시 링. 샤딩·캐시 분산 | Part 2.7, 11.6 |
| Quorum | R + W > N 이면 읽기가 최신 쓰기를 본다 | Part 11.5 |
| Idempotency | 같은 요청을 여러 번 처리해도 결과가 같음. at-least-once의 필수 짝 | Part 11.9, 12.7 |
| Outbox 패턴 | DB 트랜잭션 안에 메시지를 저장 → 별도 프로세스가 발행. 원자적 메시징 | Part 11.8 |
| ISR | In-Sync Replicas. 리더를 따라잡은 팔로워 집합. `acks=all` 내구성의 기준 | Part 12.5 |
| Consumer Lag | Kafka 컨슈머가 아직 처리 못 한 메시지 수 (log end offset - committed offset) | Part 12.9 |
| RED / USE | RED: 서비스(Rate·Errors·Duration). USE: 자원(Utilization·Saturation·Errors) | Part 15.4 |
| cardinality | 메트릭 label 조합의 수. 폭발하면 Prometheus가 죽음 | Part 15.3 |
