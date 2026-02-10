"""
01_variables_and_types.py

Python 변수와 자료형: 10년차 시니어 개발자의 관점

이 파일은 Python의 변수와 자료형에 대한 포괄적인 이해를 제공합니다.
단순히 문법을 배우는 것이 아니라, '왜' 그렇게 설계되었는지,
실무에서 어떻게 활용하는지를 중심으로 설명합니다.

학습 목표:
1. Python의 동적 타이핑 시스템 이해
2. 다양한 자료형의 특성과 용도 파악
3. 메모리 효율적인 자료구조 선택
4. 타입 힌트를 활용한 코드 가독성 향상
"""

# ============================================================================
# 1. 변수와 동적 타이핑 (Variables and Dynamic Typing)
# ============================================================================

# Python의 변수는 '값의 라벨'입니다.
# C나 Java와 달리 변수 선언 시 타입을 명시하지 않습니다.
# 이를 '동적 타이핑(Dynamic Typing)'이라고 합니다.

# 변수 할당 - 실제로는 객체에 이름을 붙이는 것
name = "Django"  # 문자열 객체에 'name'이라는 이름을 붙임
age = 10        # 정수 객체에 'age'라는 이름을 붙임

# Python의 모든 것은 객체입니다 (Everything is an object)
# 심지어 숫자, 함수, 클래스도 객체입니다.
print(type(name))  # <class 'str'>
print(type(age))   # <class 'int'>

# 동적 타이핑: 같은 변수에 다른 타입의 값을 할당 가능
# 실무에서는 지양해야 할 패턴입니다. 코드의 가독성과 유지보수성을 떨어뜨립니다.
x = 100        # x는 정수
x = "hello"    # 이제 x는 문자열 (이렇게 하지 마세요!)

# 변수 네이밍 컨벤션 (PEP 8 스타일 가이드)
# - snake_case 사용 (소문자와 언더스코어)
# - 의미 있는 이름 사용
user_name = "John"           # Good: 명확한 의미
un = "John"                  # Bad: 의미 불명확
MAX_CONNECTIONS = 100        # 상수는 대문자와 언더스코어
_internal_var = "private"    # 언더스코어로 시작: 내부 사용 변수

# ============================================================================
# 2. 숫자형 (Numeric Types)
# ============================================================================

# 2.1 정수 (Integer)
# Python 3에서는 정수 크기 제한이 없습니다 (메모리가 허용하는 한)
small_number = 42
large_number = 12345678901234567890  # 아주 큰 숫자도 OK

# 다양한 진법 표현
binary = 0b1010      # 2진수: 10
octal = 0o12         # 8진수: 10
hexadecimal = 0xA    # 16진수: 10

# 실무 팁: 큰 숫자의 가독성을 위해 언더스코어 사용
one_million = 1_000_000  # Python 3.6+
print(f"백만: {one_million:,}")  # 출력: 백만: 1,000,000

# 2.2 부동소수점 (Float)
# IEEE 754 표준을 따르며, 정밀도 한계가 있습니다
price = 19.99
scientific = 1.5e-4  # 과학적 표기법: 0.00015

# 주의: 부동소수점 연산의 정밀도 문제
# 금융 계산 등에서는 decimal 모듈 사용 권장
print(0.1 + 0.2)  # 0.30000000000000004 (예상과 다름!)

# 해결책: decimal 모듈 사용
from decimal import Decimal
accurate_sum = Decimal('0.1') + Decimal('0.2')
print(accurate_sum)  # 0.3 (정확함)

# 2.3 복소수 (Complex)
# 과학 계산이나 신호 처리에서 사용
complex_num = 3 + 4j
print(complex_num.real)  # 3.0 (실수부)
print(complex_num.imag)  # 4.0 (허수부)

# ============================================================================
# 3. 문자열 (String)
# ============================================================================

# 문자열은 불변(immutable) 객체입니다
# 한번 생성되면 내용을 변경할 수 없습니다

