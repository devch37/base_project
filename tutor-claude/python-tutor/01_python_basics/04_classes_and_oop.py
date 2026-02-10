"""
04_classes_and_oop.py

Python 클래스와 객체지향 프로그래밍 (OOP)

객체지향 프로그래밍은 현대 소프트웨어 개발의 핵심입니다.
이 파일에서는 Python의 OOP 개념을 깊이 있게 다루며,
실무에서 바로 활용할 수 있는 설계 패턴과 best practices를 제공합니다.

학습 목표:
1. 클래스와 객체의 개념 완전 이해
2. 캡슐화, 상속, 다형성 마스터
3. 매직 메서드를 활용한 Pythonic 코드 작성
4. SOLID 원칙 이해와 적용
5. 실무 디자인 패턴 활용
"""

from typing import List, Optional, Protocol
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum, auto
import json

# ============================================================================
# 1. 클래스 기초 (Class Basics)
# ============================================================================

class Dog:
    """
    가장 기본적인 클래스 정의

    클래스: 객체를 만들기 위한 설계도(blueprint)
    객체: 클래스의 인스턴스(instance)
    """

    # 클래스 변수 (모든 인스턴스가 공유)
    species = "Canis familiaris"

    def __init__(self, name: str, age: int):
        """
        생성자 (Constructor)

        __init__: 객체 생성 시 자동으로 호출
        self: 인스턴스 자신을 가리키는 참조 (Java의 this와 유사)
        """
        # 인스턴스 변수 (각 인스턴스마다 고유)
        self.name = name
        self.age = age

    def bark(self) -> str:
        """인스턴스 메서드"""
        return f"{self.name}: 멍멍!"

    def get_info(self) -> str:
        """인스턴스 정보 반환"""
        return f"{self.name}는 {self.age}살 {self.species}입니다."

# 클래스 사용
buddy = Dog("Buddy", 3)
print(buddy.bark())       # "Buddy: 멍멍!"
print(buddy.get_info())   # "Buddy는 3살 Canis familiaris입니다."

# 클래스 변수 접근
print(Dog.species)        # 클래스를 통한 접근
print(buddy.species)      # 인스턴스를 통한 접근

# ============================================================================
# 2. 캡슐화 (Encapsulation)
# ============================================================================

class BankAccount:
    """
    캡슐화: 데이터와 메서드를 하나로 묶고, 외부 접근을 제한

    Python의 접근 제한자:
    - public: 일반 속성/메서드
    - _protected: 단일 언더스코어 (관례상 내부 사용)
    - __private: 이중 언더스코어 (이름 맹글링)
    """

    def __init__(self, owner: str, balance: float = 0):
        self.owner = owner           # public
        self._account_number = "1234"  # protected (관례)
        self.__balance = balance     # private (이름 맹글링)

    def deposit(self, amount: float) -> None:
        """입금 - public 메서드"""
        if amount > 0:
            self.__balance += amount
            print(f"{amount}원 입금. 잔액: {self.__balance}원")
        else:
            raise ValueError("입금액은 양수여야 합니다")

    def withdraw(self, amount: float) -> bool:
        """출금 - public 메서드"""
        if amount <= 0:
            raise ValueError("출금액은 양수여야 합니다")

        if self.__balance >= amount:
            self.__balance -= amount
            print(f"{amount}원 출금. 잔액: {self.__balance}원")
            return True
        else:
            print("잔액이 부족합니다")
            return False

    def get_balance(self) -> float:
        """잔액 조회 - getter 메서드"""
        return self.__balance

    def _internal_method(self):
        """
        보호된 메서드 (관례상 외부에서 사용하지 않음)

        실무 팁: 하위 클래스나 같은 모듈에서만 사용
        """
        pass

    def __private_method(self):
        """
        비공개 메서드 (이름 맹글링)

        실제로는 _ClassName__method_name으로 변환됨
        """
        pass

# 사용 예제
account = BankAccount("Alice", 1000)
account.deposit(500)
account.withdraw(300)
print(f"잔액: {account.get_balance()}원")

# 비공개 속성 접근 시도
# print(account.__balance)  # AttributeError!
# 하지만 이렇게는 가능 (권장하지 않음)
# print(account._BankAccount__balance)

# ============================================================================
# 3. 프로퍼티 (Properties)
# ============================================================================

