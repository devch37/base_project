# Phase 4: Django 기초

## 프로젝트 개요
Django 프레임워크의 기본 개념을 학습하고, 간단한 블로그 시스템을 구현합니다.

## 학습 목표
- Django의 MTV (Model-Template-View) 패턴 이해
- 모델을 통한 데이터베이스 설계
- URL 라우팅과 뷰 작성
- 템플릿을 활용한 동적 페이지 생성
- Django Admin 활용

## 프로젝트 시작하기

### 1. 가상환경 활성화
```bash
# 프로젝트 루트에서
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate    # Windows
```

### 2. Django 프로젝트 생성
```bash
cd 04_django_basics

# Django 프로젝트 생성
django-admin startproject blog_project .

# 앱 생성
cd blog_project
python manage.py startapp blog
python manage.py startapp users
```

### 3. 데이터베이스 마이그레이션
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. 슈퍼유저 생성
```bash
python manage.py createsuperuser
```

### 5. 개발 서버 실행
```bash
python manage.py runserver
```

브라우저에서 `http://127.0.0.1:8000/` 접속

## Django 프로젝트 구조

```
04_django_basics/
└── blog_project/
    ├── manage.py                # Django 관리 명령어 도구
    ├── blog_project/            # 프로젝트 설정 디렉토리
    │   ├── __init__.py
    │   ├── settings.py          # 프로젝트 설정
    │   ├── urls.py              # 루트 URL 설정
    │   ├── asgi.py              # ASGI 배포 설정
    │   └── wsgi.py              # WSGI 배포 설정
    ├── blog/                    # 블로그 앱
    │   ├── migrations/          # 데이터베이스 마이그레이션
    │   ├── __init__.py
    │   ├── admin.py             # Admin 설정
    │   ├── apps.py              # 앱 설정
    │   ├── models.py            # 데이터 모델
    │   ├── views.py             # 뷰 로직
    │   ├── urls.py              # 앱 URL 설정
    │   ├── forms.py             # 폼 정의
    │   ├── tests.py             # 테스트 코드
    │   └── templates/           # 템플릿 파일
    │       └── blog/
    └── users/                   # 사용자 앱
        ├── migrations/
        ├── __init__.py
        ├── admin.py
        ├── apps.py
        ├── models.py
        ├── views.py
        └── tests.py
```

## MTV 패턴 이해

### Model (모델)
- 데이터 구조 정의
- 데이터베이스와의 상호작용
- 비즈니스 로직 포함

### Template (템플릿)
- 사용자에게 보여지는 화면
- HTML + Django 템플릿 언어
- 동적 콘텐츠 렌더링

### View (뷰)
- 요청 처리 로직
- 모델과 템플릿을 연결
- HTTP 응답 반환

## 학습 단계

### 단계 1: 기본 설정 (1일차)
- Django 프로젝트 생성
- 앱 생성 및 등록
- 기본 URL 라우팅

### 단계 2: 모델 설계 (2일차)
- Article 모델 정의
- User 모델 확장
- 관계 설정 (ForeignKey, ManyToMany)
- 마이그레이션

### 단계 3: Admin 활용 (3일차)
- Admin 사이트 커스터마이징
- 모델 등록 및 설정
- 데이터 입력 및 관리

### 단계 4: 뷰와 URL (4-5일차)
- 함수 기반 뷰 (FBV)
- 클래스 기반 뷰 (CBV)
- URL 패턴 정의
- 동적 URL

### 단계 5: 템플릿 (6-7일차)
- 템플릿 상속
- 템플릿 태그와 필터
- 정적 파일 관리
- 폼 렌더링

### 단계 6: CRUD 구현 (8-10일차)
- 게시글 목록 (List)
- 게시글 상세 (Detail)
- 게시글 생성 (Create)
- 게시글 수정 (Update)
- 게시글 삭제 (Delete)

### 단계 7: 사용자 인증 (11-12일차)
- 회원가입
- 로그인/로그아웃
- 권한 확인
- 사용자별 게시글

## 주요 개념

### Django ORM
```python
# 모델 정의
class Article(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

# 쿼리
articles = Article.objects.all()
article = Article.objects.get(id=1)
articles = Article.objects.filter(title__contains='Django')
```

### URL 라우팅
```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('article/<int:pk>/', views.article_detail, name='article_detail'),
]
```

### 뷰 작성
```python
# views.py
from django.shortcuts import render, get_object_or_404
from .models import Article

def article_detail(request, pk):
    article = get_object_or_404(Article, pk=pk)
    return render(request, 'blog/detail.html', {'article': article})
```

### 템플릿
```django
<!-- detail.html -->
{% extends 'base.html' %}

{% block content %}
<h1>{{ article.title }}</h1>
<p>{{ article.content }}</p>
<small>작성일: {{ article.created_at|date:"Y-m-d H:i" }}</small>
{% endblock %}
```

## 실습 프로젝트: 블로그 시스템

### 기능 명세
1. **게시글 관리**
   - 게시글 목록 조회
   - 게시글 상세 조회
   - 게시글 작성 (로그인 필요)
   - 게시글 수정 (작성자만)
   - 게시글 삭제 (작성자만)

2. **사용자 관리**
   - 회원가입
   - 로그인/로그아웃
   - 프로필 조회

3. **댓글 기능**
   - 댓글 작성
   - 댓글 목록 조회

4. **카테고리/태그**
   - 카테고리별 게시글
   - 태그별 게시글

## 참고 자료
- [Django 공식 문서](https://docs.djangoproject.com/)
- [Django Girls Tutorial](https://tutorial.djangogirls.org/)
- [Two Scoops of Django](https://www.feldroy.com/books/two-scoops-of-django-3-x)

## 다음 단계
Django 기초를 완료했다면 `05_django_intermediate/`로 이동하여 중급 개념을 학습하세요.

## 실행 명령어 모음

```bash
# 새 앱 생성
python manage.py startapp app_name

# 마이그레이션 파일 생성
python manage.py makemigrations

# 마이그레이션 적용
python manage.py migrate

# 슈퍼유저 생성
python manage.py createsuperuser

# 개발 서버 실행
python manage.py runserver

# Python Shell 실행
python manage.py shell

# 테스트 실행
python manage.py test

# 정적 파일 수집
python manage.py collectstatic
```
