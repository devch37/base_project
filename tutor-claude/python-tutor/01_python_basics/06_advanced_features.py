"""
06_advanced_features.py

Python 고급 기능: 컴프리헨션, 제너레이터, 파일 처리

Python의 강력한 기능들을 학습하여 더 간결하고 효율적인 코드를 작성합니다.
이 파일에서는 리스트 컴프리헨션부터 파일 입출력까지
실무에서 자주 사용되는 고급 기능들을 다룹니다.

학습 목표:
1. 다양한 컴프리헨션 활용
2. 제너레이터와 이터레이터 이해
3. 파일 입출력 마스터
4. 정규 표현식 활용
5. 데코레이터 기초 이해
"""

from typing import Iterator, Generator, List, Dict, Optional
import re
import csv
import json
from pathlib import Path
from functools import wraps
import time

# ============================================================================
# 1. 리스트 컴프리헨션 (List Comprehension)
# ============================================================================

def demonstrate_list_comprehension():
    """
    리스트 컴프리헨션: 간결한 리스트 생성

    문법: [표현식 for 항목 in 반복가능객체 if 조건]

    실무 팁: for 루프보다 빠르고 Pythonic
    """

    # 기본: 제곱 리스트
    squares = [x**2 for x in range(10)]
    print(f"제곱: {squares}")

    # 조건 필터: 짝수만
    evens = [x for x in range(20) if x % 2 == 0]
    print(f"짝수: {evens}")

    # 문자열 처리
    words = ["hello", "world", "python"]
    uppercase = [word.upper() for word in words]
    print(f"대문자: {uppercase}")

    # 중첩 루프: 2D 리스트 평탄화
    matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    flattened = [num for row in matrix for num in row]
    print(f"평탄화: {flattened}")

    # 조건부 표현식
    numbers = range(-5, 6)
    abs_or_zero = [x if x > 0 else 0 for x in numbers]
    print(f"양수만: {abs_or_zero}")

    # 딕셔너리에서 리스트 생성
    users = [
        {"name": "Alice", "age": 30},
        {"name": "Bob", "age": 25},
        {"name": "Charlie", "age": 35}
    ]
    names = [user["name"] for user in users if user["age"] >= 30]
    print(f"30세 이상: {names}")

    # 실전 예제: 파일 확장자 필터링
    files = ["doc.txt", "image.png", "data.csv", "script.py"]
    python_files = [f for f in files if f.endswith(".py")]
    print(f"Python 파일: {python_files}")

# ============================================================================
# 2. 딕셔너리 컴프리헨션 (Dictionary Comprehension)
# ============================================================================

def demonstrate_dict_comprehension():
    """
    딕셔너리 컴프리헨션: 간결한 딕셔너리 생성

    문법: {키표현식: 값표현식 for 항목 in 반복가능객체 if 조건}
    """

    # 기본: 제곱 딕셔너리
    squares = {x: x**2 for x in range(6)}
    print(f"제곱 딕셔너리: {squares}")

    # 리스트를 딕셔너리로 변환
    words = ["apple", "banana", "cherry"]
    word_lengths = {word: len(word) for word in words}
    print(f"단어 길이: {word_lengths}")

    # 조건 필터
    numbers = range(10)
    even_squares = {x: x**2 for x in numbers if x % 2 == 0}
    print(f"짝수 제곱: {even_squares}")

    # 딕셔너리 변환
    original = {"a": 1, "b": 2, "c": 3}
    doubled = {key: value * 2 for key, value in original.items()}
    print(f"두 배: {doubled}")

    # 키-값 반전
    inverted = {value: key for key, value in original.items()}
    print(f"반전: {inverted}")

    # 실전 예제: 데이터 정규화
    scores = {"Alice": 85, "Bob": 92, "Charlie": 78}
    max_score = max(scores.values())
    normalized = {name: score/max_score for name, score in scores.items()}
    print(f"정규화: {normalized}")

