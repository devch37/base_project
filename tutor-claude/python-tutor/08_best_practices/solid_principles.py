"""
solid_principles.py

SOLID 원칙: 객체지향 설계의 5가지 기본 원칙

로버트 마틴(Robert C. Martin)이 제안한 SOLID 원칙은
유지보수 가능하고 확장 가능한 소프트웨어를 만들기 위한 지침입니다.

학습 목표:
1. 각 원칙의 의미와 중요성 이해
2. 원칙을 위반한 코드와 준수한 코드 비교
3. Django 프로젝트에 SOLID 원칙 적용
4. 실무에서의 적용 방법 학습
"""

from abc import ABC, abstractmethod
from typing import List, Protocol
from decimal import Decimal

# ============================================================================
# S - Single Responsibility Principle (단일 책임 원칙)
# ============================================================================
"""
단일 책임 원칙: 하나의 클래스는 하나의 책임만 가져야 한다.
"클래스를 변경하는 이유는 단 하나여야 한다"

실무 적용:
- 클래스가 너무 많은 일을 하고 있다면 분리
- 메서드가 여러 작업을 한다면 별도 함수로 추출
- Django의 Fat Models, Thin Views도 이 원칙의 적용
"""

# Bad: 여러 책임을 가진 클래스
class UserBad:
    """
    문제점:
    1. 사용자 데이터 관리
    2. 데이터베이스 저장
    3. 이메일 발송
    4. 보고서 생성
    -> 4가지 책임, 변경 이유가 4가지!
    """
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email

    def save_to_database(self):
        """데이터베이스 저장 로직"""
        # DB 연결 코드
        # 저장 로직
        pass

    def send_email(self, subject: str, body: str):
        """이메일 발송 로직"""
        # SMTP 연결
        # 이메일 발송
        pass

    def generate_report(self):
        """보고서 생성 로직"""
        # 보고서 포맷팅
        # PDF 생성
        pass

# Good: 책임을 분리
class User:
    """사용자 데이터만 관리 (단일 책임)"""
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email

    def get_full_name(self) -> str:
        """사용자 정보 관련 로직만"""
        return self.name

class UserRepository:
    """데이터베이스 관련 책임만"""
    def save(self, user: User):
        """사용자 저장"""
        pass

    def find_by_email(self, email: str) -> User:
        """사용자 조회"""
        pass

class EmailService:
    """이메일 발송 책임만"""
    def send(self, to: str, subject: str, body: str):
        """이메일 발송"""
        pass

class ReportGenerator:
    """보고서 생성 책임만"""
    def generate_user_report(self, user: User) -> bytes:
        """사용자 보고서 생성"""
        pass

# Django에서의 SRP 적용
"""
# Bad: View가 너무 많은 일을 함
def register_view(request):
    # 1. 폼 검증
    # 2. 사용자 생성
    # 3. 프로필 생성
    # 4. 이메일 발송
    # 5. 로그 기록
    # 6. 통계 업데이트
    pass

# Good: 각 책임을 서비스로 분리
class UserRegistrationService:
    def register(self, data):
        user = self._create_user(data)
        self._create_profile(user)
        self._send_welcome_email(user)
        return user

def register_view(request):
    # 뷰는 요청/응답 처리만
    form = RegistrationForm(request.POST)
    if form.is_valid():
        service = UserRegistrationService()
        user = service.register(form.cleaned_data)
        return redirect('success')
    return render(request, 'register.html', {'form': form})
"""

# ============================================================================
# O - Open/Closed Principle (개방/폐쇄 원칙)
# ============================================================================
"""
개방/폐쇄 원칙: 확장에는 열려있고, 수정에는 닫혀있어야 한다.
"기존 코드를 변경하지 않고 기능을 추가할 수 있어야 한다"

실무 적용:
- 추상화를 활용한 확장 가능한 설계
- 전략 패턴, 템플릿 메서드 패턴 활용
- Django의 미들웨어, 시그널이 이 원칙을 따름
"""

# Bad: 새 결제 수단 추가 시 기존 코드 수정 필요
class PaymentProcessorBad:
    def process_payment(self, amount: Decimal, method: str):
        if method == "credit_card":
            # 신용카드 결제 로직
            pass
        elif method == "paypal":
            # PayPal 결제 로직
            pass
        elif method == "bank_transfer":  # 새 결제 수단 추가 시 이 클래스 수정!
            # 계좌이체 로직
            pass

# Good: 추상화를 통한 확장 가능한 설계
class PaymentMethod(ABC):
    """결제 수단 인터페이스"""

    @abstractmethod
    def process(self, amount: Decimal) -> bool:
        """결제 처리"""
        pass

