# Python & Django 종합 튜토리얼 프로젝트

## 프로젝트 개요
10년차 시니어 개발자의 관점에서 Python 기초부터 Django 고급까지, 실무에서 바로 활용할 수 있는 베스트 프랙티스를 학습하는 종합 튜토리얼입니다.

## 학습 목표
- Python 기본 문법부터 고급 기능까지 완전히 이해
- Django를 활용한 실전 웹 애플리케이션 개발 능력 습득
- 클린 아키텍처와 DDD 패턴을 적용한 확장 가능한 코드 작성
- SOLID 원칙을 준수하는 객체지향 설계 능력 배양
- 테스트 주도 개발(TDD) 방법론 실습

## 프로젝트 구조

```
python-tutor/
├── 01_python_basics/           # Python 기초 문법
│   ├── 01_variables_and_types.py
│   ├── 02_control_flow.py
│   ├── 03_functions.py
│   ├── 04_classes_and_oop.py
│   ├── 05_modules_and_packages.py
│   ├── 06_advanced_features.py
│   └── README.md
├── 02_python_intermediate/     # Python 중급 개념
│   ├── 01_decorators.py
│   ├── 02_generators_iterators.py
│   ├── 03_context_managers.py
│   ├── 04_comprehensions.py
│   ├── 05_lambda_map_filter.py
│   └── README.md
├── 03_python_advanced/         # Python 고급 주제
│   ├── 01_metaclasses.py
│   ├── 02_async_await.py
│   ├── 03_design_patterns.py
│   ├── 04_type_hints.py
│   └── README.md
├── 04_django_basics/           # Django 기초
│   └── blog_project/           # 블로그 프로젝트
│       ├── manage.py
│       ├── config/             # 프로젝트 설정
│       ├── apps/               # Django 앱들
│       │   ├── blog/
│       │   └── users/
│       └── README.md
├── 05_django_intermediate/     # Django 중급
│   └── enhanced_blog/          # 향상된 블로그
│       ├── models/             # 모델 계층
│       ├── forms/              # 폼 처리
│       ├── views/              # 뷰 계층
│       ├── templates/          # 템플릿
│       └── README.md
├── 06_django_advanced/         # Django 고급
│   └── clean_architecture_blog/ # 클린 아키텍처 적용
│       ├── domain/             # 도메인 계층
│       ├── application/        # 애플리케이션 계층
│       ├── infrastructure/     # 인프라 계층
│       ├── presentation/       # 프레젠테이션 계층
│       └── README.md
├── 07_testing/                 # 테스트 전략
│   ├── unit_tests/
│   ├── integration_tests/
│   └── README.md
├── 08_best_practices/          # 베스트 프랙티스
│   ├── solid_principles.py
│   ├── ddd_patterns.py
│   ├── performance_optimization.py
│   └── README.md
└── requirements.txt            # Python 패키지 의존성
```

## 학습 순서 (권장)

### Phase 1: Python 기초 다지기 (1-2주)
**목표**: Python 문법과 기본 개념을 완벽하게 이해

