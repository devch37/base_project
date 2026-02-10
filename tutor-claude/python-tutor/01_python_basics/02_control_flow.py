"""
02_control_flow.py

Python 제어문: 조건문, 반복문, 예외 처리

프로그램의 흐름을 제어하는 다양한 방법을 학습합니다.
단순히 문법을 넘어서, 실무에서 자주 마주치는 패턴과
효율적인 제어 흐름 설계 방법을 다룹니다.

학습 목표:
1. 조건문을 활용한 의사결정 로직 구현
2. 다양한 반복문 패턴 이해
3. 예외 처리를 통한 안정적인 코드 작성
4. Pythonic한 제어 흐름 패턴 습득
"""

from typing import List, Optional
import random

# ============================================================================
# 1. 조건문 (Conditional Statements)
# ============================================================================

# 1.1 기본 if-elif-else 구조
def check_age(age: int) -> str:
    """
    나이에 따른 분류

    실무 팁: 조건문은 가장 구체적인 조건부터 먼저 확인
    """
    if age < 0:
        return "유효하지 않은 나이"
    elif age < 13:
        return "어린이"
    elif age < 20:
        return "청소년"
    elif age < 65:
        return "성인"
    else:
        return "노인"

# 1.2 삼항 연산자 (Ternary Operator)
# 간단한 조건문을 한 줄로 표현
def get_status(is_active: bool) -> str:
    # 전통적 방식
    if is_active:
        status = "활성"
    else:
        status = "비활성"

    # Pythonic 방식 (삼항 연산자)
    status = "활성" if is_active else "비활성"

    return status

# 1.3 복합 조건문
def can_access_content(age: int, is_premium: bool, is_verified: bool) -> bool:
    """
    복잡한 비즈니스 로직을 조건문으로 표현

    실무 팁: 복잡한 조건은 변수로 추출하여 가독성 향상
    """
    # Bad: 읽기 어려운 복잡한 조건
    if age >= 18 and (is_premium or is_verified) and age < 65:
        return True

    # Good: 의미 있는 변수로 분리
    is_adult = age >= 18
    has_access_rights = is_premium or is_verified
    is_not_senior = age < 65

    return is_adult and has_access_rights and is_not_senior

# 1.4 단축 평가 (Short-circuit Evaluation)
def safe_divide(a: float, b: float) -> Optional[float]:
    """
    단축 평가를 활용한 안전한 나눗셈

    and: 왼쪽이 False면 오른쪽 평가 안 함
    or: 왼쪽이 True면 오른쪽 평가 안 함
    """
    # b가 0이면 두 번째 조건 평가하지 않음
    return (a / b) if b != 0 else None

# 1.5 match-case (Python 3.10+)
# Switch-case와 유사하지만 더 강력함 (패턴 매칭)
def handle_http_status(status_code: int) -> str:
    """
    HTTP 상태 코드에 따른 처리

    Python 3.10부터 지원되는 구조적 패턴 매칭
    """
    match status_code:
        case 200:
            return "성공"
        case 201:
            return "생성됨"
        case 400:
            return "잘못된 요청"
        case 401 | 403:  # 여러 값 매칭
            return "인증 오류"
        case 404:
            return "찾을 수 없음"
        case 500:
            return "서버 오류"
        case _:  # default
            return "알 수 없는 상태"

# ============================================================================
# 2. 반복문 (Loops)
# ============================================================================

# 2.1 for 루프 - 시퀀스 순회
def demonstrate_for_loops():
    """for 루프의 다양한 사용 패턴"""

    # 기본 리스트 순회
    fruits = ["apple", "banana", "cherry"]
    for fruit in fruits:
        print(f"과일: {fruit}")

    # 인덱스와 함께 순회: enumerate()
    for index, fruit in enumerate(fruits):
        print(f"{index}: {fruit}")

    # 특정 번호부터 시작
    for index, fruit in enumerate(fruits, start=1):
        print(f"{index}번째: {fruit}")

    # 딕셔너리 순회
    user = {"name": "Alice", "age": 30, "city": "Seoul"}

    # 키만
    for key in user:
        print(f"키: {key}")

    # 키와 값 함께 (권장)
    for key, value in user.items():
        print(f"{key}: {value}")

    # 여러 리스트 동시 순회: zip()
    names = ["Alice", "Bob", "Charlie"]
    ages = [30, 25, 35]
    cities = ["Seoul", "Busan", "Incheon"]

    for name, age, city in zip(names, ages, cities):
        print(f"{name}({age})는 {city}에 산다")

    # range() 활용
    for i in range(5):          # 0, 1, 2, 3, 4
        print(i)

    for i in range(1, 6):       # 1, 2, 3, 4, 5
        print(i)

    for i in range(0, 10, 2):   # 0, 2, 4, 6, 8 (2씩 증가)
        print(i)

    # 역순 순회
    for i in range(5, 0, -1):   # 5, 4, 3, 2, 1
        print(i)

    # reversed() 활용
    for fruit in reversed(fruits):
        print(fruit)