# ============================================================================
# 3. 집합 컴프리헨션 (Set Comprehension)
# ============================================================================

def demonstrate_set_comprehension():
    """
    집합 컴프리헨션: 중복 없는 집합 생성

    문법: {표현식 for 항목 in 반복가능객체 if 조건}
    """

    # 기본: 제곱 집합
    squares = {x**2 for x in range(-5, 6)}
    print(f"제곱 집합: {squares}")  # 중복 자동 제거

    # 문자열에서 고유 문자
    text = "hello world"
    unique_chars = {char for char in text if char != ' '}
    print(f"고유 문자: {unique_chars}")

    # 실전 예제: 중복 이메일 도메인 추출
    emails = ["alice@gmail.com", "bob@yahoo.com", "charlie@gmail.com"]
    domains = {email.split('@')[1] for email in emails}
    print(f"도메인: {domains}")

# ============================================================================
# 4. 제너레이터 표현식 (Generator Expression)
# ============================================================================

def demonstrate_generator_expression():
    """
    제너레이터 표현식: 메모리 효율적인 반복

    문법: (표현식 for 항목 in 반복가능객체 if 조건)

    실무 팁:
    - 리스트 컴프리헨션과 유사하지만 () 사용
    - 값을 한 번에 생성하지 않고 필요할 때 생성 (lazy evaluation)
    - 큰 데이터셋 처리 시 메모리 절약
    """

    # 리스트 컴프리헨션 vs 제너레이터 표현식
    list_comp = [x**2 for x in range(10)]      # 리스트 (메모리 사용)
    gen_expr = (x**2 for x in range(10))       # 제너레이터 (메모리 효율)

    print(f"리스트: {list_comp}")
    print(f"제너레이터: {gen_expr}")  # <generator object>

    # 제너레이터는 순회 가능
    for value in gen_expr:
        print(value, end=' ')
    print()

    # 한 번 순회하면 소진됨 (재사용 불가)
    # for value in gen_expr:  # 아무것도 출력 안 됨!
    #     print(value)

    # 대용량 파일 처리 예제
    # Bad: 메모리에 모두 로드
    # lines = [line.strip() for line in open('huge_file.txt')]

    # Good: 한 줄씩 처리
    # lines = (line.strip() for line in open('huge_file.txt'))

    # 실전 예제: 큰 수의 합계
    # 1부터 1000만까지 제곱의 합
    total = sum(x**2 for x in range(10_000_000))  # 제너레이터 표현식
    print(f"합계: {total}")

# ============================================================================
# 5. 제너레이터 함수 (Generator Function)
# ============================================================================

def count_up_to(n: int) -> Generator[int, None, None]:
    """
    제너레이터 함수: yield 키워드 사용

    yield: 값을 반환하지만 함수 상태를 유지
    일반 return: 값을 반환하고 함수 종료
    """
    count = 1
    while count <= n:
        yield count
        count += 1

def demonstrate_generator_function():
    """제너레이터 함수 사용 예제"""

    # 사용
    for num in count_up_to(5):
        print(num, end=' ')  # 1 2 3 4 5
    print()

    # 제너레이터는 이터레이터
    gen = count_up_to(3)
    print(next(gen))  # 1
    print(next(gen))  # 2
    print(next(gen))  # 3
    # print(next(gen))  # StopIteration 예외!

def fibonacci_generator(n: int) -> Generator[int, None, None]:
    """피보나치 수열 제너레이터"""
    a, b = 0, 1
    count = 0
    while count < n:
        yield a
        a, b = b, a + b
        count += 1

