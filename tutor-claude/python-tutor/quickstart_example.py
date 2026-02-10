"""
quickstart_example.py

Python 튜토리얼 퀵스타트 예제

이 파일을 실행하여 환경이 올바르게 설정되었는지 확인하세요.
실행 방법: python quickstart_example.py
"""

import sys
from typing import List

def print_header(title: str) -> None:
    """헤더 출력"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def check_python_version() -> bool:
    """Python 버전 확인"""
    print_header("Python 버전 확인")

    version = sys.version_info
    print(f"현재 Python 버전: {version.major}.{version.minor}.{version.micro}")

    if version.major >= 3 and version.minor >= 11:
        print("✓ Python 버전이 적합합니다! (3.11+)")
        return True
    else:
        print("⚠ Python 3.11 이상을 권장합니다.")
        return False

def demonstrate_basic_features() -> None:
    """Python 기본 기능 데모"""
    print_header("Python 기본 기능 데모")

    # 1. 변수와 타입
    name: str = "Python Learner"
    age: int = 25
    is_ready: bool = True

    print(f"1. 변수: {name}, {age}세, 준비: {is_ready}")

    # 2. 리스트 컴프리헨션
    numbers: List[int] = [x**2 for x in range(5)]
    print(f"2. 리스트 컴프리헨션: {numbers}")

    # 3. 딕셔너리
    user: dict = {
        "name": "Alice",
        "age": 30,
        "skills": ["Python", "Django"]
    }
    print(f"3. 딕셔너리: {user}")

    # 4. 함수
    def greet(name: str) -> str:
        return f"Hello, {name}!"

    print(f"4. 함수: {greet('Django')}")

    # 5. 클래스
    class Student:
        def __init__(self, name: str):
            self.name = name

        def introduce(self) -> str:
            return f"I'm {self.name}"

    student = Student("Bob")
    print(f"5. 클래스: {student.introduce()}")

def show_learning_path() -> None:
    """학습 경로 안내"""
    print_header("학습 경로")

    learning_path = [
        ("1단계", "01_python_basics", "Python 기초 문법", "1-2주"),
        ("2단계", "02_python_intermediate", "Python 중급 개념", "2-3주"),
        ("3단계", "03_python_advanced", "Python 고급 주제", "2-3주"),
        ("4단계", "04_django_basics", "Django 기초", "2-3주"),
        ("5단계", "05_django_intermediate", "Django 중급", "3-4주"),
        ("6단계", "06_django_advanced", "Django 고급", "4-5주"),
        ("7단계", "07_testing", "테스트 전략", "2주"),
        ("8단계", "08_best_practices", "베스트 프랙티스", "지속적")
    ]

    for stage, folder, description, duration in learning_path:
        print(f"{stage}: {description} ({duration})")
        print(f"      📁 {folder}/")
        print()

def show_next_steps() -> None:
    """다음 단계 안내"""
    print_header("다음 단계")

    print("✓ 환경 설정이 완료되었습니다!")
    print("\n다음 명령어로 학습을 시작하세요:\n")
    print("  1. cd 01_python_basics")
    print("  2. cat README.md                    # 개요 읽기")
    print("  3. python 01_variables_and_types.py # 첫 예제 실행")
    print("\n학습 팁:")
    print("  - 매일 1-2시간씩 꾸준히 학습하세요")
    print("  - 코드를 직접 타이핑하며 실행하세요")
    print("  - 에러를 두려워하지 마세요 (에러는 배움의 기회)")
    print("  - 예제를 변형해보며 실험하세요")
    print("\n행운을 빕니다! 🚀\n")

def main() -> None:
    """메인 함수"""
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 15 + "Python & Django 튜토리얼 퀵스타트" + " " * 29 + "║")
    print("║" + " " * 20 + "10년차 시니어 개발자와 함께" + " " * 29 + "║")
    print("╚" + "═" * 78 + "╝")

    # Python 버전 확인
    is_version_ok = check_python_version()

    # 기본 기능 데모
    demonstrate_basic_features()

    # 학습 경로 표시
    show_learning_path()

    # 다음 단계 안내
    show_next_steps()

    if not is_version_ok:
        print("⚠ 주의: Python 버전을 업그레이드하는 것을 권장합니다.\n")

if __name__ == "__main__":
    main()