# 3.1 문자열 생성 방법
single_quote = 'Hello'
double_quote = "World"
triple_quote = """여러 줄
문자열을
표현할 때 사용"""

# 3.2 문자열 포매팅 (여러 방법이 있지만 f-string 권장)
name = "Alice"
age = 30

# 방법 1: % 포매팅 (구식, 지양)
old_style = "이름: %s, 나이: %d" % (name, age)

# 방법 2: .format() (Python 2.6+)
format_style = "이름: {}, 나이: {}".format(name, age)

# 방법 3: f-string (Python 3.6+, 권장!)
# 가장 읽기 쉽고 성능도 좋습니다
modern_style = f"이름: {name}, 나이: {age}"
print(modern_style)

# f-string의 강력함: 표현식도 사용 가능
print(f"내년 나이: {age + 1}")
print(f"이름 길이: {len(name)}")

# 3.3 문자열 메서드 (실무에서 자주 사용)
text = "  Python Programming  "

# 공백 제거 (API 응답 처리 시 유용)
cleaned = text.strip()  # 양쪽 공백 제거
print(f"'{cleaned}'")

# 대소문자 변환 (이메일 정규화 등에 사용)
email = "User@Example.COM"
normalized_email = email.lower()  # "user@example.com"

# 문자열 분리와 결합 (CSV 처리 등)
csv_line = "Alice,30,Engineer"
fields = csv_line.split(',')  # ['Alice', '30', 'Engineer']
joined = " | ".join(fields)   # "Alice | 30 | Engineer"

# 문자열 검색
if "Python" in text:
    print("Python이 포함되어 있습니다")

# 3.4 문자열은 불변이므로 연결 시 주의
# Bad: 반복문에서 문자열 연결 (O(n^2) 복잡도)
result = ""
for i in range(1000):
    result += str(i)  # 매번 새 문자열 객체 생성!

# Good: 리스트로 모아서 한 번에 join (O(n) 복잡도)
numbers = []
for i in range(1000):
    numbers.append(str(i))
result = "".join(numbers)

# ============================================================================
# 4. 불린 (Boolean)
# ============================================================================

# True와 False (대문자 주의!)
is_active = True
is_deleted = False

# 불린 연산
print(True and False)  # False
print(True or False)   # True
print(not True)        # False

# Falsy 값들: Python에서 False로 평가되는 값들
# 0, 0.0, "", [], {}, (), None, False
if not []:
    print("빈 리스트는 False입니다")

# Truthy 값들: 나머지는 모두 True
if [1, 2, 3]:
    print("비어있지 않은 리스트는 True입니다")

# 실무 팁: 명시적 비교보다 암묵적 불린 평가 활용
users = []

# Bad: 길고 불명확
if len(users) == 0:
    print("사용자 없음")

# Good: 간결하고 Pythonic
if not users:
    print("사용자 없음")

# ============================================================================
# 5. 리스트 (List) - 가변 순서형 컬렉션
# ============================================================================

# 리스트는 가변(mutable)이며 순서가 있는 컬렉션입니다
# 다양한 타입의 요소를 담을 수 있지만, 실무에서는 같은 타입 권장

# 5.1 리스트 생성
fruits = ["apple", "banana", "cherry"]
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14, True]  # 가능하지만 권장하지 않음

# 빈 리스트 생성
empty_list = []
empty_list2 = list()

# 5.2 리스트 인덱싱과 슬라이싱
# 인덱스는 0부터 시작
print(fruits[0])   # "apple"
print(fruits[-1])  # "cherry" (음수는 뒤에서부터)

# 슬라이싱: [시작:끝:간격]
print(numbers[1:4])    # [2, 3, 4] (1번 인덱스부터 3번까지)
print(numbers[:3])     # [1, 2, 3] (처음부터 2번까지)
print(numbers[::2])    # [1, 3, 5] (2칸씩 건너뛰기)
print(numbers[::-1])   # [5, 4, 3, 2, 1] (역순)

