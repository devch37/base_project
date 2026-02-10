"""
03_functions.py

Python 함수: 재사용 가능한 코드 블록

함수는 프로그래밍의 핵심 구성 요소입니다.
이 파일에서는 함수의 기본부터 고급 기능까지,
실무에서 자주 사용되는 패턴과 best practices를 다룹니다.

학습 목표:
1. 함수 정의와 호출 방법 완전 이해
2. 다양한 매개변수 타입 활용
3. 일급 객체로서의 함수 특성 이해
4. 클로저와 스코프 개념 파악
5. 함수형 프로그래밍 기초
"""

from typing import Callable, List, Optional, Any, TypeVar
from functools import reduce, partial, wraps
import time

# ============================================================================
# 1. 기본 함수 정의와 호출
# ============================================================================

def greet():
    """
    가장 간단한 함수 - 매개변수와 반환값이 없음

    Docstring: 함수의 동작을 설명하는 문서
    IDE와 help() 함수에서 표시됨
    """
    print("Hello, World!")

def greet_person(name: str) -> str:
    """
    매개변수를 받고 값을 반환하는 함수

    Args:
        name: 인사할 사람의 이름

    Returns:
        인사 메시지 문자열

    실무 팁: Google Style 또는 NumPy Style docstring 사용 권장
    """
    return f"Hello, {name}!"

# ============================================================================
# 2. 매개변수 (Parameters) 다루기
# ============================================================================

# 2.1 위치 인자 (Positional Arguments)
def add(a: int, b: int) -> int:
    """순서대로 전달되는 인자"""
    return a + b

# 2.2 키워드 인자 (Keyword Arguments)
def create_user(name: str, age: int, city: str) -> dict:
    """함수 호출 시 매개변수 이름을 명시할 수 있음"""
    return {
        "name": name,
        "age": age,
        "city": city
    }

# 호출 방법:
# create_user("Alice", 30, "Seoul")              # 위치 인자
# create_user(name="Alice", age=30, city="Seoul") # 키워드 인자
# create_user("Alice", age=30, city="Seoul")      # 혼합 (위치 인자가 먼저!)

# 2.3 기본값 매개변수 (Default Parameters)
def greet_with_title(name: str, title: str = "씨") -> str:
    """
    기본값이 있는 매개변수

    실무 팁: 기본값은 함수 정의 시 한 번만 평가됨
    """
    return f"{name}{title}"

# 주의: 가변 객체를 기본값으로 사용하지 말 것!
def bad_append(item, items=[]):  # Bad!
    """
    위험한 패턴: 가변 기본값

    문제: 기본값 리스트가 함수 호출 간 공유됨
    """
    items.append(item)
    return items

def good_append(item, items=None):  # Good!
    """
    올바른 패턴: None을 기본값으로 사용
    """
    if items is None:
        items = []
    items.append(item)
    return items

# 2.4 가변 인자 (*args)
def sum_all(*numbers: int) -> int:
    """
    임의 개수의 위치 인자를 받음

    *args는 튜플로 전달됨
    """
    return sum(numbers)

# 호출: sum_all(1, 2, 3, 4, 5) -> 15

# 2.5 키워드 가변 인자 (**kwargs)
def print_user_info(**kwargs):
    """
    임의 개수의 키워드 인자를 받음

    **kwargs는 딕셔너리로 전달됨
    """
    for key, value in kwargs.items():
        print(f"{key}: {value}")

# 호출: print_user_info(name="Alice", age=30, city="Seoul")

# 2.6 모든 매개변수 타입 조합
def complex_function(
    pos1: str,                    # 1. 위치 인자 (필수)
    pos2: str,                    # 2. 위치 인자 (필수)
    *args: int,                   # 3. 가변 위치 인자
    kw1: str = "default",         # 4. 키워드 전용 인자 (기본값)
    kw2: Optional[str] = None,    # 5. 키워드 전용 인자 (선택)
    **kwargs: Any                 # 6. 가변 키워드 인자
):
    """
    모든 매개변수 타입을 보여주는 예제

    실무 팁: 매개변수 순서는 항상 위와 같아야 함
    """
    print(f"위치 인자: {pos1}, {pos2}")
    print(f"가변 위치 인자: {args}")
    print(f"키워드 인자: {kw1}, {kw2}")
    print(f"가변 키워드 인자: {kwargs}")

