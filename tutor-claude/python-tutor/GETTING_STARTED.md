# 시작하기 (Getting Started)

## 환영합니다! 🎉

Python과 Django 학습 여정에 오신 것을 환영합니다. 이 문서는 프로젝트를 시작하는 방법을 안내합니다.

## 사전 준비

### 1. Python 설치 확인
```bash
python3 --version
# Python 3.11 이상 권장
```

Python이 설치되어 있지 않다면:
- macOS: `brew install python3`
- Ubuntu: `sudo apt-get install python3`
- Windows: [python.org](https://www.python.org/) 에서 다운로드

### 2. Git 확인 (선택사항)
```bash
git --version
```

## 프로젝트 설정

### 1단계: 가상환경 생성
```bash
# 프로젝트 디렉토리로 이동
cd /Users/chulhanlee/Desktop/workspace/study/base_project/tutor-claude/python-tutor

# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
# macOS/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate

# 활성화 확인 (프롬프트 앞에 (venv)가 표시됨)
```

### 2단계: 패키지 설치
```bash
# pip 업그레이드
pip install --upgrade pip

# 필요한 패키지 설치
pip install -r requirements.txt
```

### 3단계: 설치 확인
```bash
# Django 버전 확인
python -m django --version

# Python 패키지 확인
pip list
```

## 학습 시작하기

### Phase 1: Python 기초 (1-2주)

첫 번째 파일부터 순서대로 학습하세요:

```bash
cd 01_python_basics

# 첫 번째 파일 실행
python 01_variables_and_types.py

# README 읽기
cat README.md
```

**학습 방법**:
1. README.md를 먼저 읽어 개요 파악
2. 각 Python 파일을 열어 주석을 꼼꼼히 읽기
3. 코드를 직접 타이핑하며 실행
4. 예제를 변형해보며 실험
5. 연습 문제 풀기

**학습 순서**:
```
01_python_basics/
├── README.md                    ← 먼저 읽기
├── 01_variables_and_types.py    ← 1일차
├── 02_control_flow.py           ← 2일차
├── 03_functions.py              ← 3-4일차
├── 04_classes_and_oop.py        ← 5-7일차
├── 05_modules_and_packages.py   ← 8-9일차
└── 06_advanced_features.py      ← 10-12일차
```

### Phase 2: Python 중급 (2-3주)

```bash
cd ../02_python_intermediate
cat README.md
```

### Phase 3: Django 시작 (4-8주)

```bash
cd ../04_django_basics
cat README.md

# Django 프로젝트 생성 (README 참고)
django-admin startproject blog_project
```

## 학습 팁

### 1. 매일 꾸준히
- 하루 1-2시간씩 꾸준히 학습
- 한 번에 몰아서 하는 것보다 효과적

### 2. 손으로 타이핑
- 복사-붙여넣기 금지!
- 직접 타이핑하며 코드를 체득

### 3. 에러는 친구
- 에러 메시지를 읽고 이해하기
- 에러를 통해 배우는 것이 가장 많음

### 4. 실험하기
- 예제 코드를 변형해보기
- "이렇게 하면 어떻게 될까?" 실험

### 5. 문서 활용
- [Python 공식 문서](https://docs.python.org/3/)
- [Django 공식 문서](https://docs.djangoproject.com/)

### 6. 커뮤니티 활용
- 막힐 때 검색하기 (Stack Overflow, 구글)
- Python/Django 커뮤니티 참여

## 프로젝트 구조 둘러보기

```
python-tutor/
├── README.md                    # 프로젝트 개요
├── GETTING_STARTED.md          # 이 파일
├── requirements.txt            # Python 패키지 목록
├── 01_python_basics/           # Python 기초
│   ├── README.md
│   └── *.py (6개 파일)
├── 02_python_intermediate/     # Python 중급
│   └── README.md
├── 03_python_advanced/         # Python 고급
├── 04_django_basics/           # Django 기초
│   └── README.md
├── 05_django_intermediate/     # Django 중급
├── 06_django_advanced/         # Django 고급
├── 07_testing/                 # 테스트
└── 08_best_practices/          # 베스트 프랙티스
    ├── README.md
    └── solid_principles.py
```

## 단계별 체크리스트

### Python 기초
- [ ] 변수와 자료형 이해
- [ ] 제어문 활용 가능
- [ ] 함수 작성 가능
- [ ] 클래스와 OOP 이해
- [ ] 모듈 분리 가능
- [ ] 파일 입출력 가능

### Django 기초
- [ ] Django 프로젝트 생성
- [ ] 모델 설계 가능
- [ ] URL 라우팅 이해
- [ ] 뷰 작성 가능
- [ ] 템플릿 활용 가능
- [ ] CRUD 구현 가능

## 문제 해결

### 가상환경이 활성화되지 않아요
```bash
# 경로 확인
ls venv/bin/activate

# 권한 확인
chmod +x venv/bin/activate

# 다시 시도
source venv/bin/activate
```

### 패키지 설치가 안 돼요
```bash
# pip 업그레이드
pip install --upgrade pip

# 권한 문제 (macOS/Linux)
sudo pip install -r requirements.txt

# 또는
pip install --user -r requirements.txt
```

### Django 명령어가 안 돼요
```bash
# 가상환경 활성화 확인
which python
# /path/to/venv/bin/python 이어야 함

# Django 설치 확인
pip show django
```

### Python 파일 실행이 안 돼요
```bash
# 실행 권한 확인
ls -l *.py

# 직접 실행
python3 01_variables_and_types.py

# 또는
python 01_variables_and_types.py
```

## 다음 단계

1. **기초 완성**: `01_python_basics/` 모든 파일 학습
2. **프로젝트 시작**: 간단한 Python 프로그램 만들기
3. **Django 입문**: `04_django_basics/` 로 이동
4. **실전 프로젝트**: 블로그 시스템 구현

## 학습 목표 설정

### 1개월 목표
- Python 기초 완전 숙지
- 간단한 프로그램 작성 가능
- Django 기본 개념 이해

### 3개월 목표
- Django로 CRUD 앱 만들기
- 데이터베이스 설계 가능
- 사용자 인증 구현 가능

### 6개월 목표
- 실전 프로젝트 완성
- 클린 아키텍처 적용
- 테스트 코드 작성
- 배포 경험

## 동기부여 💪

**Remember**:
- 프로그래밍은 마라톤이지 스프린트가 아닙니다
- 에러는 성장의 기회입니다
- 매일 조금씩 발전하는 자신을 느껴보세요
- 완벽함보다 꾸준함이 중요합니다

**You can do it!** 🚀

## 질문이 있나요?

이 튜토리얼은 자기주도 학습을 위해 설계되었습니다.
막히는 부분이 있다면:
1. 주석을 다시 읽어보세요
2. 공식 문서를 참고하세요
3. 검색하세요 (대부분의 답은 이미 있습니다)
4. 실험해보세요

**Happy Coding!** 🎊
