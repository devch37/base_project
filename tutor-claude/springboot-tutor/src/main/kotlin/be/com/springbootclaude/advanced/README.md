

# 🚀 Spring Boot Advanced - 실무 고급 기능

**Production-Ready Spring Boot 고급 기능 완벽 가이드**

이 패키지는 실무에서 반드시 알아야 하는 Spring Boot의 고급 기능들을 다룹니다.

---

## 📦 구성

### 1. **Bean Lifecycle** (`lifecycle/`)
- ✅ Bean 생명주기 완벽 이해
- ✅ @PostConstruct, @PreDestroy
- ✅ InitializingBean, DisposableBean
- ✅ BeanPostProcessor 활용
- ✅ 리소스 초기화 및 정리

### 2. **Application Events** (`events/`)
- ✅ 이벤트 기반 아키텍처
- ✅ @EventListener, @TransactionalEventListener
- ✅ 동기/비동기 이벤트 처리
- ✅ 트랜잭션과 이벤트 연동

### 3. **Conditional Beans** (`conditional/`)
- ✅ @Profile, @Conditional
- ✅ 환경별 Bean 설정
- ✅ Feature Toggle
- ✅ Auto-Configuration 이해

### 4. **Transaction Management** (`transaction/`)
- ✅ 트랜잭션 전파 속성
- ✅ 격리 수준 (Isolation Level)
- ✅ 읽기 전용 트랜잭션
- ✅ 예외별 롤백 설정
- ✅ 실무 트랜잭션 패턴

### 5. **Caching** (`caching/`)
- ✅ @Cacheable, @CachePut, @CacheEvict
- ✅ 캐시 전략 (Cache-Aside, Write-Through)
- ✅ TTL, 캐시 무효화
- ✅ Caffeine, Redis 연동

### 6. **Async & Scheduling** (`async/`)
- ✅ @Async 비동기 처리
- ✅ CompletableFuture 활용
- ✅ @Scheduled 스케줄링
- ✅ Cron 표현식
- ✅ 병렬 처리 패턴

---

## 🎯 학습 순서 (추천)

### Week 1: 기초 다지기
1. **Bean Lifecycle** ⭐⭐⭐ (필수!)
   - Spring의 핵심 메커니즘
   - 리소스 관리 방법
   - 초기화/종료 로직

2. **Conditional Beans**
   - 환경별 설정
   - Feature Toggle
   - Auto-Configuration 원리

### Week 2: 실무 패턴
3. **Application Events** ⭐⭐⭐ (필수!)
   - 이벤트 기반 설계
   - 느슨한 결합
   - 확장 가능한 아키텍처

4. **Transaction Management** ⭐⭐⭐ (필수!)
   - 트랜잭션 경계
   - 전파 속성
   - 실무 패턴

### Week 3: 성능 최적화
5. **Caching** ⭐⭐ (중요)
   - 성능 향상
   - 캐시 전략
   - 분산 캐시

6. **Async & Scheduling** ⭐⭐ (중요)
   - 비동기 처리
   - 응답 속도 개선
   - 배치 작업

---

## 💡 각 기능별 핵심 포인트

### 1️⃣ Bean Lifecycle

**언제 배우나?**
- Spring 프로젝트 시작 시 가장 먼저
- 리소스 관리가 필요할 때
- 초기화 로직이 복잡할 때

**실무 활용:**
```kotlin
@Component
class DatabaseConnectionPool {

    @PostConstruct
    fun init() {
        // DB 연결 풀 초기화
        // Redis 연결 확인
        // 외부 API Health Check
    }

    @PreDestroy
    fun cleanup() {
        // DB 연결 종료
        // 임시 파일 삭제
        // 진행 중인 작업 완료 대기
    }
}
```

**학습 시간:** 2-3시간
**난이도:** ⭐⭐☆☆☆

---

### 2️⃣ Application Events

**언제 배우나?**
- 모듈 간 결합도를 낮추고 싶을 때
- 한 작업이 여러 후속 작업을 유발할 때
- 확장 가능한 시스템을 만들 때

**실무 시나리오:**
```kotlin
// 주문 완료 시
@Transactional
fun completeOrder(orderId: Long) {
    val order = orderRepository.findById(orderId)
    order.complete()

    // 이벤트 발행
    eventPublisher.publishEvent(
        OrderCompletedEvent(orderId, ...)
    )
}

// 리스너들이 자동으로 처리
@EventListener
fun sendEmail(event: OrderCompletedEvent) { ... }

@EventListener
fun earnPoints(event: OrderCompletedEvent) { ... }

@EventListener
fun decreaseStock(event: OrderCompletedEvent) { ... }
```