# 2.2 while 루프 - 조건 기반 반복
def demonstrate_while_loops():
    """while 루프 사용 패턴"""

    # 기본 while
    count = 0
    while count < 5:
        print(f"카운트: {count}")
        count += 1

    # 무한 루프 (서버 등에서 사용)
    # while True:
    #     command = input("명령어 입력 (q: 종료): ")
    #     if command == 'q':
    #         break
    #     process_command(command)

# 2.3 break, continue, else
def find_prime_numbers(limit: int) -> List[int]:
    """
    break, continue, else 활용 예제

    실무 팁: for-else는 Python의 독특한 기능
    break로 중단되지 않고 정상 종료되면 else 블록 실행
    """
    primes = []

    for num in range(2, limit):
        # 소수 판별
        for divisor in range(2, int(num ** 0.5) + 1):
            if num % divisor == 0:
                break  # 약수 발견, 소수 아님
        else:
            # break되지 않음 = 소수
            primes.append(num)

    return primes

def skip_even_numbers():
    """continue를 활용한 특정 조건 건너뛰기"""
    for i in range(10):
        if i % 2 == 0:
            continue  # 짝수는 건너뛰기
        print(f"홀수: {i}")

# 2.4 중첩 루프와 레이블
def print_multiplication_table():
    """구구단 출력 - 중첩 루프 예제"""
    for i in range(2, 10):
        print(f"\n{i}단:")
        for j in range(1, 10):
            print(f"{i} x {j} = {i*j}")

def find_in_matrix(matrix: List[List[int]], target: int) -> Optional[tuple]:
    """
    2D 행렬에서 값 찾기 - 중첩 루프에서 break

    실무 팁: 중첩 루프에서 완전히 빠져나오려면
    플래그 변수나 함수로 분리하여 return 사용
    """
    for row_idx, row in enumerate(matrix):
        for col_idx, value in enumerate(row):
            if value == target:
                return (row_idx, col_idx)
    return None

# ============================================================================
# 3. 예외 처리 (Exception Handling)
# ============================================================================

# 3.1 기본 try-except
def safe_int_conversion(value: str) -> Optional[int]:
    """
    안전한 타입 변환

    실무 팁: 예외 처리는 예외적인 상황에만 사용
    일반적인 제어 흐름에 사용하지 말 것
    """
    try:
        return int(value)
    except ValueError:
        print(f"'{value}'를 정수로 변환할 수 없습니다")
        return None

# 3.2 여러 예외 처리
def divide_numbers(a: float, b: float) -> Optional[float]:
    """
    여러 예외를 처리하는 나눗셈
    """
    try:
        result = a / b
        return result
    except ZeroDivisionError:
        print("0으로 나눌 수 없습니다")
        return None
    except TypeError:
        print("숫자 타입이 아닙니다")
        return None
    except Exception as e:
        # 모든 예외를 잡는 일반 핸들러
        print(f"예상치 못한 오류: {e}")
        return None

# 3.3 try-except-else-finally
def read_file_safely(filename: str) -> Optional[str]:
    """
    파일 읽기 - 완전한 예외 처리 구조

    - try: 예외가 발생할 수 있는 코드
    - except: 예외 처리
    - else: 예외가 발생하지 않았을 때 실행
    - finally: 무조건 실행 (정리 작업)
    """
    file = None
    try:
        file = open(filename, 'r', encoding='utf-8')
        content = file.read()
        return content
    except FileNotFoundError:
        print(f"파일을 찾을 수 없음: {filename}")
        return None
    except PermissionError:
        print(f"파일 접근 권한 없음: {filename}")
        return None
    else:
        # 예외가 발생하지 않았을 때
        print("파일 읽기 성공")
    finally:
        # 무조건 실행 (파일 닫기)
        if file:
            file.close()
            print("파일 닫기 완료")