class CreditCardPayment(PaymentMethod):
    """신용카드 결제"""
    def process(self, amount: Decimal) -> bool:
        print(f"신용카드로 {amount}원 결제")
        return True

class PayPalPayment(PaymentMethod):
    """PayPal 결제"""
    def process(self, amount: Decimal) -> bool:
        print(f"PayPal로 {amount}원 결제")
        return True

class BankTransferPayment(PaymentMethod):
    """계좌이체 (기존 코드 수정 없이 추가!)"""
    def process(self, amount: Decimal) -> bool:
        print(f"계좌이체로 {amount}원 결제")
        return True

class PaymentProcessor:
    """결제 처리기 (수정 없이 확장 가능)"""
    def __init__(self, payment_method: PaymentMethod):
        self.payment_method = payment_method

    def process_payment(self, amount: Decimal) -> bool:
        return self.payment_method.process(amount)

# 사용 예제
def demonstrate_ocp():
    # 신용카드 결제
    processor = PaymentProcessor(CreditCardPayment())
    processor.process_payment(Decimal('10000'))

    # PayPal 결제
    processor = PaymentProcessor(PayPalPayment())
    processor.process_payment(Decimal('20000'))

    # 새 결제 수단 추가 (기존 코드 수정 없음!)
    processor = PaymentProcessor(BankTransferPayment())
    processor.process_payment(Decimal('30000'))

# ============================================================================
# L - Liskov Substitution Principle (리스코프 치환 원칙)
# ============================================================================
"""
리스코프 치환 원칙: 하위 타입은 상위 타입을 대체할 수 있어야 한다.
"부모 클래스의 인스턴스를 자식 클래스의 인스턴스로 바꿔도
프로그램의 동작이 변하지 않아야 한다"

실무 적용:
- 상속 시 부모의 계약(contract)을 지켜야 함
- 오버라이딩 시 부모 메서드의 의미를 유지
- 예상치 못한 예외를 발생시키지 않아야 함
"""

# Bad: LSP 위반
class Bird:
    def fly(self):
        print("날아갑니다")

class Penguin(Bird):
    def fly(self):
        # 펭귄은 날 수 없음!
        raise Exception("펭귄은 날 수 없습니다")  # LSP 위반!

def make_bird_fly(bird: Bird):
    """Bird 타입을 받지만 Penguin에서는 예외 발생!"""
    bird.fly()  # Penguin을 전달하면 예외!

# Good: LSP 준수
class Bird2(ABC):
    @abstractmethod
    def move(self):
        """이동 방법"""
        pass

class FlyingBird(Bird2):
    def move(self):
        print("날아갑니다")

class Penguin2(Bird2):
    def move(self):
        print("걸어갑니다")  # 예외 없이 자신만의 방식으로 이동

def make_bird_move(bird: Bird2):
    """모든 Bird2 하위 타입이 정상 동작"""
    bird.move()

# Django에서의 LSP
"""
# Bad: 부모 메서드의 의미를 변경
class BaseView:
    def dispatch(self, request):
        return self.handle(request)

class BadChildView(BaseView):
    def dispatch(self, request):
        # 전혀 다른 동작! LSP 위반
        return redirect('other_page')

# Good: 부모의 계약 유지
class GoodChildView(BaseView):
    def dispatch(self, request):
        # 부모 동작 유지, 필요한 부분만 확장
        response = super().dispatch(request)
        # 추가 처리...
        return response
"""

# ============================================================================
# I - Interface Segregation Principle (인터페이스 분리 원칙)
# ============================================================================
"""
인터페이스 분리 원칙: 클라이언트는 사용하지 않는 인터페이스에 의존하지 않아야 한다.
"큰 인터페이스를 작은 인터페이스로 분리"

실무 적용:
- 거대한 인터페이스 대신 구체적인 인터페이스
- Python의 Protocol을 활용한 덕 타이핑
- 필요한 메서드만 정의
"""

# Bad: 거대한 인터페이스
class WorkerBad(ABC):
    @abstractmethod
    def work(self):
        pass

    @abstractmethod
    def eat(self):
        pass

    @abstractmethod
    def sleep(self):
        pass

class HumanWorker(WorkerBad):
    def work(self):
        print("일합니다")

    def eat(self):
        print("먹습니다")

    def sleep(self):
        print("잡니다")

class RobotWorker(WorkerBad):
    def work(self):
        print("일합니다")

    def eat(self):
        # 로봇은 먹지 않음!
        raise NotImplementedError("로봇은 먹지 않습니다")

    def sleep(self):
        # 로봇은 자지 않음!
        raise NotImplementedError("로봇은 자지 않습니다")

