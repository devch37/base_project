"""
05_modules_and_packages.py

Python 모듈과 패키지: 코드 구조화와 재사용

대규모 프로젝트에서 코드를 체계적으로 관리하는 방법을 학습합니다.
모듈과 패키지를 이해하면 유지보수가 쉽고 재사용 가능한
코드를 작성할 수 있습니다.

학습 목표:
1. 모듈의 개념과 import 방법 이해
2. 패키지 구조 설계 및 구현
3. __init__.py의 역할과 활용
4. 상대/절대 import 차이점 파악
5. 표준 라이브러리 활용
"""

import os
import sys
from pathlib import Path
from typing import List

# ============================================================================
# 1. 모듈 (Module) 기초
# ============================================================================

"""
모듈: .py 파일 하나

모듈을 사용하는 이유:
1. 코드 재사용 (Don't Repeat Yourself)
2. 네임스페이스 관리 (이름 충돌 방지)
3. 코드 구조화 (관련 기능 그룹화)
4. 유지보수성 향상
"""

# ============================================================================
# 2. Import 방법
# ============================================================================

# 2.1 전체 모듈 import
import math
print(math.pi)        # 3.141592...
print(math.sqrt(16))  # 4.0

# 2.2 특정 요소만 import
from math import pi, sqrt
print(pi)             # 3.141592...
print(sqrt(16))       # 4.0

# 2.3 별칭(alias) 사용
import datetime as dt
now = dt.datetime.now()

from collections import defaultdict as dd
word_count = dd(int)

# 2.4 모든 것 import (지양!)
# from math import *  # Bad! 네임스페이스 오염
# 어떤 이름이 import되는지 불명확

# 실무 팁: 명시적 import 권장
# from module import specific_item1, specific_item2

# ============================================================================
# 3. 모듈 예제: 유틸리티 모듈 만들기
# ============================================================================

# 실제로는 별도 파일로 저장 (예: string_utils.py)
"""
# string_utils.py
\"\"\"문자열 처리 유틸리티 모듈\"\"\"

def reverse_string(s: str) -> str:
    \"\"\"문자열 역순\"\"\"
    return s[::-1]

def capitalize_words(s: str) -> str:
    \"\"\"각 단어의 첫 글자 대문자\"\"\"
    return ' '.join(word.capitalize() for word in s.split())

def count_vowels(s: str) -> int:
    \"\"\"모음 개수 세기\"\"\"
    vowels = 'aeiouAEIOU'
    return sum(1 for char in s if char in vowels)

# 모듈 레벨 상수
DEFAULT_ENCODING = 'utf-8'
MAX_LENGTH = 1000

# 모듈이 직접 실행될 때만 실행되는 코드
if __name__ == '__main__':
    # 모듈 테스트 코드
    print("string_utils 모듈 테스트")
    print(reverse_string("Hello"))  # "olleH"
"""

# 사용 예:
# from string_utils import reverse_string, capitalize_words

# ============================================================================
# 4. __name__ 과 __main__
# ============================================================================

def demonstrate_name():
    """
    __name__: 모듈의 이름을 담는 특별한 변수

    - 모듈이 직접 실행: __name__ == "__main__"
    - 모듈이 import됨: __name__ == "모듈명"

    실무 활용: 테스트 코드와 재사용 코드 분리
    """
    print(f"현재 모듈 이름: {__name__}")

# 이 파일이 직접 실행될 때만 실행
if __name__ == "__main__":
    demonstrate_name()

# ============================================================================
# 5. 패키지 (Package) 구조
# ============================================================================

"""
패키지: 모듈들을 담은 디렉토리 (폴더)
__init__.py 파일을 포함해야 패키지로 인식 (Python 3.3+ 선택사항)

패키지 구조 예제:

myproject/
├── __init__.py
├── utils/
│   ├── __init__.py
│   ├── string_utils.py
│   ├── file_utils.py
│   └── date_utils.py
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── product.py
└── services/
    ├── __init__.py
    ├── auth_service.py
    └── payment_service.py
"""

# ============================================================================
# 6. __init__.py의 역할
# ============================================================================