**장점:**
- 새 기능 추가 시 기존 코드 수정 불필요
- 리스너만 추가하면 됨
- 테스트 쉬움

**학습 시간:** 3-4시간
**난이도:** ⭐⭐⭐☆☆

---

### 3️⃣ Transaction Management

**언제 배우나?**
- 데이터 일관성이 중요할 때
- 동시성 이슈를 다룰 때
- 복잡한 비즈니스 로직을 구현할 때

**핵심 개념:**

**전파 속성 (Propagation):**
```kotlin
// REQUIRED (기본): 트랜잭션 참여 또는 새로 생성
@Transactional(propagation = REQUIRED)
fun businessLogic() { ... }

// REQUIRES_NEW: 항상 새 트랜잭션 (독립적)
@Transactional(propagation = REQUIRES_NEW)
fun auditLog() { ... }  // 메인 실패해도 로그는 저장
```

**격리 수준 (Isolation):**
```kotlin
// READ_COMMITTED (일반적)
@Transactional(isolation = READ_COMMITTED)
fun normalQuery() { ... }

// REPEATABLE_READ (동일 데이터 여러 번 읽기)
@Transactional(isolation = REPEATABLE_READ)
fun consistentRead() { ... }
```

**실무 패턴:**
```kotlin
// ✅ 좋은 예: 트랜잭션 범위 최소화
@Transactional
fun processOrder() {
    validateOrder()
    saveOrder()
}

@Async  // 비동기, 별도 트랜잭션
fun sendEmail() { ... }

// ❌ 나쁜 예: 트랜잭션이 너무 김
@Transactional
fun processOrder() {
    validateOrder()
    saveOrder()
    sendEmail()  // 느림!
    updateStatistics()
}
```

**학습 시간:** 4-5시간
**난이도:** ⭐⭐⭐⭐☆

---

### 4️⃣ Caching

**언제 배우나?**
- 성능 개선이 필요할 때
- DB 조회가 많을 때
- 외부 API 호출이 많을 때

**사용 예시:**
```kotlin
// 조회 (캐시 있으면 DB 조회 안 함)
@Cacheable(value = ["products"], key = "#productId")
fun getProduct(productId: Long): Product {
    return productRepository.findById(productId)
}

// 업데이트 (캐시 갱신)
@CachePut(value = ["products"], key = "#product.id")
fun updateProduct(product: Product): Product {
    return productRepository.save(product)
}

// 삭제 (캐시 무효화)
@CacheEvict(value = ["products"], key = "#productId")
fun deleteProduct(productId: Long) {
    productRepository.deleteById(productId)
}
```

**캐시 전략:**
1. **Cache-Aside** (일반적)
   - 캐시 조회 → 없으면 DB → 캐시 저장

2. **Write-Through**
   - DB 저장 → 캐시 저장

3. **Write-Behind**
   - 캐시 저장 → 비동기로 DB 저장

**학습 시간:** 3-4시간
**난이도:** ⭐⭐⭐☆☆

---

### 5️⃣ Async & Scheduling

**언제 배우나?**
- 응답 속도를 개선하고 싶을 때
- 백그라운드 작업이 필요할 때
- 정기 작업을 자동화하고 싶을 때

**비동기 처리:**
```kotlin
// Fire and Forget
@Async
fun sendEmail(to: String) {
    // 이메일 발송 (별도 스레드)
}

// 결과 반환
@Async
fun fetchData(): CompletableFuture<Data> {
    return CompletableFuture.completedFuture(data)
}

// 병렬 처리
fun processOrder() {
    val task1 = CompletableFuture.supplyAsync { checkInventory() }
    val task2 = CompletableFuture.supplyAsync { processPayment() }
    val task3 = CompletableFuture.supplyAsync { sendNotification() }

    CompletableFuture.allOf(task1, task2, task3).join()
}
```

**스케줄링:**
```kotlin
// 고정 주기
@Scheduled(fixedRate = 5000)
fun healthCheck() { ... }

// Cron 표현식
@Scheduled(cron = "0 0 3 * * *")  // 매일 새벽 3시
fun cleanupOldData() { ... }
```