class Temperature:
    """
    @property 데코레이터를 활용한 getter/setter

    실무 팁: Python다운 방식으로 캡슐화 구현
    Java 스타일의 get/set 메서드 대신 프로퍼티 사용
    """

    def __init__(self, celsius: float = 0):
        self._celsius = celsius

    @property
    def celsius(self) -> float:
        """Getter: 속성처럼 접근 가능"""
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        """Setter: 유효성 검사 가능"""
        if value < -273.15:
            raise ValueError("절대영도보다 낮을 수 없습니다")
        self._celsius = value

    @property
    def fahrenheit(self) -> float:
        """계산된 프로퍼티 (읽기 전용)"""
        return self._celsius * 9/5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value: float) -> None:
        """화씨로 설정"""
        self._celsius = (value - 32) * 5/9

# 사용 예제
temp = Temperature(25)
print(f"섭씨: {temp.celsius}°C")   # 프로퍼티 getter
print(f"화씨: {temp.fahrenheit}°F") # 계산된 프로퍼티

temp.celsius = 30                   # 프로퍼티 setter
temp.fahrenheit = 86                # 화씨로 설정

# ============================================================================
# 4. 상속 (Inheritance)
# ============================================================================

class Animal:
    """부모 클래스 (Base Class, Super Class)"""

    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    def make_sound(self) -> str:
        """기본 메서드 (하위 클래스에서 오버라이드)"""
        return "동물 소리"

    def get_info(self) -> str:
        """공통 메서드"""
        return f"{self.name}는 {self.age}살입니다."

class Cat(Animal):
    """자식 클래스 (Derived Class, Sub Class)"""

    def __init__(self, name: str, age: int, color: str):
        # 부모 클래스 생성자 호출
        super().__init__(name, age)
        self.color = color

    # 메서드 오버라이딩 (Method Overriding)
    def make_sound(self) -> str:
        return "야옹!"

    # 새로운 메서드 추가
    def purr(self) -> str:
        return f"{self.name}가 가르랑거립니다~"

class Bird(Animal):
    """또 다른 자식 클래스"""

    def __init__(self, name: str, age: int, can_fly: bool = True):
        super().__init__(name, age)
        self.can_fly = can_fly

    def make_sound(self) -> str:
        return "짹짹!"

    def fly(self) -> str:
        if self.can_fly:
            return f"{self.name}가 날아갑니다!"
        return f"{self.name}는 날 수 없습니다."

# 사용 예제
cat = Cat("나비", 2, "검은색")
print(cat.get_info())      # 부모 메서드 사용
print(cat.make_sound())    # 오버라이딩된 메서드
print(cat.purr())          # 자식 클래스 고유 메서드

bird = Bird("참새", 1)
print(bird.make_sound())
print(bird.fly())

# isinstance와 issubclass
print(isinstance(cat, Cat))     # True
print(isinstance(cat, Animal))  # True (상속 관계)
print(issubclass(Cat, Animal))  # True

# ============================================================================
# 5. 다형성 (Polymorphism)
# ============================================================================

def animal_concert(animals: List[Animal]) -> None:
    """
    다형성 예제: 같은 인터페이스, 다른 동작

    실무 팁: 인터페이스를 기준으로 프로그래밍 (Duck Typing)
    "오리처럼 걷고 오리처럼 꽥꽥거리면, 그것은 오리다"
    """
    for animal in animals:
        print(f"{animal.name}: {animal.make_sound()}")

# 다양한 동물 객체를 같은 방식으로 처리
animals = [
    Dog("멍멍이", 3),
    Cat("야옹이", 2, "흰색"),
    Bird("짹짹이", 1)
]

animal_concert(animals)
# 멍멍이: 멍멍!
# 야옹이: 야옹!
# 짹짹이: 짹짹!

# ============================================================================
# 6. 추상 클래스 (Abstract Base Class)
# ============================================================================

class Shape(ABC):
    """
    추상 클래스: 인스턴스화할 수 없는 클래스

    실무 팁: 인터페이스 정의와 공통 기능 제공
    하위 클래스가 반드시 구현해야 할 메서드 강제
    """

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def area(self) -> float:
        """하위 클래스에서 반드시 구현해야 함"""
        pass

    @abstractmethod
    def perimeter(self) -> float:
        """하위 클래스에서 반드시 구현해야 함"""
        pass

    def describe(self) -> str:
        """구체적인 메서드 (하위 클래스에서 사용 가능)"""
        return f"{self.name}: 면적={self.area():.2f}, 둘레={self.perimeter():.2f}"