# 2.7 키워드 전용 인자 (Keyword-Only Arguments) - Python 3+
def safe_divide(*, dividend: float, divisor: float) -> float:
    """
    * 이후의 인자는 반드시 키워드로 전달해야 함

    실무 팁: API 설계 시 명확성을 위해 사용
    잘못된 인자 순서 방지
    """
    if divisor == 0:
        raise ValueError("0으로 나눌 수 없습니다")
    return dividend / divisor

# 호출: safe_divide(dividend=10, divisor=2) ✓
# 호출: safe_divide(10, 2) ✗ TypeError

# 2.8 위치 전용 인자 (Positional-Only Arguments) - Python 3.8+
def power(base, exponent, /):
    """
    / 이전의 인자는 반드시 위치로만 전달해야 함

    실무 팁: 매개변수 이름이 의미 없거나
    내부 구현을 숨기고 싶을 때 사용
    """
    return base ** exponent

# 호출: power(2, 3) ✓
# 호출: power(base=2, exponent=3) ✗ TypeError

# ============================================================================
# 3. 반환값 (Return Values)
# ============================================================================

# 3.1 여러 값 반환 (튜플 언패킹)
def get_min_max(numbers: List[int]) -> tuple[int, int]:
    """
    여러 값을 튜플로 반환

    실무에서 매우 자주 사용하는 패턴
    """
    return min(numbers), max(numbers)

# 사용: min_val, max_val = get_min_max([1, 2, 3, 4, 5])

# 3.2 조기 반환 (Early Return)
def process_payment(amount: float, balance: float) -> tuple[bool, str]:
    """
    조기 반환으로 중첩 if 제거

    실무 팁: Guard Clause 패턴
    """
    if amount <= 0:
        return False, "금액은 양수여야 합니다"

    if balance < amount:
        return False, "잔액이 부족합니다"

    # 실제 처리 로직
    new_balance = balance - amount
    return True, f"결제 완료. 잔액: {new_balance}"

# 3.3 None 반환 (명시적 vs 암묵적)
def find_user(user_id: int) -> Optional[dict]:
    """
    찾지 못하면 None 반환

    실무 팁: Optional 타입 힌트로 명시
    """
    # 사용자 찾기 로직...
    if user_id < 0:
        return None  # 명시적 반환

    # 암묵적으로 None 반환 (return 문 없음)
    # return None과 동일

# ============================================================================
# 4. 함수는 일급 객체 (First-Class Object)
# ============================================================================

# Python에서 함수는:
# 1. 변수에 할당 가능
# 2. 다른 함수의 인자로 전달 가능
# 3. 다른 함수의 반환값으로 사용 가능
# 4. 자료구조에 저장 가능

# 4.1 함수를 변수에 할당
def square(x: int) -> int:
    return x * x

my_function = square
print(my_function(5))  # 25

# 4.2 함수를 인자로 전달 (Higher-Order Function)
def apply_operation(x: int, operation: Callable[[int], int]) -> int:
    """
    다른 함수를 인자로 받는 고차 함수

    실무 팁: 콜백 패턴, 전략 패턴 구현에 사용
    """
    return operation(x)

result = apply_operation(5, square)  # 25

# 4.3 함수를 반환값으로 사용
def create_multiplier(factor: int) -> Callable[[int], int]:
    """
    함수를 반환하는 함수 (함수 팩토리)
    """
    def multiplier(x: int) -> int:
        return x * factor
    return multiplier

times_two = create_multiplier(2)
times_three = create_multiplier(3)

print(times_two(5))    # 10
print(times_three(5))  # 15

# 4.4 함수를 리스트에 저장
operations = [
    lambda x: x + 1,
    lambda x: x * 2,
    lambda x: x ** 2
]

for op in operations:
    print(op(5))  # 6, 10, 25

# ============================================================================
# 5. 람다 함수 (Lambda Functions)
# ============================================================================

# 람다 함수: 이름 없는 간단한 함수
# 문법: lambda 매개변수: 표현식

# 5.1 기본 람다 함수
add = lambda x, y: x + y
print(add(3, 5))  # 8

