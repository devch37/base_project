# DDD (Domain-Driven Design) 실전 예제

이 패키지는 **주문 시스템**을 통해 DDD의 핵심 개념들을 실전에서 어떻게 적용하는지 보여줍니다.

## 📚 DDD란?

Domain-Driven Design은 복잡한 비즈니스 로직을 다루기 위한 소프트웨어 설계 방법론입니다.

**핵심 철학:**
- 도메인 전문가와 개발자가 같은 언어(Ubiquitous Language)로 소통
- 비즈니스 로직을 코드의 중심에 두기
- 복잡도를 Bounded Context로 분리

## 🏗️ 프로젝트 구조

```
ddd/order/
├── domain/                    # 도메인 계층 (핵심!)
│   ├── model/                # 도메인 모델
│   │   ├── Order.kt          # ⭐ Aggregate Root
│   │   ├── OrderItem.kt      # Entity
│   │   ├── Money.kt          # Value Object
│   │   ├── Address.kt        # Value Object
│   │   └── ProductInfo.kt    # Value Object
│   ├── event/                # 도메인 이벤트
│   │   ├── OrderPlaced.kt
│   │   └── OrderCancelled.kt
│   ├── service/              # 도메인 서비스
│   │   └── OrderPriceCalculator.kt
│   └── repository/           # 리포지토리 인터페이스
│       └── OrderRepository.kt
├── application/              # 응용 계층
│   ├── OrderCommandService.kt  # CQRS Command
│   └── OrderQueryService.kt    # CQRS Query
├── infrastructure/           # 인프라 계층
│   ├── OrderRepositoryImpl.kt
│   ├── OrderJpaRepository.kt
│   ├── OrderEventPublisher.kt
│   └── OrderEventHandler.kt
└── presentation/             # 표현 계층
    └── OrderController.kt
```

## 🎯 DDD 핵심 개념 학습

### 1. Value Object (값 객체)

**예시:** `Money`, `Address`, `ProductInfo`

```kotlin
// ❌ 나쁜 예: 원시 타입 사용
val price: BigDecimal = BigDecimal("-100")  // 음수 금액도 가능!

// ✅ 좋은 예: Value Object
val money = Money.of(1000)  // 생성 시 검증
val doubled = money * 2     // 비즈니스 로직 캡슐화
```

**특징:**
- 불변(Immutable)
- 식별자 없음
- 값으로 동등성 비교
- 비즈니스 규칙 캡슐화

### 2. Entity (엔티티)

**예시:** `OrderItem`

```kotlin
// Entity는 ID로 식별
val item1 = OrderItem(id = 1, productInfo = ..., quantity = 2)
val item2 = OrderItem(id = 1, productInfo = ..., quantity = 5)

item1 == item2  // true (ID가 같으면 같은 엔티티)
```

**특징:**
- 고유 식별자 존재
- 시간에 따라 상태 변경 가능
- ID로 동등성 비교
- 생명주기 존재

### 3. ⭐ Aggregate Root (집합 루트) - DDD의 핵심!

**예시:** `Order`

```kotlin
// ❌ 나쁜 예: 외부에서 OrderItem 직접 생성
val item = OrderItem(...)
orderItemRepository.save(item)  // 일관성 깨짐!

// ✅ 좋은 예: Aggregate Root를 통해서만 접근
order.addItem(productInfo, quantity)  // Order가 일관성 보장
orderRepository.save(order)           // Order와 Item 함께 저장
```

**Aggregate란?**
- 관련된 객체들의 집합 (Order + OrderItems)
- 데이터 변경의 단위 (트랜잭션 경계)
- 일관성을 보장하는 경계

**Aggregate Root의 책임:**
- Aggregate 내부 객체의 유일한 진입점
- 비즈니스 규칙(불변식) 보장
- 외부에서는 Root를 통해서만 접근

### 4. Repository (리포지토리)

**예시:** `OrderRepository`

```kotlin
// Domain Layer: 인터페이스만
interface OrderRepository {
    fun save(order: Order): Order
    fun findById(id: Long): Order?
    // 도메인 언어로 쿼리 메서드 정의
    fun findByCustomerId(customerId: Long): List<Order>
}

// Infrastructure Layer: 구현
class OrderRepositoryImpl : OrderRepository {
    // JPA, MongoDB 등 기술 세부사항
}
```

**핵심:**
- Aggregate Root 단위로만 Repository 제공
- OrderItemRepository는 만들지 않음!
- 의존성 역전 (Domain이 Infrastructure에 의존 안 함)

### 5. Domain Event (도메인 이벤트)

**예시:** `OrderPlaced`, `OrderCancelled`

```kotlin
// 주문 확정 시 이벤트 발행
fun confirm() {
    this.status = CONFIRMED
    _domainEvents.add(OrderPlaced(...))  // 이벤트 추가
}

// 이벤트 핸들러가 비동기로 처리
@EventListener
fun handleOrderPlaced(event: OrderPlaced) {
    sendEmail()      // 이메일 발송
    earnPoints()     // 포인트 적립
    decreaseStock()  // 재고 차감
}
```

**장점:**
- 시스템 간 결합도 감소
- 새 기능 추가 시 기존 코드 수정 불필요
- 비즈니스 흐름 명확화

### 6. Domain Service (도메인 서비스)

**예시:** `OrderPriceCalculator`

```kotlin
// 여러 Aggregate를 조율하는 로직
class OrderPriceCalculator {
    fun calculateDeliveryFee(order: Order): Money {
        // 주문 금액, 배송지, 고객 등급 등 복합 계산
    }
}
```

**언제 사용?**
- 특정 Entity에 억지로 넣기 어려운 로직
- 여러 Aggregate에 걸친 연산
- 외부 정책, 룰 엔진