class Rectangle(Shape):
    """직사각형 - 추상 클래스 구현"""

    def __init__(self, width: float, height: float):
        super().__init__("직사각형")
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

    def perimeter(self) -> float:
        return 2 * (self.width + self.height)

class Circle(Shape):
    """원 - 추상 클래스 구현"""

    def __init__(self, radius: float):
        super().__init__("원")
        self.radius = radius

    def area(self) -> float:
        return 3.14159 * self.radius ** 2

    def perimeter(self) -> float:
        return 2 * 3.14159 * self.radius

# 사용 예제
# shape = Shape("도형")  # TypeError! 추상 클래스는 인스턴스화 불가

rect = Rectangle(10, 5)
print(rect.describe())

circle = Circle(7)
print(circle.describe())

# ============================================================================
# 7. 다중 상속 (Multiple Inheritance)
# ============================================================================

class Flyable:
    """날 수 있는 능력"""
    def fly(self) -> str:
        return "날아갑니다!"

class Swimmable:
    """수영할 수 있는 능력"""
    def swim(self) -> str:
        return "수영합니다!"

class Duck(Animal, Flyable, Swimmable):
    """
    다중 상속: 여러 부모 클래스로부터 상속

    실무 주의: 다이아몬드 문제 (MRO: Method Resolution Order)
    Python은 C3 선형화 알고리즘으로 해결
    """

    def __init__(self, name: str, age: int):
        super().__init__(name, age)

    def make_sound(self) -> str:
        return "꽥꽥!"

duck = Duck("도널드", 5)
print(duck.make_sound())  # Animal의 메서드 오버라이드
print(duck.fly())         # Flyable의 메서드
print(duck.swim())        # Swimmable의 메서드

# MRO 확인
print(Duck.__mro__)
# (<class 'Duck'>, <class 'Animal'>, <class 'Flyable'>, <class 'Swimmable'>, <class 'object'>)

# 실무 팁: 다중 상속보다 컴포지션(Composition) 선호
# "상속보다 조합을 우선하라" - Gang of Four

# ============================================================================
# 8. 매직 메서드 (Magic Methods / Dunder Methods)
# ============================================================================

class Vector:
    """
    매직 메서드를 활용한 Pythonic 클래스

    __메서드__: Python이 특별하게 취급하는 메서드
    연산자 오버로딩, 문자열 표현, 컨테이너 동작 등 커스터마이징
    """

    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __str__(self) -> str:
        """
        str(obj) 호출 시 사용
        사용자 친화적 문자열 표현
        """
        return f"Vector({self.x}, {self.y})"

    def __repr__(self) -> str:
        """
        repr(obj) 호출 시 사용
        개발자를 위한 명확한 표현 (객체 재생성 가능)
        """
        return f"Vector(x={self.x}, y={self.y})"

    def __add__(self, other: 'Vector') -> 'Vector':
        """
        + 연산자 오버로딩
        v1 + v2 호출 시 사용
        """
        if not isinstance(other, Vector):
            raise TypeError("Vector끼리만 더할 수 있습니다")
        return Vector(self.x + other.x, self.y + other.y)

    def __sub__(self, other: 'Vector') -> 'Vector':
        """- 연산자 오버로딩"""
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> 'Vector':
        """* 연산자 오버로딩 (스칼라 곱)"""
        return Vector(self.x * scalar, self.y * scalar)

    def __eq__(self, other: object) -> bool:
        """
        == 연산자 오버로딩
        v1 == v2 호출 시 사용
        """
        if not isinstance(other, Vector):
            return False
        return self.x == other.x and self.y == other.y

    def __len__(self) -> int:
        """len(obj) 호출 시 사용"""
        return 2  # 2차원 벡터

    def __getitem__(self, index: int) -> float:
        """
        인덱싱 지원: v[0], v[1]
        컨테이너처럼 동작
        """
        if index == 0:
            return self.x
        elif index == 1:
            return self.y
        else:
            raise IndexError("인덱스는 0 또는 1이어야 합니다")

    def __call__(self) -> float:
        """
        obj() 호출 시 사용
        객체를 함수처럼 호출 가능
        """
        return (self.x ** 2 + self.y ** 2) ** 0.5  # 벡터의 크기