# 실무 팁: 간단한 경우만 람다 사용
# 복잡한 로직은 일반 함수로!

# 5.2 람다 함수 활용 (정렬)
users = [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25},
    {"name": "Charlie", "age": 35}
]

# 나이 순 정렬
sorted_by_age = sorted(users, key=lambda user: user["age"])

# 이름 순 정렬
sorted_by_name = sorted(users, key=lambda user: user["name"])

# 5.3 람다 함수 활용 (필터링)
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# 짝수만 필터
even_numbers = list(filter(lambda x: x % 2 == 0, numbers))

# 5보다 큰 수만
greater_than_five = list(filter(lambda x: x > 5, numbers))

# 5.4 람다 함수 활용 (매핑)
# 각 요소를 제곱
squared = list(map(lambda x: x ** 2, numbers))

# ============================================================================
# 6. 스코프와 클로저 (Scope and Closures)
# ============================================================================

# 6.1 스코프 (변수의 유효 범위)
# LEGB 규칙: Local -> Enclosing -> Global -> Built-in

x = "global"  # 전역 변수

def outer_function():
    x = "enclosing"  # enclosing 변수

    def inner_function():
        x = "local"  # 지역 변수
        print(f"inner: {x}")  # local

    inner_function()
    print(f"outer: {x}")  # enclosing

outer_function()
print(f"global: {x}")  # global

# 6.2 global 키워드
counter = 0

def increment_bad():
    counter = counter + 1  # UnboundLocalError!
    # 지역 변수로 인식되지만 할당 전에 참조

def increment_good():
    global counter  # 전역 변수 사용 선언
    counter = counter + 1

# 실무 팁: global 사용은 지양 (side effect 발생)
# 대신 클래스나 함수 인자/반환값 활용

# 6.3 nonlocal 키워드
def outer():
    count = 0

    def inner():
        nonlocal count  # 바깥 함수의 변수 수정
        count += 1
        return count

    return inner

counter_func = outer()
print(counter_func())  # 1
print(counter_func())  # 2
print(counter_func())  # 3

# 6.4 클로저 (Closure)
def create_counter(initial: int = 0):
    """
    클로저: 내부 함수가 외부 함수의 변수를 기억

    실무 활용:
    - 상태를 가진 함수 생성
    - 데이터 은닉
    - 함수 팩토리 패턴
    """
    count = initial

    def increment():
        nonlocal count
        count += 1
        return count

    def decrement():
        nonlocal count
        count -= 1
        return count

    def get_count():
        return count

    return increment, decrement, get_count

inc, dec, get = create_counter(10)
print(inc())  # 11
print(inc())  # 12
print(dec())  # 11
print(get())  # 11

# ============================================================================
# 7. 데코레이터 기초 (Decorators)
# ============================================================================

# 데코레이터: 함수를 수정하지 않고 기능을 추가
# 실무에서 매우 자주 사용 (로깅, 인증, 캐싱 등)

# 7.1 간단한 데코레이터
def simple_decorator(func):
    """함수를 감싸서 기능 추가"""
    def wrapper():
        print("함수 실행 전")
        func()
        print("함수 실행 후")
    return wrapper

@simple_decorator  # 데코레이터 적용
def say_hello():
    print("Hello!")

# say_hello() 호출 시:
# 함수 실행 전
# Hello!
# 함수 실행 후

# 7.2 인자를 받는 데코레이터
def decorator_with_args(func):
    """인자를 받는 함수를 위한 데코레이터"""
    def wrapper(*args, **kwargs):
        print(f"함수 호출: {func.__name__}")
        result = func(*args, **kwargs)
        print(f"반환값: {result}")
        return result
    return wrapper

@decorator_with_args
def add_numbers(a: int, b: int) -> int:
    return a + b

# 7.3 실용적인 데코레이터 예제: 실행 시간 측정
def measure_time(func):
    """함수 실행 시간을 측정하는 데코레이터"""
    @wraps(func)  # 원본 함수의 메타데이터 보존
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} 실행 시간: {end_time - start_time:.4f}초")
        return result
    return wrapper

@measure_time
def slow_function():
    time.sleep(1)
    return "완료"