# Good: 인터페이스 분리
class Workable(Protocol):
    def work(self) -> None:
        ...

class Eatable(Protocol):
    def eat(self) -> None:
        ...

class Sleepable(Protocol):
    def sleep(self) -> None:
        ...

class HumanWorker2:
    """필요한 인터페이스만 구현"""
    def work(self):
        print("일합니다")

    def eat(self):
        print("먹습니다")

    def sleep(self):
        print("잡니다")

class RobotWorker2:
    """필요한 인터페이스만 구현"""
    def work(self):
        print("일합니다")

def manage_work(worker: Workable):
    """Workable만 필요"""
    worker.work()

def manage_meal(eater: Eatable):
    """Eatable만 필요"""
    eater.eat()

# Django에서의 ISP
"""
# Bad: 모든 메서드를 강제하는 거대한 믹스인
class HugeMixin:
    def get_context_data(self):
        pass
    def get_queryset(self):
        pass
    def form_valid(self):
        pass
    def form_invalid(self):
        pass
    # ... 20개 메서드

# Good: 필요한 기능만 제공하는 작은 믹스인
class ContextMixin:
    def get_context_data(self):
        pass

class QuerysetMixin:
    def get_queryset(self):
        pass

class MyView(ContextMixin, QuerysetMixin, View):
    # 필요한 믹스인만 상속
    pass
"""

# ============================================================================
# D - Dependency Inversion Principle (의존성 역전 원칙)
# ============================================================================
"""
의존성 역전 원칙: 고수준 모듈은 저수준 모듈에 의존하지 않아야 한다.
둘 다 추상화에 의존해야 한다.

"구체적인 것이 아닌 추상적인 것에 의존하라"

실무 적용:
- 의존성 주입(Dependency Injection) 패턴
- 인터페이스를 통한 느슨한 결합
- 테스트 용이성 향상
"""

# Bad: 고수준이 저수준에 직접 의존
class MySQLDatabaseBad:
    """저수준 모듈"""
    def save(self, data: dict):
        print(f"MySQL에 저장: {data}")

class UserServiceBad:
    """고수준 모듈이 저수준에 직접 의존"""
    def __init__(self):
        self.database = MySQLDatabaseBad()  # 강한 결합!

    def save_user(self, user_data: dict):
        # MySQL에서 PostgreSQL로 변경하려면?
        # 이 클래스를 수정해야 함!
        self.database.save(user_data)

# Good: 둘 다 추상화에 의존
class Database(ABC):
    """추상화 (인터페이스)"""
    @abstractmethod
    def save(self, data: dict) -> None:
        pass

    @abstractmethod
    def find(self, query: dict) -> dict:
        pass

class MySQLDatabase(Database):
    """저수준 모듈 - 추상화 구현"""
    def save(self, data: dict):
        print(f"MySQL에 저장: {data}")

    def find(self, query: dict) -> dict:
        print(f"MySQL에서 조회: {query}")
        return {}

class PostgreSQLDatabase(Database):
    """저수준 모듈 - 추상화 구현"""
    def save(self, data: dict):
        print(f"PostgreSQL에 저장: {data}")

    def find(self, query: dict) -> dict:
        print(f"PostgreSQL에서 조회: {query}")
        return {}

class UserService:
    """고수준 모듈 - 추상화에 의존"""
    def __init__(self, database: Database):
        # 의존성 주입!
        self.database = database

    def save_user(self, user_data: dict):
        # 어떤 DB든 상관없음 (Database 인터페이스만 구현하면)
        self.database.save(user_data)

# 사용 예제
def demonstrate_dip():
    # MySQL 사용
    mysql_db = MySQLDatabase()
    user_service = UserService(mysql_db)
    user_service.save_user({"name": "Alice"})

    # PostgreSQL로 변경 (UserService 수정 없음!)
    postgres_db = PostgreSQLDatabase()
    user_service = UserService(postgres_db)
    user_service.save_user({"name": "Bob"})

# Django에서의 DIP
"""
# Bad: View가 구체적인 클래스에 직접 의존
class ArticleView:
    def __init__(self):
        self.repository = MySQLArticleRepository()  # 강한 결합

    def get_article(self, article_id):
        return self.repository.find(article_id)

# Good: 추상화에 의존
class ArticleRepository(ABC):
    @abstractmethod
    def find(self, article_id: int):
        pass

class DjangoORMArticleRepository(ArticleRepository):
    def find(self, article_id: int):
        return Article.objects.get(id=article_id)

class ArticleView:
    def __init__(self, repository: ArticleRepository):
        # 의존성 주입
        self.repository = repository

    def get_article(self, article_id):
        return self.repository.find(article_id)

# 사용
repository = DjangoORMArticleRepository()
view = ArticleView(repository)
"""