# 사용 예제
v1 = Vector(3, 4)
v2 = Vector(1, 2)

print(v1)              # __str__: Vector(3, 4)
print(repr(v1))        # __repr__: Vector(x=3, y=4)

v3 = v1 + v2           # __add__: Vector(4, 6)
v4 = v1 * 2            # __mul__: Vector(6, 8)

print(v1 == v2)        # __eq__: False
print(len(v1))         # __len__: 2
print(v1[0], v1[1])    # __getitem__: 3, 4
print(v1())            # __call__: 5.0 (벡터 크기)

# ============================================================================
# 9. 클래스 메서드와 정적 메서드
# ============================================================================

class DateUtils:
    """
    클래스 메서드와 정적 메서드 예제
    """

    # 클래스 변수
    date_format = "%Y-%m-%d"

    def __init__(self, year: int, month: int, day: int):
        self.year = year
        self.month = month
        self.day = day

    @classmethod
    def from_string(cls, date_string: str):
        """
        클래스 메서드: 대체 생성자 (Factory Method)

        @classmethod:
        - 첫 번째 인자로 클래스 자체(cls)를 받음
        - 클래스 변수 접근 가능
        - 인스턴스 생성에 사용
        """
        year, month, day = map(int, date_string.split('-'))
        return cls(year, month, day)  # 클래스의 인스턴스 생성

    @staticmethod
    def is_leap_year(year: int) -> bool:
        """
        정적 메서드: 유틸리티 함수

        @staticmethod:
        - 인스턴스나 클래스에 접근하지 않음
        - 단순히 클래스 네임스페이스에 속한 함수
        - 관련 있는 함수를 그룹화
        """
        return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

    def __str__(self) -> str:
        return f"{self.year}-{self.month:02d}-{self.day:02d}"

# 사용 예제
date1 = DateUtils(2024, 1, 15)
date2 = DateUtils.from_string("2024-12-25")  # 클래스 메서드

print(DateUtils.is_leap_year(2024))  # True (정적 메서드)
print(date1.is_leap_year(2023))      # False (인스턴스로도 호출 가능)

# ============================================================================
# 10. 데이터 클래스 (Dataclass) - Python 3.7+
# ============================================================================

@dataclass
class Product:
    """
    데이터 클래스: 데이터 저장이 주 목적인 클래스

    자동으로 생성되는 것:
    - __init__
    - __repr__
    - __eq__
    - __hash__ (frozen=True일 때)
    """
    name: str
    price: float
    quantity: int = 0  # 기본값
    tags: List[str] = field(default_factory=list)  # 가변 기본값

    def total_value(self) -> float:
        """커스텀 메서드 추가 가능"""
        return self.price * self.quantity

# 사용 예제
product1 = Product("노트북", 1000000, 5, ["전자제품", "컴퓨터"])
product2 = Product("노트북", 1000000, 5, ["전자제품", "컴퓨터"])

print(product1)                    # 자동 __repr__
print(product1 == product2)        # 자동 __eq__: True
print(product1.total_value())      # 1500000

# ============================================================================
# 11. Enum 클래스
# ============================================================================

class OrderStatus(Enum):
    """
    열거형: 관련된 상수들의 집합

    실무 팁: 매직 넘버 대신 Enum 사용
    타입 안정성과 가독성 향상
    """
    PENDING = auto()      # 1
    PROCESSING = auto()   # 2
    SHIPPED = auto()      # 3
    DELIVERED = auto()    # 4
    CANCELLED = auto()    # 5