# 5.3 리스트 수정 (가변 객체의 특성)
fruits.append("orange")       # 끝에 추가
fruits.insert(1, "mango")     # 특정 위치에 삽입
fruits.remove("banana")       # 값으로 삭제
popped = fruits.pop()         # 마지막 요소 제거하고 반환
fruits[0] = "apricot"        # 인덱스로 수정

# 5.4 리스트 연산
list1 = [1, 2, 3]
list2 = [4, 5, 6]
combined = list1 + list2      # [1, 2, 3, 4, 5, 6]
repeated = list1 * 3          # [1, 2, 3, 1, 2, 3, 1, 2, 3]

# 5.5 유용한 리스트 메서드
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
numbers.sort()                # 제자리 정렬 (원본 변경)
sorted_nums = sorted(numbers) # 새 정렬된 리스트 반환 (원본 유지)
numbers.reverse()             # 역순 정렬
print(numbers.count(1))       # 1의 개수: 2
print(numbers.index(5))       # 5의 인덱스 찾기

# 실무 팁: 리스트 복사 주의
original = [1, 2, 3]
shallow_copy = original       # 참조 복사 (같은 객체를 가리킴)
shallow_copy.append(4)
print(original)               # [1, 2, 3, 4] (원본도 변경됨!)

# 올바른 복사 방법
deep_copy = original.copy()   # 또는 original[:]
deep_copy.append(5)
print(original)               # [1, 2, 3, 4] (원본 유지)

# ============================================================================
# 6. 튜플 (Tuple) - 불변 순서형 컬렉션
# ============================================================================

# 튜플은 불변(immutable)이며 순서가 있는 컬렉션입니다
# 한번 생성되면 수정할 수 없습니다

# 6.1 튜플 생성
coordinates = (10, 20)
single_item = (42,)  # 주의: 단일 요소 튜플은 쉼표 필요!
rgb = (255, 128, 0)

# 괄호 생략 가능 (실제로는 쉼표가 튜플을 만듦)
point = 3, 4
print(type(point))  # <class 'tuple'>

# 6.2 튜플의 장점
# 1. 리스트보다 메모리 효율적
# 2. 해시 가능 (딕셔너리 키로 사용 가능)
# 3. 의도치 않은 수정 방지

# 6.3 튜플 언패킹 (Tuple Unpacking)
# 실무에서 매우 유용한 패턴
x, y = coordinates  # x=10, y=20
print(f"x: {x}, y: {y}")

# 함수에서 여러 값 반환 시 사용
def get_user_info():
    return "Alice", 30, "alice@example.com"

name, age, email = get_user_info()

# 값 교환도 간단
a, b = 1, 2
a, b = b, a  # 값 교환 (임시 변수 불필요!)

# 확장 언패킹 (Python 3)
first, *rest, last = [1, 2, 3, 4, 5]
print(first)  # 1
print(rest)   # [2, 3, 4]
print(last)   # 5

# ============================================================================
# 7. 딕셔너리 (Dictionary) - 키-값 쌍의 컬렉션
# ============================================================================

# 딕셔너리는 가변이며 순서가 있는(Python 3.7+) 키-값 쌍의 컬렉션
# 해시 테이블로 구현되어 O(1) 시간 복잡도로 조회 가능

# 7.1 딕셔너리 생성
user = {
    "name": "Alice",
    "age": 30,
    "email": "alice@example.com",
    "is_active": True
}

# 빈 딕셔너리
empty_dict = {}
empty_dict2 = dict()

# dict() 생성자 활용
user2 = dict(name="Bob", age=25)

# 7.2 딕셔너리 접근과 수정
print(user["name"])        # "Alice"
user["age"] = 31           # 수정
user["city"] = "Seoul"     # 새 키 추가

# 안전한 접근: get() 메서드 (KeyError 방지)
print(user.get("phone"))   # None (키가 없으면)
print(user.get("phone", "번호 없음"))  # 기본값 지정