### 7. Application Service (응용 서비스)

**예시:** `OrderCommandService`, `OrderQueryService`

```kotlin
@Transactional
class OrderCommandService {
    fun createOrder(command: CreateOrderCommand): Long {
        // 1. 도메인 객체 생성
        val order = Order(...)

        // 2. 도메인 로직 실행
        order.addItem(...)

        // 3. 저장
        orderRepository.save(order)

        // 4. 이벤트 발행
        eventPublisher.publish(order.domainEvents)

        return order.id
    }
}
```

**역할:**
- 유스케이스 구현
- 도메인 객체 조율 (Orchestration)
- 트랜잭션 경계
- **비즈니스 로직은 포함 안 함!** (도메인 모델에)

## 🚀 실행해보기

### 1. 주문 생성

```bash
POST /api/ddd/orders
{
  "customerId": 1,
  "deliveryAddress": {
    "zipCode": "06234",
    "city": "서울시 강남구",
    "street": "테헤란로 123",
    "detailAddress": "ABC빌딩 5층"
  },
  "items": [
    {
      "productId": 1,
      "productName": "노트북",
      "price": 1500000,
      "quantity": 1
    },
    {
      "productId": 2,
      "productName": "마우스",
      "price": 30000,
      "quantity": 2
    }
  ]
}
```

### 2. 주문 조회

```bash
GET /api/ddd/orders/1
```

### 3. 주문 확정

```bash
POST /api/ddd/orders/1/confirm
```

이벤트 핸들러가 자동으로:
- 이메일 발송
- 포인트 적립
- 재고 차감

### 4. 주문 취소

```bash
POST /api/ddd/orders/1/cancel
{
  "reason": "단순 변심"
}
```

## 📖 학습 포인트

### 비교: 일반적인 설계 vs DDD

#### ❌ 일반적인 설계 (Transaction Script)

```kotlin
@Service
class OrderService(
    private val orderRepository: OrderRepository,
    private val orderItemRepository: OrderItemRepository
) {
    fun createOrder(request: CreateOrderRequest) {
        // 검증 로직이 Service에
        if (request.items.isEmpty()) {
            throw IllegalArgumentException("항목 없음")
        }

        // 계산 로직도 Service에
        val total = request.items.sumOf { it.price * it.quantity }

        // 상태 관리도 Service에
        val order = Order(customerId = request.customerId, status = "PENDING")
        orderRepository.save(order)

        // OrderItem을 직접 저장 (일관성 깨질 위험)
        request.items.forEach { item ->
            orderItemRepository.save(OrderItem(order.id, item))
        }
    }
}
```

**문제점:**
- 비즈니스 로직이 Service에 흩어짐
- Order가 빈약한 모델 (Anemic Domain Model)
- 일관성 보장 어려움
- 테스트하기 어려움

#### ✅ DDD 설계

```kotlin
// 1. 도메인 모델이 비즈니스 로직 포함
class Order {
    fun addItem(productInfo: ProductInfo, quantity: Int) {
        // 검증 로직
        require(status == PENDING) { "대기 상태에서만 추가 가능" }

        // 비즈니스 로직
        val existingItem = _orderItems.find { ... }
        if (existingItem != null) {
            existingItem.changeQuantity(...)
        } else {
            _orderItems.add(OrderItem(...))
        }
    }

    fun confirm() {
        // 상태 전이 규칙
        require(status == PENDING) { ... }
        require(_orderItems.isNotEmpty()) { ... }

        this.status = CONFIRMED
        _domainEvents.add(OrderPlaced(...))
    }
}

// 2. Application Service는 조율만
@Service
class OrderCommandService {
    fun createOrder(command: CreateOrderCommand): Long {
        val order = Order(...)
        command.items.forEach { order.addItem(...) }  // 도메인 로직 위임
        return orderRepository.save(order).id
    }
}
```

**장점:**
- 비즈니스 로직이 도메인 모델에 응집
- 테스트하기 쉬움 (Order 단위 테스트 가능)
- 일관성 보장 (Aggregate)
- 유지보수 쉬움 (변경 영향 범위 명확)

## 🎓 DDD를 언제 사용할까?

### ✅ DDD가 유용한 경우

- 복잡한 비즈니스 로직
- 도메인 전문가와 협업 중요
- 장기간 유지보수할 시스템
- 비즈니스 규칙이 자주 변경

### ❌ DDD가 과한 경우

- CRUD 위주의 단순한 애플리케이션
- 비즈니스 로직이 거의 없음
- 단기 프로젝트
- 팀의 DDD 이해도 부족

## 🔑 핵심 원칙 요약

1. **Ubiquitous Language**: 개발자와 도메인 전문가가 같은 용어 사용
2. **Bounded Context**: 도메인을 의미있는 경계로 나누기
3. **Aggregate**: 일관성 경계, 트랜잭션 경계
4. **Domain Model이 중심**: 비즈니스 로직은 도메인 모델에!
5. **의존성 역전**: Domain이 Infrastructure에 의존하지 않음

## 📚 더 공부하기

- **책**: 『도메인 주도 설계』 - Eric Evans
- **책**: 『도메인 주도 설계 핵심』 - Vaughn Vernon
- **책**: 『만들면서 배우는 클린 아키텍처』 - Tom Hombergs

## 💡 다음 단계

1. `Order` 클래스의 메서드들을 하나씩 읽어보기
2. Value Object들의 검증 로직 확인
3. Application Service가 어떻게 도메인 모델을 조율하는지 관찰
4. 이벤트 핸들러가 어떻게 동작하는지 확인
5. 실제 API를 호출해보고 로그 확인

**Happy Learning! 🚀**