class PaymentMethod(Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"

# 사용 예제
status = OrderStatus.PENDING
print(status)           # OrderStatus.PENDING
print(status.name)      # "PENDING"
print(status.value)     # 1

# 비교
if status == OrderStatus.PENDING:
    print("주문 대기 중")

# 순회
for method in PaymentMethod:
    print(f"{method.name}: {method.value}")

# ============================================================================
# 12. Protocol (구조적 서브타이핑) - Python 3.8+
# ============================================================================

class Drawable(Protocol):
    """
    Protocol: 덕 타이핑을 명시적으로 표현

    실무 팁: 인터페이스를 정의하되 상속 강제하지 않음
    "덕 타이핑"을 타입 체커가 검증 가능
    """
    def draw(self) -> str:
        ...

class Square:
    """Drawable을 상속하지 않지만 프로토콜 만족"""
    def draw(self) -> str:
        return "■"

class Triangle:
    """Drawable을 상속하지 않지만 프로토콜 만족"""
    def draw(self) -> str:
        return "▲"

def render(shape: Drawable) -> None:
    """Drawable 프로토콜을 만족하는 모든 객체 허용"""
    print(shape.draw())

# 사용 예제
square = Square()
triangle = Triangle()

render(square)    # ■
render(triangle)  # ▲

# ============================================================================
# 13. 컨텍스트 매니저 클래스
# ============================================================================

class FileManager:
    """
    컨텍스트 매니저: with 문과 함께 사용

    __enter__와 __exit__ 구현
    리소스 관리, 예외 처리에 유용
    """

    def __init__(self, filename: str, mode: str = 'r'):
        self.filename = filename
        self.mode = mode
        self.file = None

    def __enter__(self):
        """with 블록 진입 시 호출"""
        print(f"파일 열기: {self.filename}")
        self.file = open(self.filename, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        """with 블록 종료 시 호출 (예외 발생해도 실행)"""
        if self.file:
            self.file.close()
            print(f"파일 닫기: {self.filename}")
        # False 반환 시 예외 전파, True 반환 시 예외 억제
        return False

# 사용 예제
# with FileManager("test.txt", "w") as f:
#     f.write("Hello, World!")

# ============================================================================
# 14. 실전 예제: 온라인 쇼핑몰 시스템
# ============================================================================

@dataclass
class Item:
    """상품"""
    id: int
    name: str
    price: float
    stock: int

class ShoppingCart:
    """장바구니"""

    def __init__(self):
        self._items: List[tuple[Item, int]] = []

    def add_item(self, item: Item, quantity: int = 1) -> None:
        """상품 추가"""
        if quantity > item.stock:
            raise ValueError(f"재고 부족: {item.name}")

        self._items.append((item, quantity))
        print(f"{item.name} {quantity}개 추가")

    def remove_item(self, item_id: int) -> None:
        """상품 제거"""
        self._items = [(item, qty) for item, qty in self._items
                       if item.id != item_id]

    def get_total(self) -> float:
        """총 금액 계산"""
        return sum(item.price * qty for item, qty in self._items)

    def __len__(self) -> int:
        """장바구니 아이템 개수"""
        return len(self._items)

    def __str__(self) -> str:
        if not self._items:
            return "장바구니가 비어있습니다"

        result = "장바구니:\n"
        for item, qty in self._items:
            result += f"- {item.name}: {qty}개 x {item.price:,}원\n"
        result += f"총액: {self.get_total():,}원"
        return result

# 사용 예제
laptop = Item(1, "노트북", 1500000, 10)
mouse = Item(2, "마우스", 30000, 50)

cart = ShoppingCart()
cart.add_item(laptop, 1)
cart.add_item(mouse, 2)
print(cart)
print(f"총 {len(cart)}종의 상품")

# ============================================================================
# 연습 문제
# ============================================================================

def practice_exercises():
    """연습 문제를 풀어보세요"""

    # 문제 1: Person 클래스 구현
    # 이름, 나이, 이메일 속성
    # 자기소개 메서드
    pass

    # 문제 2: BankAccount 클래스 확장
    # 거래 내역 기록 기능 추가
    # 거래 내역 조회 메서드
    pass

    # 문제 3: 추상 클래스 Vehicle 구현
    # Car, Motorcycle 하위 클래스
    # start_engine, stop_engine 추상 메서드
    pass

    # 문제 4: Fraction (분수) 클래스
    # +, -, *, / 연산자 오버로딩
    # 약분 기능
    pass

    # 문제 5: Singleton 패턴 구현
    # 단 하나의 인스턴스만 생성되는 클래스
    pass


if __name__ == "__main__":
    print("=" * 80)
    print("Python 클래스와 OOP 학습")
    print("=" * 80)

    print("\n벡터 연산:")
    v1 = Vector(3, 4)
    v2 = Vector(1, 2)
    print(f"{v1} + {v2} = {v1 + v2}")
    print(f"벡터 크기: {v1()}")

    print("\n쇼핑 카트 예제:")
    # 위의 쇼핑 카트 예제 실행

    print("\n연습 문제를 풀어보세요!")