"""
__init__.py: 패키지 초기화 파일

역할:
1. 디렉토리를 패키지로 표시
2. 패키지 초기화 코드 실행
3. 패키지 레벨 변수/함수 정의
4. __all__ 정의로 public API 명시
5. 하위 모듈을 편리하게 import

예제 1: 빈 __init__.py
# utils/__init__.py
# (비어있음)

예제 2: 하위 모듈 re-export
# utils/__init__.py
from .string_utils import reverse_string, capitalize_words
from .file_utils import read_file, write_file

# 이제 다음과 같이 사용 가능:
# from utils import reverse_string  # utils.string_utils가 아닌!

예제 3: __all__ 정의
# utils/__init__.py
__all__ = ['reverse_string', 'capitalize_words', 'read_file']

# from utils import * 시 __all__의 항목만 import

예제 4: 패키지 버전 정보
# myproject/__init__.py
__version__ = '1.0.0'
__author__ = 'Your Name'

from .utils import string_utils
from .models import User, Product
"""

# ============================================================================
# 7. 절대 Import vs 상대 Import
# ============================================================================

"""
절대 Import (Absolute Import):
- 프로젝트 루트부터의 전체 경로 명시
- 명확하고 이해하기 쉬움
- 권장 방식

# myproject/services/auth_service.py
from myproject.models.user import User
from myproject.utils.string_utils import validate_email

상대 Import (Relative Import):
- 현재 모듈의 위치를 기준으로 import
- 패키지 내부 구조 변경에 유연
- 패키지 외부에서는 사용 불가

# myproject/services/auth_service.py
from ..models.user import User          # 상위 디렉토리
from ..utils.string_utils import validate_email
from .payment_service import process_payment  # 같은 디렉토리

상대 Import 기호:
. : 현재 디렉토리
.. : 상위 디렉토리
... : 상위의 상위 디렉토리

실무 팁: 절대 import 선호
- 더 명확하고 IDE 지원이 좋음
- 리팩토링이 쉬움
"""

# ============================================================================
# 8. 순환 Import 문제 (Circular Import)
# ============================================================================

"""
순환 Import: 모듈 A가 모듈 B를 import하고,
              모듈 B가 모듈 A를 import하는 상황

# user.py
from product import Product

class User:
    def buy(self, product: Product):
        pass

# product.py
from user import User

class Product:
    def sold_to(self, user: User):
        pass

# ImportError 발생!

해결 방법:

1. 구조 재설계 (가장 좋음)
   - 공통 모듈로 분리
   - 의존성 방향 정리

2. Import 위치 변경
   - 함수 내부에서 import

def buy(self, product):
    from product import Product  # 함수 내부 import
    # ...

3. 타입 힌트만 필요한 경우
   - TYPE_CHECKING 사용

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from product import Product  # 타입 체크 시에만 import

class User:
    def buy(self, product: 'Product'):  # 문자열로 타입 힌트
        pass
"""

# ============================================================================
# 9. 표준 라이브러리 활용
# ============================================================================

# 9.1 파일/디렉토리 작업: os, pathlib
def demonstrate_os_module():
    """os 모듈: 운영체제 인터페이스"""
    print(f"현재 디렉토리: {os.getcwd()}")
    print(f"홈 디렉토리: {os.path.expanduser('~')}")

    # 환경 변수
    python_path = os.environ.get('PYTHONPATH', '없음')
    print(f"PYTHONPATH: {python_path}")

    # 경로 조작
    path = os.path.join('folder', 'subfolder', 'file.txt')
    print(f"경로 결합: {path}")

def demonstrate_pathlib():
    """pathlib: 객체지향 경로 처리 (Python 3.4+, 권장)"""
    # 현재 파일의 디렉토리
    current_dir = Path(__file__).parent
    print(f"현재 디렉토리: {current_dir}")

    # 경로 조작
    file_path = current_dir / "data" / "config.json"
    print(f"파일 경로: {file_path}")

    # 파일 존재 확인
    if file_path.exists():
        print(f"{file_path} 존재함")

    # 디렉토리의 모든 .py 파일 찾기
    py_files = list(current_dir.glob("*.py"))
    print(f"Python 파일 개수: {len(py_files)}")