**학습 시간:** 3-4시간
**난이도:** ⭐⭐⭐☆☆

---

## 🛠️ 설정 가이드

### 1. Async 활성화

```kotlin
@Configuration
@EnableAsync
class AsyncConfig {

    @Bean
    fun taskExecutor(): TaskExecutor {
        return ThreadPoolTaskExecutor().apply {
            corePoolSize = 5
            maxPoolSize = 10
            queueCapacity = 25
            setThreadNamePrefix("async-")
            initialize()
        }
    }
}
```

### 2. Scheduling 활성화

```kotlin
@Configuration
@EnableScheduling
class SchedulingConfig
```

### 3. Caching 활성화

```kotlin
@Configuration
@EnableCaching
class CachingConfig {

    @Bean
    fun cacheManager(): CacheManager {
        return CaffeineCacheManager().apply {
            setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(1000)
            )
        }
    }
}
```

### 4. application.yml

```yaml
spring:
  profiles:
    active: dev
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=1000,expireAfterWrite=10m

app:
  feature:
    cache:
      enabled: true
    email:
      enabled: true
```

---

## 📊 실무 체크리스트

### Bean Lifecycle
- [ ] @PostConstruct에서 리소스 초기화
- [ ] @PreDestroy에서 리소스 정리
- [ ] Graceful Shutdown 구현
- [ ] 초기화 실패 시 애플리케이션 시작 실패

### Application Events
- [ ] 이벤트는 불변 객체 (data class)
- [ ] 과거형 이름 (OrderCreated, PaymentCompleted)
- [ ] @TransactionalEventListener(AFTER_COMMIT) 사용
- [ ] 느린 작업은 @Async 조합

### Transaction Management
- [ ] 트랜잭션 범위 최소화
- [ ] 조회 API는 @Transactional(readOnly = true)
- [ ] 외부 API 호출은 트랜잭션 밖에서
- [ ] 감사 로그는 REQUIRES_NEW

### Caching
- [ ] 자주 조회되는 데이터만 캐싱
- [ ] 캐시 키 설계 명확히
- [ ] TTL 설정
- [ ] 캐시 무효화 전략

### Async & Scheduling
- [ ] ThreadPoolTaskExecutor 설정
- [ ] 예외 처리 (AsyncUncaughtExceptionHandler)
- [ ] @Scheduled 작업은 짧게 (또는 @Async 조합)
- [ ] 스레드 풀 모니터링

---

## 🎓 학습 경로

### 초급 (1-2주)
1. Bean Lifecycle 이해
2. Conditional Beans 활용
3. 기본 트랜잭션 사용

### 중급 (3-4주)
4. Application Events 설계
5. 고급 트랜잭션 (전파, 격리)
6. Caching 적용

### 고급 (5-6주)
7. 비동기 처리 마스터
8. 스케줄링 활용
9. 성능 최적화

---

## 📚 추가 학습 자료

### 공식 문서
- [Spring Framework Reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/)

### 추천 도서
- 『토비의 스프링 3.1』 - 이일민
- 『스프링 부트 실전 활용 마스터』

### 실습 프로젝트
- 주문 시스템 구현
- 배치 시스템 구현
- 이벤트 기반 MSA

---

## 💬 FAQ

**Q: Bean Lifecycle은 언제 사용하나요?**
A: DB 연결 풀, 외부 API 클라이언트, 캐시 워밍업 등 초기화가 필요한 모든 곳에서 사용합니다.

**Q: 이벤트 vs 직접 호출?**
A: 결합도를 낮추고 확장성을 원하면 이벤트, 단순한 로직은 직접 호출이 나을 수 있습니다.

**Q: 트랜잭션 전파 속성을 언제 바꾸나요?**
A: 감사 로그처럼 독립적으로 저장해야 하는 경우 REQUIRES_NEW를 사용합니다.

**Q: 캐시는 항상 사용해야 하나요?**
A: 아닙니다. 자주 조회되고 변경이 적은 데이터만 캐싱합니다. 실시간 데이터는 캐싱하지 않습니다.

**Q: @Async와 @Transactional 함께 사용?**
A: 가능하지만 @Async 메서드는 별도 트랜잭션이 됩니다. 호출자 트랜잭션과 독립적입니다.

---

**Happy Learning! 🚀**

각 패키지의 코드에는 실무 예제와 상세한 주석이 포함되어 있습니다.
하나씩 읽어보고 실습해보세요!