# 7.4 매개변수를 받는 데코레이터
def repeat(times: int):
    """함수를 여러 번 실행하는 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def greet_loudly():
    print("HELLO!")

# ============================================================================
# 8. 함수형 프로그래밍 도구
# ============================================================================

# 8.1 map() - 각 요소에 함수 적용
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
# [1, 4, 9, 16, 25]

# 8.2 filter() - 조건을 만족하는 요소만 선택
even = list(filter(lambda x: x % 2 == 0, numbers))
# [2, 4]

# 8.3 reduce() - 누적 연산
from functools import reduce
sum_all = reduce(lambda acc, x: acc + x, numbers)
# 15 (1+2+3+4+5)

# 실무 팁: map, filter보다 리스트 컴프리헨션이 더 Pythonic
# squared = [x ** 2 for x in numbers]
# even = [x for x in numbers if x % 2 == 0]

# 8.4 partial() - 부분 적용 함수
def power(base: int, exponent: int) -> int:
    return base ** exponent

square_func = partial(power, exponent=2)
cube_func = partial(power, exponent=3)

print(square_func(5))  # 25
print(cube_func(5))    # 125

# ============================================================================
# 9. 제네릭 함수 (Generic Functions)
# ============================================================================

T = TypeVar('T')

def first_element(items: List[T]) -> Optional[T]:
    """
    제네릭 함수: 다양한 타입에 대응

    실무 팁: 타입 안정성을 유지하면서 재사용성 향상
    """
    return items[0] if items else None

# 문자열 리스트
names = ["Alice", "Bob", "Charlie"]
first_name = first_element(names)  # 타입: Optional[str]

# 정수 리스트
numbers = [1, 2, 3]
first_num = first_element(numbers)  # 타입: Optional[int]

# ============================================================================
# 10. 실전 예제: 캐싱 데코레이터
# ============================================================================

def memoize(func):
    """
    함수 결과를 캐싱하는 데코레이터

    실무 활용: 계산 비용이 큰 함수 최적화
    (피보나치, 데이터베이스 조회 등)
    """
    cache = {}

    @wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]

    return wrapper

@memoize
def fibonacci(n: int) -> int:
    """피보나치 수열 (캐싱 버전)"""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# 캐싱으로 인해 매우 빠름
print(fibonacci(100))

# Python 표준 라이브러리의 lru_cache 사용 권장
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci_optimized(n: int) -> int:
    if n < 2:
        return n
    return fibonacci_optimized(n - 1) + fibonacci_optimized(n - 2)

# ============================================================================
# 연습 문제
# ============================================================================

def practice_exercises():
    """연습 문제를 풀어보세요"""

    # 문제 1: 가변 인자를 받아 평균을 계산하는 함수
    def calculate_average(*numbers: float) -> float:
        # 여기에 코드 작성
        pass

    # 문제 2: 함수를 n번 실행하는 고차 함수
    def execute_n_times(func: Callable, n: int):
        # 여기에 코드 작성
        pass

    # 문제 3: 리스트의 각 요소에 함수를 적용하는 함수 (map 직접 구현)
    def my_map(func: Callable, items: List) -> List:
        # 여기에 코드 작성
        pass

    # 문제 4: 조건을 만족하는 요소만 반환하는 함수 (filter 직접 구현)
    def my_filter(predicate: Callable, items: List) -> List:
        # 여기에 코드 작성
        pass

    # 문제 5: 함수 실행 횟수를 세는 데코레이터
    def count_calls(func):
        # 여기에 코드 작성
        pass

    # 문제 6: 클로저를 이용한 은행 계좌 구현
    def create_bank_account(initial_balance: float):
        # deposit, withdraw, get_balance 함수를 반환
        # 여기에 코드 작성
        pass


if __name__ == "__main__":
    print("=" * 80)
    print("Python 함수 학습")
    print("=" * 80)

    # 예제 실행
    print("\n클로저 예제:")
    inc, dec, get = create_counter(0)
    print(f"증가: {inc()}")
    print(f"증가: {inc()}")
    print(f"감소: {dec()}")
    print(f"현재값: {get()}")

    print("\n피보나치 (캐싱):")
    print(f"fibonacci(10) = {fibonacci(10)}")

    print("\n연습 문제를 풀어보세요!")