# 3.4 예외 발생시키기 (raise)
def validate_age(age: int) -> None:
    """
    나이 유효성 검사 - 커스텀 예외 발생

    실무 팁: 비즈니스 로직 검증은 명시적으로 예외 발생
    """
    if not isinstance(age, int):
        raise TypeError("나이는 정수여야 합니다")

    if age < 0:
        raise ValueError("나이는 0 이상이어야 합니다")

    if age > 150:
        raise ValueError("나이가 비현실적입니다")

# 3.5 커스텀 예외 클래스
class InvalidUserError(Exception):
    """사용자 정의 예외 클래스"""
    def __init__(self, user_id: int, message: str = "유효하지 않은 사용자"):
        self.user_id = user_id
        self.message = message
        super().__init__(self.message)

def get_user(user_id: int):
    """커스텀 예외 사용 예제"""
    if user_id < 0:
        raise InvalidUserError(user_id, "사용자 ID는 양수여야 합니다")
    # 사용자 조회 로직...

# 3.6 컨텍스트 매니저 (with 문)
def write_to_file_safe(filename: str, content: str):
    """
    컨텍스트 매니저를 활용한 안전한 파일 처리

    실무 팁: with 문 사용 권장
    - 자동으로 리소스 정리
    - 예외 발생해도 안전하게 닫힘
    """
    # Bad: 수동으로 파일 닫기 (예외 시 닫히지 않을 수 있음)
    # file = open(filename, 'w')
    # file.write(content)
    # file.close()

    # Good: with 문 사용 (자동으로 닫힘)
    try:
        with open(filename, 'w', encoding='utf-8') as file:
            file.write(content)
        print("파일 쓰기 성공")
    except IOError as e:
        print(f"파일 쓰기 실패: {e}")

# 여러 리소스를 동시에 관리
def copy_file(source: str, destination: str):
    """여러 파일을 동시에 with로 관리"""
    try:
        with open(source, 'r', encoding='utf-8') as src, \
             open(destination, 'w', encoding='utf-8') as dst:
            content = src.read()
            dst.write(content)
        print("파일 복사 완료")
    except IOError as e:
        print(f"파일 복사 실패: {e}")

# ============================================================================
# 4. 실무 패턴 (Practical Patterns)
# ============================================================================

# 4.1 조기 반환 (Early Return) 패턴
def process_user_data(user_data: Optional[dict]) -> bool:
    """
    조기 반환 패턴 - 중첩 if를 줄여 가독성 향상

    Guard Clause 패턴이라고도 함
    """
    # Bad: 중첩된 if
    # if user_data is not None:
    #     if 'id' in user_data:
    #         if user_data['id'] > 0:
    #             # 실제 처리...
    #             return True
    # return False

    # Good: 조기 반환으로 중첩 제거
    if user_data is None:
        return False

    if 'id' not in user_data:
        return False

    if user_data['id'] <= 0:
        return False

    # 실제 처리 로직
    print(f"사용자 {user_data['id']} 처리 중...")
    return True

# 4.2 EAFP vs LBYL
def eafp_example(data: dict, key: str):
    """
    EAFP (Easier to Ask for Forgiveness than Permission)
    Python에서 권장하는 스타일: 일단 시도하고 예외 처리
    """
    try:
        value = data[key]
        print(f"값: {value}")
    except KeyError:
        print(f"키 '{key}'가 없습니다")

def lbyl_example(data: dict, key: str):
    """
    LBYL (Look Before You Leap)
    먼저 확인하고 실행 - Python에서는 비권장
    """
    if key in data:
        value = data[key]
        print(f"값: {value}")
    else:
        print(f"키 '{key}'가 없습니다")

# 실무 팁: EAFP가 더 빠르고 Pythonic
# 다만, 예외가 매우 자주 발생하는 경우는 LBYL이 나을 수 있음

# 4.3 Sentinel 값 사용
SENTINEL = object()  # 고유한 객체

def find_with_sentinel(items: List[int], target: int):
    """
    Sentinel 값으로 '찾지 못함'과 'None 값'을 구분
    """
    for item in items:
        if item == target:
            return item
    return SENTINEL  # None과 구분 가능