# 7.3 딕셔너리 메서드
keys = user.keys()         # dict_keys(['name', 'age', ...])
values = user.values()     # dict_values(['Alice', 31, ...])
items = user.items()       # dict_items([('name', 'Alice'), ...])

# 7.4 딕셔너리 순회
for key in user:
    print(f"{key}: {user[key]}")

# 더 나은 방법: items() 사용
for key, value in user.items():
    print(f"{key}: {value}")

# 7.5 딕셔너리 병합 (Python 3.9+)
default_settings = {"theme": "dark", "language": "ko"}
user_settings = {"language": "en", "font_size": 14}

# 방법 1: update() (원본 수정)
default_settings.update(user_settings)

# 방법 2: | 연산자 (Python 3.9+, 새 딕셔너리 생성)
merged = default_settings | user_settings

# 방법 3: ** 언패킹
merged = {**default_settings, **user_settings}

# 실무 팁: setdefault()와 defaultdict
# 키가 없을 때 기본값 설정하며 추가
user.setdefault("hobbies", []).append("reading")

from collections import defaultdict
word_count = defaultdict(int)  # 기본값이 0인 딕셔너리
for word in ["apple", "banana", "apple"]:
    word_count[word] += 1  # KeyError 없이 바로 증가 가능

# ============================================================================
# 8. 집합 (Set) - 중복 없는 컬렉션
# ============================================================================

# 집합은 중복을 허용하지 않으며 순서가 없는 컬렉션
# 수학의 집합 연산 지원

# 8.1 집합 생성
numbers = {1, 2, 3, 4, 5}
fruits = {"apple", "banana", "cherry"}

# 빈 집합 (주의: {}는 빈 딕셔너리!)
empty_set = set()

# 리스트에서 중복 제거
duplicates = [1, 2, 2, 3, 3, 3, 4]
unique = set(duplicates)  # {1, 2, 3, 4}

# 8.2 집합 연산
set1 = {1, 2, 3, 4}
set2 = {3, 4, 5, 6}

union = set1 | set2           # 합집합: {1, 2, 3, 4, 5, 6}
intersection = set1 & set2    # 교집합: {3, 4}
difference = set1 - set2      # 차집합: {1, 2}
symmetric_diff = set1 ^ set2  # 대칭 차집합: {1, 2, 5, 6}

# 8.3 집합 메서드
fruits.add("orange")          # 요소 추가
fruits.remove("banana")       # 요소 제거 (없으면 KeyError)
fruits.discard("grape")       # 요소 제거 (없어도 에러 없음)

# 8.4 실무 활용: 멤버십 테스트
# 리스트보다 집합이 훨씬 빠름 (O(1) vs O(n))
valid_users = {"alice", "bob", "charlie"}
if "alice" in valid_users:  # 매우 빠른 조회
    print("인증된 사용자")

# ============================================================================
# 9. None 타입
# ============================================================================

# None은 '값이 없음'을 나타내는 특별한 객체
# Java의 null, JavaScript의 null/undefined와 유사

result = None
print(type(result))  # <class 'NoneType'>

# 함수에서 명시적 반환이 없으면 None 반환
def no_return():
    pass

print(no_return())  # None

# None 체크 (is 사용 권장)
if result is None:
    print("결과가 없습니다")

# Bad: == 사용
if result == None:  # 동작하지만 권장하지 않음
    pass

# Good: is 사용
if result is None:  # Pythonic!
    pass

# ============================================================================
# 10. 타입 힌트 (Type Hints) - Python 3.5+
# ============================================================================

# 타입 힌트는 코드의 가독성과 유지보수성을 높입니다
# 실행 시간에는 영향을 주지 않지만, IDE와 타입 체커가 활용

from typing import List, Dict, Optional, Union, Tuple

# 함수의 매개변수와 반환값에 타입 명시
def greet(name: str, age: int) -> str:
    return f"Hello, {name}! You are {age} years old."