def read_large_file(file_path: str) -> Generator[str, None, None]:
    """
    대용량 파일을 한 줄씩 읽는 제너레이터

    실무 팁: 메모리 효율적인 파일 처리
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            yield line.strip()

def batch_generator(items: List, batch_size: int) -> Generator[List, None, None]:
    """
    리스트를 배치로 나누는 제너레이터

    실무 활용: 대용량 데이터 배치 처리
    """
    for i in range(0, len(items), batch_size):
        yield items[i:i + batch_size]

# 사용 예제
def demonstrate_batch_processing():
    """배치 처리 예제"""
    data = list(range(1, 26))  # 1~25

    print("배치 처리 (배치 크기: 5):")
    for batch in batch_generator(data, 5):
        print(f"배치: {batch}")

# ============================================================================
# 6. 파일 입출력 (File I/O)
# ============================================================================

def demonstrate_file_writing():
    """파일 쓰기 예제"""

    # 텍스트 파일 쓰기
    with open('sample.txt', 'w', encoding='utf-8') as f:
        f.write("Hello, World!\n")
        f.write("Python 파일 처리\n")
        f.writelines(["라인 1\n", "라인 2\n", "라인 3\n"])

    print("파일 쓰기 완료: sample.txt")

def demonstrate_file_reading():
    """파일 읽기 예제"""

    # 방법 1: 전체 읽기
    with open('sample.txt', 'r', encoding='utf-8') as f:
        content = f.read()
        print(f"전체 내용:\n{content}")

    # 방법 2: 한 줄씩 읽기
    with open('sample.txt', 'r', encoding='utf-8') as f:
        line = f.readline()
        print(f"첫 줄: {line.strip()}")

    # 방법 3: 모든 줄을 리스트로
    with open('sample.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        print(f"줄 수: {len(lines)}")

    # 방법 4: 순회 (메모리 효율적, 권장!)
    with open('sample.txt', 'r', encoding='utf-8') as f:
        for line in f:
            print(f"줄: {line.strip()}")

def demonstrate_file_modes():
    """
    파일 모드 설명

    'r'  : 읽기 (기본값)
    'w'  : 쓰기 (기존 내용 삭제)
    'a'  : 추가 (기존 내용 유지)
    'x'  : 배타적 생성 (파일이 이미 존재하면 실패)
    'b'  : 바이너리 모드
    't'  : 텍스트 모드 (기본값)
    '+'  : 읽기/쓰기 모두

    조합: 'rb', 'wb', 'r+', 'w+', 'a+'
    """
    pass

def demonstrate_csv_handling():
    """CSV 파일 처리"""

    # CSV 쓰기
    data = [
        ["이름", "나이", "도시"],
        ["Alice", "30", "Seoul"],
        ["Bob", "25", "Busan"],
        ["Charlie", "35", "Incheon"]
    ]

    with open('users.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(data)

    print("CSV 쓰기 완료: users.csv")

    # CSV 읽기
    with open('users.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            print(row)

    # 딕셔너리로 읽기 (헤더 활용)
    with open('users.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            print(f"{row['이름']}는 {row['나이']}살, {row['도시']} 거주")

def demonstrate_json_handling():
    """JSON 파일 처리"""

    # Python 객체 -> JSON 파일
    user_data = {
        "users": [
            {"id": 1, "name": "Alice", "email": "alice@example.com"},
            {"id": 2, "name": "Bob", "email": "bob@example.com"}
        ],
        "count": 2
    }

    with open('users.json', 'w', encoding='utf-8') as f:
        json.dump(user_data, f, ensure_ascii=False, indent=2)

    print("JSON 쓰기 완료: users.json")

    # JSON 파일 -> Python 객체
    with open('users.json', 'r', encoding='utf-8') as f:
        loaded_data = json.load(f)
        print(f"사용자 수: {loaded_data['count']}")
        for user in loaded_data['users']:
            print(f"  - {user['name']}: {user['email']}")

def demonstrate_pathlib():
    """pathlib를 활용한 파일 처리 (Python 3.4+, 권장)"""

    # 경로 객체 생성
    file_path = Path('sample.txt')

    # 파일 읽기
    if file_path.exists():
        content = file_path.read_text(encoding='utf-8')
        print(f"파일 내용:\n{content}")

    # 파일 쓰기
    file_path.write_text("New content\n", encoding='utf-8')

    # 파일 정보
    print(f"파일 크기: {file_path.stat().st_size} bytes")
    print(f"수정 시간: {file_path.stat().st_mtime}")

    # 디렉토리의 모든 파일 찾기
    current_dir = Path('.')
    py_files = list(current_dir.glob('*.py'))
    print(f"Python 파일: {len(py_files)}개")

    # 재귀적으로 찾기
    # all_py_files = list(current_dir.rglob('*.py'))

# ============================================================================
# 7. 정규 표현식 (Regular Expressions)
# ============================================================================

def demonstrate_regex_basics():
    """정규 표현식 기초"""

    text = "My phone number is 010-1234-5678 and email is test@example.com"

    # 패턴 찾기
    phone = re.search(r'\d{3}-\d{4}-\d{4}', text)
    if phone:
        print(f"전화번호: {phone.group()}")

    # 모든 매칭 찾기
    numbers = re.findall(r'\d+', text)
    print(f"숫자들: {numbers}")

    # 이메일 추출
    email = re.search(r'[\w.]+@[\w.]+', text)
    if email:
        print(f"이메일: {email.group()}")

    # 치환
    masked = re.sub(r'\d{3}-\d{4}-\d{4}', '***-****-****', text)
    print(f"마스킹: {masked}")

    # 분리
    parts = re.split(r'[\s,]+', "apple, banana orange,cherry")
    print(f"분리: {parts}")

def demonstrate_regex_patterns():
    """
    자주 사용하는 정규 표현식 패턴

    .       : 임의의 한 문자
    ^       : 문자열 시작
    $       : 문자열 끝
    *       : 0회 이상 반복
    +       : 1회 이상 반복
    ?       : 0회 또는 1회
    {m,n}   : m회 이상 n회 이하
    []      : 문자 클래스
    |       : OR
    ()      : 그룹화
    \d      : 숫자 [0-9]
    \w      : 단어 문자 [a-zA-Z0-9_]
    \s      : 공백 문자
    """

    # 이메일 검증
    def is_valid_email(email: str) -> bool:
        pattern = r'^[\w.+-]+@[\w-]+\.[\w.-]+$'
        return bool(re.match(pattern, email))

    emails = ["test@example.com", "invalid.email", "user+tag@domain.co.kr"]
    for email in emails:
        print(f"{email}: {'유효' if is_valid_email(email) else '무효'}")

    # URL 추출
    text = "Visit https://example.com or http://test.org"
    urls = re.findall(r'https?://[\w.-]+', text)
    print(f"URL: {urls}")

    # 그룹 캡처
    date_text = "오늘은 2024-01-15입니다"
    match = re.search(r'(\d{4})-(\d{2})-(\d{2})', date_text)
    if match:
        year, month, day = match.groups()
        print(f"년: {year}, 월: {month}, 일: {day}")

# ============================================================================
# 8. 데코레이터 심화 (Decorators)
# ============================================================================

def timer_decorator(func):
    """실행 시간 측정 데코레이터"""
    @wraps(func)  # 원본 함수의 메타데이터 보존
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} 실행 시간: {end_time - start_time:.4f}초")
        return result
    return wrapper

def debug_decorator(func):
    """디버그 정보 출력 데코레이터"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        args_repr = [repr(arg) for arg in args]
        kwargs_repr = [f"{key}={value!r}" for key, value in kwargs.items()]
        signature = ", ".join(args_repr + kwargs_repr)
        print(f"호출: {func.__name__}({signature})")
        result = func(*args, **kwargs)
        print(f"반환: {result!r}")
        return result
    return wrapper