# 9.2 날짜/시간: datetime
from datetime import datetime, timedelta

def demonstrate_datetime():
    """datetime 모듈: 날짜와 시간 처리"""
    now = datetime.now()
    print(f"현재 시간: {now}")

    # 시간 연산
    tomorrow = now + timedelta(days=1)
    print(f"내일: {tomorrow}")

    # 포매팅
    formatted = now.strftime("%Y년 %m월 %d일 %H:%M:%S")
    print(f"포맷팅: {formatted}")

    # 파싱
    date_str = "2024-01-15"
    parsed = datetime.strptime(date_str, "%Y-%m-%d")
    print(f"파싱: {parsed}")

# 9.3 JSON 처리: json
import json

def demonstrate_json():
    """json 모듈: JSON 데이터 처리"""
    # Python 객체 -> JSON 문자열
    data = {
        "name": "Alice",
        "age": 30,
        "hobbies": ["reading", "coding"]
    }
    json_string = json.dumps(data, ensure_ascii=False, indent=2)
    print(f"JSON:\n{json_string}")

    # JSON 문자열 -> Python 객체
    parsed = json.loads(json_string)
    print(f"파싱된 이름: {parsed['name']}")

    # 파일로 저장/읽기
    # with open("data.json", "w") as f:
    #     json.dump(data, f, ensure_ascii=False, indent=2)
    #
    # with open("data.json", "r") as f:
    #     loaded_data = json.load(f)

# 9.4 정규 표현식: re
import re

def demonstrate_regex():
    """re 모듈: 정규 표현식"""
    text = "이메일: alice@example.com, bob@test.org"

    # 패턴 찾기
    emails = re.findall(r'\b[\w.]+@[\w.]+\b', text)
    print(f"이메일: {emails}")

    # 패턴 매칭
    pattern = r'^[\w.]+@[\w.]+$'
    if re.match(pattern, "alice@example.com"):
        print("유효한 이메일")

    # 치환
    masked = re.sub(r'\b[\w.]+@', '***@', text)
    print(f"마스킹: {masked}")

# 9.5 컬렉션: collections
from collections import defaultdict, Counter, namedtuple, deque

def demonstrate_collections():
    """collections 모듈: 특수 컨테이너"""

    # defaultdict: 기본값이 있는 딕셔너리
    word_count = defaultdict(int)
    for word in ["apple", "banana", "apple"]:
        word_count[word] += 1  # KeyError 없음!

    # Counter: 개수 세기
    counter = Counter("abracadabra")
    print(f"가장 많은 2개: {counter.most_common(2)}")

    # namedtuple: 이름이 있는 튜플
    Point = namedtuple('Point', ['x', 'y'])
    p = Point(10, 20)
    print(f"좌표: {p.x}, {p.y}")

    # deque: 양방향 큐
    queue = deque([1, 2, 3])
    queue.appendleft(0)  # 왼쪽에 추가
    queue.pop()          # 오른쪽에서 제거

# 9.6 반복 도구: itertools
from itertools import count, cycle, chain, combinations

def demonstrate_itertools():
    """itertools 모듈: 반복자 생성 도구"""

    # 무한 카운터 (주의: 무한 루프!)
    # for i in count(1):
    #     print(i)
    #     if i >= 5:
    #         break

    # 조합
    items = ['A', 'B', 'C']
    combos = list(combinations(items, 2))
    print(f"2개 조합: {combos}")

    # 체인: 여러 반복 가능 객체 연결
    list1 = [1, 2, 3]
    list2 = [4, 5, 6]
    combined = list(chain(list1, list2))
    print(f"체인: {combined}")

# 9.7 함수 도구: functools
from functools import lru_cache, reduce, partial

def demonstrate_functools():
    """functools 모듈: 함수 관련 도구"""

    # lru_cache: 메모이제이션
    @lru_cache(maxsize=128)
    def fibonacci(n: int) -> int:
        if n < 2:
            return n
        return fibonacci(n - 1) + fibonacci(n - 2)

    print(f"fibonacci(30): {fibonacci(30)}")

    # reduce: 누적 연산
    numbers = [1, 2, 3, 4, 5]
    total = reduce(lambda a, b: a + b, numbers)
    print(f"합계: {total}")

    # partial: 부분 적용
    def power(base: int, exp: int) -> int:
        return base ** exp

    square = partial(power, exp=2)
    print(f"5의 제곱: {square(5)}")