# 컬렉션 타입 힌트
def process_numbers(numbers: List[int]) -> int:
    return sum(numbers)

# Optional: None일 수 있는 값
def find_user(user_id: int) -> Optional[Dict[str, str]]:
    # 사용자를 찾으면 dict 반환, 못 찾으면 None
    return None

# Union: 여러 타입 중 하나
def process_id(user_id: Union[int, str]) -> str:
    return str(user_id)

# 타입 별칭으로 복잡한 타입 간결하게
User = Dict[str, Union[str, int]]

def create_user(name: str, age: int) -> User:
    return {"name": name, "age": age}

# ============================================================================
# 11. 타입 변환
# ============================================================================

# 명시적 타입 변환
age_str = "30"
age_int = int(age_str)      # 문자열 -> 정수
price_float = float("19.99") # 문자열 -> 실수
number_str = str(42)        # 정수 -> 문자열

# 리스트, 튜플, 집합 간 변환
my_list = [1, 2, 3]
my_tuple = tuple(my_list)   # 리스트 -> 튜플
my_set = set(my_list)       # 리스트 -> 집합

# 주의: 변환 실패 시 예외 발생
try:
    invalid = int("hello")  # ValueError 발생!
except ValueError as e:
    print(f"변환 실패: {e}")

# ============================================================================
# 실무 Best Practices
# ============================================================================

# 1. 불변 타입을 우선 사용
# - 튜플 > 리스트 (변경이 필요 없다면)
# - frozenset > set (변경이 필요 없다면)

# 2. 적절한 자료구조 선택
# - 순서가 중요하고 중복 허용: list
# - 순서가 중요하고 불변: tuple
# - 중복 제거와 집합 연산: set
# - 키-값 매핑: dict

# 3. 타입 힌트 사용
# - 코드 의도를 명확하게
# - IDE의 자동완성 지원
# - mypy 같은 타입 체커로 버그 조기 발견

# 4. 의미 있는 변수명
user_age = 30           # Good
x = 30                  # Bad

# 5. 상수는 대문자로
MAX_RETRIES = 3
API_TIMEOUT = 30

# ============================================================================
# 연습 문제
# ============================================================================

def practice_exercises():
    """
    연습 문제: 아래 문제들을 풀어보세요.
    """

    # 문제 1: 리스트에서 중복 제거 후 정렬된 리스트 반환
    def remove_duplicates_and_sort(numbers: List[int]) -> List[int]:
        # 여기에 코드 작성
        pass

    # 문제 2: 두 딕셔너리를 병합하되, 중복 키는 두 번째 딕셔너리 값 사용
    def merge_dicts(dict1: Dict, dict2: Dict) -> Dict:
        # 여기에 코드 작성
        pass

    # 문제 3: 문자열에서 각 단어의 빈도수를 딕셔너리로 반환
    def word_frequency(text: str) -> Dict[str, int]:
        # 여기에 코드 작성
        pass

    # 문제 4: 리스트의 리스트를 평탄화 (flatten)
    def flatten_list(nested_list: List[List[int]]) -> List[int]:
        # 예: [[1, 2], [3, 4]] -> [1, 2, 3, 4]
        # 여기에 코드 작성
        pass

    # 문제 5: 두 리스트에서 공통 요소와 고유 요소 찾기
    def find_common_and_unique(list1: List[int], list2: List[int]) -> Tuple[List[int], List[int], List[int]]:
        # 반환: (공통 요소, list1만의 요소, list2만의 요소)
        # 여기에 코드 작성
        pass


# 메인 실행
if __name__ == "__main__":
    print("=" * 80)
    print("Python 변수와 자료형 학습을 시작합니다!")
    print("=" * 80)

    # 각 섹션의 코드를 실행하면서 결과를 확인하세요
    print("\n타입 힌트 예제:")
    print(greet("Alice", 30))

    print("\n연습 문제를 풀어보세요!")
    print("practice_exercises() 함수의 각 문제를 구현해보세요.")