# 4.4 재시도 로직
def retry_operation(max_retries: int = 3):
    """
    실패 시 재시도하는 패턴 (네트워크 요청 등)
    """
    for attempt in range(max_retries):
        try:
            # 실패할 수 있는 작업
            result = perform_network_request()
            return result
        except ConnectionError as e:
            if attempt < max_retries - 1:
                print(f"재시도 {attempt + 1}/{max_retries}")
                continue
            else:
                print("최대 재시도 횟수 초과")
                raise

def perform_network_request():
    """네트워크 요청 시뮬레이션"""
    if random.random() < 0.7:  # 70% 확률로 실패
        raise ConnectionError("네트워크 오류")
    return "성공"

# ============================================================================
# 실전 예제: 사용자 입력 검증
# ============================================================================

def validate_user_registration(
    username: str,
    email: str,
    age: int,
    password: str
) -> tuple[bool, List[str]]:
    """
    사용자 등록 정보 검증

    실무에서 자주 사용하는 패턴:
    - 여러 조건 검사
    - 오류 메시지 수집
    - 최종 결과 반환
    """
    errors = []

    # 사용자명 검증
    if not username:
        errors.append("사용자명은 필수입니다")
    elif len(username) < 3:
        errors.append("사용자명은 3자 이상이어야 합니다")
    elif len(username) > 20:
        errors.append("사용자명은 20자 이하여야 합니다")

    # 이메일 검증
    if not email:
        errors.append("이메일은 필수입니다")
    elif '@' not in email:
        errors.append("유효한 이메일 형식이 아닙니다")

    # 나이 검증
    if age < 0:
        errors.append("나이는 0 이상이어야 합니다")
    elif age < 18:
        errors.append("18세 이상만 가입 가능합니다")
    elif age > 150:
        errors.append("유효한 나이를 입력하세요")

    # 비밀번호 검증
    if not password:
        errors.append("비밀번호는 필수입니다")
    elif len(password) < 8:
        errors.append("비밀번호는 8자 이상이어야 합니다")
    elif not any(c.isupper() for c in password):
        errors.append("비밀번호는 대문자를 포함해야 합니다")
    elif not any(c.isdigit() for c in password):
        errors.append("비밀번호는 숫자를 포함해야 합니다")

    is_valid = len(errors) == 0
    return is_valid, errors

# ============================================================================
# 연습 문제
# ============================================================================

def practice_exercises():
    """연습 문제를 풀어보세요"""

    # 문제 1: FizzBuzz
    # 1부터 100까지 숫자를 출력하되,
    # 3의 배수는 "Fizz", 5의 배수는 "Buzz",
    # 둘 다 해당하면 "FizzBuzz" 출력
    def fizzbuzz(n: int) -> List[str]:
        # 여기에 코드 작성
        pass

    # 문제 2: 소수 판별
    def is_prime(n: int) -> bool:
        # 여기에 코드 작성
        pass

    # 문제 3: 팩토리얼 계산 (반복문 사용)
    def factorial(n: int) -> int:
        # 여기에 코드 작성
        pass

    # 문제 4: 리스트에서 최댓값과 최솟값 찾기 (내장 함수 사용 금지)
    def find_min_max(numbers: List[int]) -> tuple[int, int]:
        # 여기에 코드 작성
        pass

    # 문제 5: 안전한 딕셔너리 접근 함수
    # 중첩 딕셔너리에서 안전하게 값 가져오기
    def safe_get(data: dict, *keys):
        # 예: safe_get({"a": {"b": {"c": 1}}}, "a", "b", "c") -> 1
        # 예: safe_get({"a": {"b": {"c": 1}}}, "a", "x", "c") -> None
        # 여기에 코드 작성
        pass


if __name__ == "__main__":
    print("=" * 80)
    print("Python 제어문 학습")
    print("=" * 80)

    # 예제 실행
    print("\n소수 찾기:")
    primes = find_prime_numbers(30)
    print(primes)

    print("\n사용자 등록 검증:")
    is_valid, errors = validate_user_registration(
        "alice",
        "alice@example.com",
        25,
        "Password123"
    )
    print(f"유효: {is_valid}")
    if errors:
        for error in errors:
            print(f"  - {error}")

    print("\n연습 문제를 풀어보세요!")