1. **01_python_basics/** - Python 기본 문법
   - 변수, 자료형, 연산자
   - 제어문 (if, for, while)
   - 함수와 람다
   - 클래스와 객체지향 프로그래밍
   - 모듈과 패키지

2. **02_python_intermediate/** - Python 중급 개념
   - 데코레이터의 이해와 활용
   - 제너레이터와 이터레이터
   - 컨텍스트 매니저
   - 컴프리헨션 (list, dict, set)
   - 함수형 프로그래밍 기법

3. **03_python_advanced/** - Python 고급 주제
   - 메타클래스와 디스크립터
   - 비동기 프로그래밍 (async/await)
   - 디자인 패턴 (Singleton, Factory, Observer 등)
   - 타입 힌트와 정적 타입 검사

### Phase 2: Django 기초 (2-3주)
**목표**: Django의 MTV 패턴과 기본 기능 습득

4. **04_django_basics/** - Django 기초
   - Django 프로젝트 구조 이해
   - MTV (Model-Template-View) 패턴
   - URL 라우팅과 뷰 함수
   - 템플릿 엔진 사용법
   - 정적 파일 관리
   - 간단한 블로그 CRUD 구현

### Phase 3: Django 중급 (3-4주)
**목표**: Django ORM과 폼, 인증 시스템 마스터

5. **05_django_intermediate/** - Django 중급
   - ORM 심화 (쿼리 최적화, Prefetch, Select Related)
   - Form과 ModelForm 활용
   - 사용자 인증과 권한 관리
   - 미들웨어 작성
   - 시그널 활용
   - CBV (Class-Based Views)
   - REST API 구현 기초

### Phase 4: Django 고급 & 클린 아키텍처 (4-5주)
**목표**: 엔터프라이즈급 애플리케이션 아키텍처 구현

6. **06_django_advanced/** - Django 고급 & 클린 아키텍처
   - 클린 아키텍처 적용 (계층 분리)
   - DDD (Domain-Driven Design) 패턴
   - CQRS (Command Query Responsibility Segregation)
   - Repository 패턴
   - Service 계층 설계
   - 비동기 처리 (Celery, Django Channels)
   - 캐싱 전략 (Redis, Memcached)
   - 성능 최적화

### Phase 5: 테스트와 품질 관리 (2주)
**목표**: 테스트 주도 개발과 코드 품질 확보

7. **07_testing/** - 테스트 전략
   - Unit Test 작성
   - Integration Test
   - Pytest 활용
   - Mock과 Stub
   - Test Coverage
   - TDD (Test-Driven Development) 실습

### Phase 6: 베스트 프랙티스 (지속적)
**목표**: 실무에서 바로 활용 가능한 고급 기술

8. **08_best_practices/** - 베스트 프랙티스
   - SOLID 원칙 실전 적용
   - 디자인 패턴 활용
   - 코드 리뷰 체크리스트
   - 보안 베스트 프랙티스
   - 성능 최적화 기법
   - 로깅과 모니터링

## 환경 설정

### 1. Python 설치
```bash
# Python 3.11+ 권장
python3 --version
```

### 2. 가상환경 생성
```bash
# 프로젝트 루트에서 실행
python3 -m venv venv

# 가상환경 활성화
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate
```

### 3. 패키지 설치
```bash
pip install -r requirements.txt
```

## 실습 프로젝트

### 기본 블로그 시스템 (Phase 2)
- 게시글 CRUD
- 사용자 인증
- 댓글 기능
- 카테고리/태그

### 향상된 블로그 시스템 (Phase 3)
- ORM 최적화
- REST API
- 검색 기능
- 페이지네이션
- 파일 업로드

### 엔터프라이즈 블로그 시스템 (Phase 4)
- 클린 아키텍처 적용
- DDD 패턴 구현
- 비동기 처리
- 캐싱 전략
- 성능 최적화

## 학습 팁

### 1. 코드를 직접 타이핑하세요
- 복사-붙여넣기 대신 직접 타이핑하면서 코드의 구조를 체득하세요.
- 에러를 직접 만나고 해결하는 과정이 가장 좋은 학습입니다.

### 2. 주석을 읽고 이해하세요
- 각 파일에는 10년차 시니어 개발자의 관점에서 작성된 상세한 주석이 있습니다.
- 단순히 "어떻게"가 아닌 "왜"를 설명합니다.

### 3. 실험하고 변형하세요
- 예제 코드를 변경해보고 어떻게 동작하는지 관찰하세요.
- 새로운 기능을 추가해보세요.

### 4. 테스트 코드를 작성하세요
- 각 기능에 대한 테스트를 작성하면서 코드의 동작을 검증하세요.
- TDD를 실천하면 더 견고한 코드를 작성할 수 있습니다.

### 5. 공식 문서를 참고하세요
- [Python 공식 문서](https://docs.python.org/3/)
- [Django 공식 문서](https://docs.djangoproject.com/)

## 추천 학습 자료

### 책
- "Fluent Python" by Luciano Ramalho - Python 심화
- "Two Scoops of Django" - Django 베스트 프랙티스
- "Clean Architecture" by Robert C. Martin - 소프트웨어 아키텍처
- "Domain-Driven Design" by Eric Evans - DDD 패턴

### 온라인 리소스
- Real Python - 실전 Python 튜토리얼
- Django Girls Tutorial - Django 입문
- Test-Driven Development with Python - TDD 학습

## 프로젝트 실행

### Django 프로젝트 실행
```bash
# 04_django_basics/blog_project 디렉토리로 이동
cd 04_django_basics/blog_project

# 데이터베이스 마이그레이션
python manage.py migrate

# 개발 서버 실행
python manage.py runserver

# 브라우저에서 http://127.0.0.1:8000/ 접속
```

## 문의 및 피드백

이 튜토리얼은 지속적으로 개선됩니다. 질문이나 개선 제안이 있으면 언제든지 문의해주세요.

## 라이센스

이 프로젝트는 학습 목적으로 자유롭게 사용할 수 있습니다.

---

**시작할 준비가 되셨나요?**

`01_python_basics/README.md`를 열고 Python 여정을 시작하세요!

**Remember**: 프로그래밍은 마라톤이지 스프린트가 아닙니다. 꾸준히, 그리고 즐겁게 학습하세요!