# ============================================================================
# 실전 예제: 주문 시스템에 SOLID 원칙 적용
# ============================================================================

# 1. SRP: 각 클래스는 하나의 책임
class Order:
    """주문 데이터 (단일 책임: 주문 정보 관리)"""
    def __init__(self, order_id: int, items: List[dict], total: Decimal):
        self.order_id = order_id
        self.items = items
        self.total = total

class OrderValidator:
    """주문 검증 (단일 책임: 검증 로직)"""
    def validate(self, order: Order) -> bool:
        if order.total <= 0:
            return False
        if not order.items:
            return False
        return True

# 2. OCP: 할인 정책 확장 가능
class DiscountStrategy(ABC):
    """할인 전략 인터페이스"""
    @abstractmethod
    def calculate_discount(self, total: Decimal) -> Decimal:
        pass

class NoDiscount(DiscountStrategy):
    def calculate_discount(self, total: Decimal) -> Decimal:
        return Decimal('0')

class PercentageDiscount(DiscountStrategy):
    def __init__(self, percentage: Decimal):
        self.percentage = percentage

    def calculate_discount(self, total: Decimal) -> Decimal:
        return total * (self.percentage / 100)

class FixedAmountDiscount(DiscountStrategy):
    def __init__(self, amount: Decimal):
        self.amount = amount

    def calculate_discount(self, total: Decimal) -> Decimal:
        return min(self.amount, total)

# 3. LSP: 모든 할인 전략은 대체 가능
def apply_discount(order: Order, strategy: DiscountStrategy) -> Decimal:
    """어떤 할인 전략이든 동일하게 동작"""
    discount = strategy.calculate_discount(order.total)
    return order.total - discount

# 4. ISP: 작은 인터페이스로 분리
class OrderPersistence(Protocol):
    """주문 저장만"""
    def save(self, order: Order) -> None:
        ...

class OrderQuery(Protocol):
    """주문 조회만"""
    def find_by_id(self, order_id: int) -> Order:
        ...

# 5. DIP: 추상화에 의존
class OrderService:
    """고수준: 추상화에 의존"""
    def __init__(
        self,
        validator: OrderValidator,
        discount_strategy: DiscountStrategy,
        persistence: OrderPersistence
    ):
        self.validator = validator
        self.discount_strategy = discount_strategy
        self.persistence = persistence

    def process_order(self, order: Order) -> bool:
        # 검증
        if not self.validator.validate(order):
            return False

        # 할인 적용
        final_total = apply_discount(order, self.discount_strategy)
        order.total = final_total

        # 저장
        self.persistence.save(order)

        return True

# ============================================================================
# SOLID 원칙 요약
# ============================================================================
"""
1. SRP (Single Responsibility)
   - 하나의 클래스는 하나의 책임
   - 변경 이유는 단 하나

2. OCP (Open/Closed)
   - 확장에는 열림, 수정에는 닫힘
   - 추상화를 활용

3. LSP (Liskov Substitution)
   - 하위 타입은 상위 타입을 대체 가능
   - 부모의 계약을 지킴

4. ISP (Interface Segregation)
   - 사용하지 않는 인터페이스에 의존하지 않음
   - 작고 구체적인 인터페이스

5. DIP (Dependency Inversion)
   - 추상화에 의존
   - 의존성 주입 활용

실무 적용:
- 코드 리뷰 시 SOLID 원칙 체크
- 리팩토링 기준으로 활용
- 새 기능 설계 시 원칙 고려
- 원칙은 가이드라인, 맹목적으로 따르지 말 것
"""

if __name__ == "__main__":
    print("=" * 80)
    print("SOLID 원칙 실습")
    print("=" * 80)

    print("\n개방/폐쇄 원칙 (OCP) 데모:")
    demonstrate_ocp()

    print("\n의존성 역전 원칙 (DIP) 데모:")
    demonstrate_dip()

    print("\n주문 시스템 예제:")
    order = Order(1, [{"item": "책", "price": 10000}], Decimal('10000'))
    validator = OrderValidator()
    discount = PercentageDiscount(Decimal('10'))

    class InMemoryOrderPersistence:
        def save(self, order: Order):
            print(f"주문 {order.order_id} 저장, 총액: {order.total}원")

    service = OrderService(validator, discount, InMemoryOrderPersistence())
    service.process_order(order)