def retry_decorator(max_attempts: int = 3):
    """재시도 데코레이터 (매개변수 있음)"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"시도 {attempt + 1} 실패: {e}. 재시도...")
        return wrapper
    return decorator

# 사용 예제
@timer_decorator
@debug_decorator
def calculate_sum(n: int) -> int:
    """1부터 n까지의 합"""
    return sum(range(1, n + 1))

@retry_decorator(max_attempts=3)
def unstable_operation():
    """불안정한 작업 시뮬레이션"""
    import random
    if random.random() < 0.7:
        raise Exception("임시 오류")
    return "성공!"

# ============================================================================
# 9. 실전 예제: 로그 파일 분석기
# ============================================================================

class LogAnalyzer:
    """
    로그 파일 분석 클래스

    실무 활용: 대용량 로그 파일 처리
    """

    def __init__(self, log_file: str):
        self.log_file = log_file

    def count_by_level(self) -> Dict[str, int]:
        """로그 레벨별 개수"""
        counts = {}
        with open(self.log_file, 'r', encoding='utf-8') as f:
            for line in f:
                match = re.search(r'\[(DEBUG|INFO|WARNING|ERROR)\]', line)
                if match:
                    level = match.group(1)
                    counts[level] = counts.get(level, 0) + 1
        return counts

    def find_errors(self) -> List[str]:
        """에러 로그만 추출"""
        errors = []
        with open(self.log_file, 'r', encoding='utf-8') as f:
            for line in f:
                if '[ERROR]' in line:
                    errors.append(line.strip())
        return errors

    def extract_timestamps(self) -> Generator[str, None, None]:
        """타임스탬프 추출 (제너레이터)"""
        pattern = r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'
        with open(self.log_file, 'r', encoding='utf-8') as f:
            for line in f:
                match = re.search(pattern, line)
                if match:
                    yield match.group()

# ============================================================================
# 연습 문제
# ============================================================================

def practice_exercises():
    """연습 문제를 풀어보세요"""

    # 문제 1: 단어 빈도 카운터
    # 텍스트 파일을 읽어 각 단어의 출현 빈도를 딕셔너리로 반환
    def word_frequency(filename: str) -> Dict[str, int]:
        pass

    # 문제 2: 프라임 넘버 제너레이터
    # n번째까지의 소수를 생성하는 제너레이터
    def prime_generator(n: int) -> Generator[int, None, None]:
        pass

    # 문제 3: CSV 필터링
    # CSV 파일에서 특정 조건을 만족하는 행만 새 파일로 저장
    def filter_csv(input_file: str, output_file: str, condition):
        pass

    # 문제 4: 이메일 추출기
    # 텍스트에서 모든 이메일 주소를 추출하는 함수
    def extract_emails(text: str) -> List[str]:
        pass

    # 문제 5: 캐싱 데코레이터
    # 함수 결과를 캐싱하는 데코레이터 (functools.lru_cache 직접 구현)
    def cache_decorator(func):
        pass


if __name__ == "__main__":
    print("=" * 80)
    print("Python 고급 기능 학습")
    print("=" * 80)

    print("\n1. 리스트 컴프리헨션:")
    demonstrate_list_comprehension()

    print("\n2. 딕셔너리 컴프리헨션:")
    demonstrate_dict_comprehension()

    print("\n3. 집합 컴프리헨션:")
    demonstrate_set_comprehension()

    print("\n4. 제너레이터 표현식:")
    demonstrate_generator_expression()

    print("\n5. 제너레이터 함수:")
    demonstrate_generator_function()

    print("\n6. 배치 처리:")
    demonstrate_batch_processing()

    print("\n7. 파일 쓰기:")
    demonstrate_file_writing()

    print("\n8. 파일 읽기:")
    demonstrate_file_reading()

    print("\n9. CSV 처리:")
    demonstrate_csv_handling()

    print("\n10. JSON 처리:")
    demonstrate_json_handling()

    print("\n11. 정규 표현식:")
    demonstrate_regex_basics()
    demonstrate_regex_patterns()

    print("\n12. 데코레이터:")
    result = calculate_sum(100)
    print(f"결과: {result}")

    print("\n연습 문제를 풀어보세요!")
