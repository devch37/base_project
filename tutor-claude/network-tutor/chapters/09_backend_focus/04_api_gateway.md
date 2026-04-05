# API Gateway & Circuit Breaker & Rate Limiting

## API Gateway 역할

```
클라이언트 ──→ [API Gateway] ──→ 서비스 A
                             ──→ 서비스 B
                             ──→ 서비스 C

담당 기능:
  인증/인가   → JWT 검증, OAuth2
  Rate Limit  → IP/사용자당 요청 수 제한
  라우팅      → URL 기반 서비스 분기
  SSL 종료    → HTTPS → HTTP 변환
  로깅/추적   → 요청/응답 로깅, 분산 추적
  변환        → 요청/응답 형식 변환
  캐싱        → 응답 캐시
  서킷 브레이커 → 장애 서비스 보호
```

---

## Rate Limiting 구현

### 알고리즘

```
Token Bucket:
  버킷에 토큰을 일정 속도로 채움
  요청당 토큰 소비
  순간적인 버스트 허용 (버킷이 찼을 때)

  버킷 크기: 100 (최대 버스트)
  채우기 속도: 10/초
  → 평소: 10 RPS 허용
  → 버스트: 최대 100 RPS까지 가능 (버킷이 차있을 때)

Leaky Bucket:
  고정 속도로 처리 (큐 방식)
  버스트 없음, 안정적인 출력
  웹 서버보다 네트워크 장비에 적합

Fixed Window Counter:
  시간 창(1분)마다 카운터 초기화
  문제: 창 경계에서 2배 버스트 가능
    → 59초에 100, 61초에 100 → 2초 내 200 요청

Sliding Window Log:
  정확한 슬라이딩 윈도우
  요청 타임스탬프 저장 → 메모리 사용

Sliding Window Counter:
  Fixed Window + 이전 창 가중치
  메모리 효율, 근사치
```

### Redis 기반 구현

```python
# Token Bucket (Lua 스크립트로 원자적 실행)
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])  -- tokens per second
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local last_refill = tonumber(redis.call('hget', key, 'last_refill') or now)
local tokens = tonumber(redis.call('hget', key, 'tokens') or capacity)

-- 경과 시간만큼 토큰 채우기
local elapsed = now - last_refill
tokens = math.min(capacity, tokens + elapsed * refill_rate)

if tokens >= requested then
    redis.call('hset', key, 'tokens', tokens - requested)
    redis.call('hset', key, 'last_refill', now)
    return 1  -- 허용
else
    return 0  -- 거부
end
```

### Rate Limit 헤더

```
표준 응답 헤더:
  X-RateLimit-Limit: 100         # 허용 한도
  X-RateLimit-Remaining: 45      # 남은 요청 수
  X-RateLimit-Reset: 1680000000  # 초기화 시간 (Unix timestamp)

429 응답 시:
  Retry-After: 30    # 30초 후 재시도
```

---

## Circuit Breaker (서킷 브레이커)

```
전기 회로 차단기에서 유래: 과부하 → 차단 → 보호

3가지 상태:

CLOSED (정상):
  요청 통과, 오류 카운팅
  오류율 임계값 초과 → OPEN

OPEN (차단):
  모든 요청 즉시 거부 (Fallback 응답)
  다운스트림 서비스 부하 제거
  일정 시간 후 → HALF_OPEN

HALF_OPEN (시험):
  일부 요청만 통과
  성공 → CLOSED 전환
  실패 → OPEN 유지

                  ┌─────────┐
      성공         │ CLOSED  │  오류율 초과
  ┌──────────────←│         │──────────────┐
  │               └─────────┘              │
  ↓                                        ↓
┌───────────┐                        ┌──────────┐
│ HALF_OPEN │                        │  OPEN    │
│(시험 통과) │←──────────────────────│(요청 차단)│
└───────────┘    타임아웃 후 전환    └──────────┘
      │ 실패
      └─────────────────────────────────────────→ OPEN 유지
```

### Circuit Breaker 구현 (Java - Resilience4j)

```java
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)           // 50% 오류율 시 OPEN
    .waitDurationInOpenState(Duration.ofSeconds(30)) // 30초 OPEN 유지
    .slidingWindowSize(10)              // 최근 10개 요청 기준
    .permittedNumberOfCallsInHalfOpenState(5) // HALF_OPEN 시 5개 허용
    .build();

CircuitBreaker cb = CircuitBreaker.of("userService", config);

// 사용
String result = cb.executeSupplier(() -> userServiceClient.getUser(id));

// Fallback
String result = Decorators.ofSupplier(() -> userServiceClient.getUser(id))
    .withCircuitBreaker(cb)
    .withFallback(e -> getCachedUser(id))  // 장애 시 캐시 반환
    .get();
```

---

## Bulkhead 패턴

```
격벽 패턴: 문제가 다른 서비스로 전파되지 않도록 격리

Thread Pool Bulkhead:
  서비스 A: 10개 스레드
  서비스 B: 10개 스레드
  → 서비스 A 느려져도 서비스 B에 영향 없음

Semaphore Bulkhead:
  동시 실행 수 제한
  서비스 A: 최대 20 동시 요청
  → 초과 시 즉시 거부 (스레드 낭비 없음)
```

---

## 실습 과제

```bash
# 1. Rate Limiting 테스트 (Apache Bench)
ab -n 200 -c 20 http://localhost:8080/api/users
# 429 응답 수 확인

# 2. Nginx Rate Limiting 설정
cat << 'EOF' >> /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        proxy_pass http://backend;
    }
}
EOF

# 3. 서킷 브레이커 상태 확인 (Actuator)
curl http://localhost:8080/actuator/circuitbreakers
# state: CLOSED/OPEN/HALF_OPEN
# failureRate: 현재 오류율
```

## 면접 단골 질문

**Q. Rate Limiting을 Redis로 구현할 때 레이스 컨디션을 어떻게 방지하나요?**
> Redis Lua 스크립트 사용 (원자적 실행). 또는 Redis 단일 스레드를 활용한 SET+INCR+EXPIRE 조합. WATCH/MULTI/EXEC 트랜잭션도 가능하지만 재시도 로직 필요.

**Q. Circuit Breaker가 없으면 어떤 일이 발생하나요?**
> 장애 서비스에 계속 요청 → 스레드 풀 고갈 → 전체 서비스 장애(Cascading Failure). 예: DB 느려짐 → API 스레드들이 DB 응답 기다리며 쌓임 → API 전체 다운.

**Q. Retry와 Circuit Breaker를 함께 사용할 때 주의할 점은?**
> Retry + Circuit Breaker 조합 시 오류가 증폭될 수 있음. Retry 전에 Circuit Breaker 체크 필요. Exponential Backoff + Jitter 적용 (동시 재시도 폭풍 방지). 멱등성 없는 요청(POST)은 재시도 신중히.