# ============================================================================
# 10. 실전 예제: 설정 관리 모듈
# ============================================================================

class Config:
    """
    애플리케이션 설정 관리 클래스

    실무 패턴: Singleton 패턴으로 구현
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self.settings = {
            "debug": False,
            "database": {
                "host": "localhost",
                "port": 5432
            },
            "api_key": "your-api-key"
        }

    def get(self, key: str, default=None):
        """설정 값 가져오기 (점 표기법 지원)"""
        keys = key.split('.')
        value = self.settings

        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default

        return value if value is not None else default

    def set(self, key: str, value):
        """설정 값 설정"""
        keys = key.split('.')
        settings = self.settings

        for k in keys[:-1]:
            settings = settings.setdefault(k, {})

        settings[keys[-1]] = value

    @classmethod
    def from_json_file(cls, filepath: str):
        """JSON 파일에서 설정 로드"""
        instance = cls()
        with open(filepath, 'r') as f:
            instance.settings = json.load(f)
        return instance

# 사용 예제
config = Config()
print(f"Debug 모드: {config.get('debug')}")
print(f"DB 호스트: {config.get('database.host')}")

# ============================================================================
# 11. 모범 사례 (Best Practices)
# ============================================================================

"""
1. 모듈 구조화
   - 하나의 모듈은 하나의 명확한 목적
   - 관련 있는 기능끼리 그룹화
   - 순환 의존성 피하기

2. Import 스타일
   - 표준 라이브러리 먼저
   - 서드파티 라이브러리 다음
   - 자체 모듈 마지막
   - 각 그룹 사이 빈 줄

# Good:
import os
import sys

import requests
import numpy as np

from myproject.utils import string_utils
from myproject.models import User

3. __all__ 정의
   - public API 명시
   - from module import * 제어

# utils/string_utils.py
__all__ = ['reverse_string', 'capitalize_words']

4. 문서화
   - 모듈 독스트링 작성
   - 복잡한 함수는 상세히 설명

5. 테스트 코드
   - if __name__ == '__main__': 활용
   - 각 모듈의 기능 테스트

6. 네이밍
   - 모듈명: 소문자_언더스코어
   - 패키지명: 소문자 (언더스코어 지양)
   - 명확하고 설명적인 이름 사용
"""

# ============================================================================
# 연습 문제
# ============================================================================

def practice_exercises():
    """연습 문제를 풀어보세요"""

    # 문제 1: math_utils.py 모듈 만들기
    # - 평균, 중앙값, 표준편차 계산 함수
    # - 소수 판별 함수
    # - 최대공약수, 최소공배수 함수

    # 문제 2: file_utils 패키지 만들기
    # - 파일 읽기/쓰기
    # - CSV 파일 처리
    # - JSON 파일 처리

    # 문제 3: Logger 싱글톤 클래스
    # - 로그 레벨 (DEBUG, INFO, WARNING, ERROR)
    # - 파일과 콘솔에 동시 출력
    # - 타임스탬프 자동 추가

    # 문제 4: 설정 관리 시스템
    # - 환경 변수에서 설정 로드
    # - JSON 파일에서 설정 로드
    # - 기본값 지원

    pass


if __name__ == "__main__":
    print("=" * 80)
    print("Python 모듈과 패키지 학습")
    print("=" * 80)

    print("\n1. os와 pathlib:")
    demonstrate_os_module()
    demonstrate_pathlib()

    print("\n2. datetime:")
    demonstrate_datetime()

    print("\n3. JSON:")
    demonstrate_json()

    print("\n4. 정규 표현식:")
    demonstrate_regex()

    print("\n5. collections:")
    demonstrate_collections()

    print("\n6. itertools:")
    demonstrate_itertools()

    print("\n7. functools:")
    demonstrate_functools()

    print("\n연습 문제를 풀어보세요!")
