# Phase 6: Best Practices - 실무 베스트 프랙티스

## 개요
10년차 시니어 개발자의 경험을 바탕으로 한 Python과 Django의 실무 베스트 프랙티스입니다.

## 학습 목표
- SOLID 원칙을 코드에 적용
- DDD 패턴으로 도메인 로직 설계
- 성능 최적화 기법 습득
- 보안 베스트 프랙티스 이해
- 유지보수 가능한 코드 작성

## 내용 구성

### 1. SOLID 원칙 (solid_principles.py)
**핵심 내용**:
- **S**ingle Responsibility Principle (단일 책임 원칙)
- **O**pen/Closed Principle (개방/폐쇄 원칙)
- **L**iskov Substitution Principle (리스코프 치환 원칙)
- **I**nterface Segregation Principle (인터페이스 분리 원칙)
- **D**ependency Inversion Principle (의존성 역전 원칙)

### 2. DDD 패턴 (ddd_patterns.py)
**핵심 내용**:
- Entity vs Value Object
- Aggregate와 Aggregate Root
- Repository 패턴
- Domain Service
- Application Service
- Domain Events

### 3. 성능 최적화 (performance_optimization.py)
**핵심 내용**:
- Django ORM 쿼리 최적화
- 캐싱 전략 (Redis, Memcached)
- 데이터베이스 인덱싱
- N+1 문제 해결
- 비동기 처리
- 프로파일링과 모니터링

### 4. 보안 베스트 프랙티스
**핵심 내용**:
- SQL Injection 방지
- XSS (Cross-Site Scripting) 방지
- CSRF (Cross-Site Request Forgery) 방지
- 인증과 권한 관리
- 민감 정보 보호
- HTTPS 사용

### 5. 코드 품질
**핵심 내용**:
- 코드 리뷰 체크리스트
- 린팅과 포맷팅 (Black, Flake8, Pylint)
- 타입 힌트와 MyPy
- 문서화 (Docstring, Sphinx)
- 로깅 전략

### 6. 테스트 전략
**핵심 내용**:
- 테스트 피라미드
- Unit Test, Integration Test, E2E Test
- Test Fixtures와 Factories
- Mocking과 Patching
- Test Coverage

## 실무 팁 모음

### Python 코딩 스타일
```python
# Good: 명확하고 의도가 드러나는 코드
def calculate_user_total_orders(user_id: int) -> int:
    """사용자의 총 주문 수를 계산합니다."""
    return Order.objects.filter(user_id=user_id).count()

# Bad: 불명확한 이름과 타입 힌트 없음
def calc(x):
    return Order.objects.filter(user_id=x).count()
```

### Django 모델 설계
```python
# Good: 비즈니스 로직을 모델에 포함
class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)

    def can_cancel(self) -> bool:
        """주문 취소 가능 여부"""
        return self.status in ['pending', 'processing']

    def calculate_discount(self) -> Decimal:
        """할인 금액 계산"""
        if self.total_amount > 100000:
            return self.total_amount * Decimal('0.1')
        return Decimal('0')
```

### 쿼리 최적화
```python
# Bad: N+1 문제
articles = Article.objects.all()
for article in articles:
    print(article.author.name)  # 각 article마다 쿼리 발생!

# Good: select_related 사용
articles = Article.objects.select_related('author').all()
for article in articles:
    print(article.author.name)  # 한 번의 JOIN 쿼리

# Good: prefetch_related (ManyToMany, reverse ForeignKey)
articles = Article.objects.prefetch_related('tags').all()
for article in articles:
    for tag in article.tags.all():  # 추가 쿼리 없음
        print(tag.name)
```

### 예외 처리
```python
# Good: 구체적인 예외 처리
try:
    user = User.objects.get(email=email)
except User.DoesNotExist:
    logger.warning(f"User not found: {email}")
    return None
except User.MultipleObjectsReturned:
    logger.error(f"Multiple users found: {email}")
    raise

# Bad: 모든 예외를 잡음
try:
    user = User.objects.get(email=email)
except Exception:  # 너무 광범위!
    pass
```

### 환경 설정 관리
```python
# settings.py
from decouple import config

# Good: 환경 변수 사용
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
DATABASE_URL = config('DATABASE_URL')

# Bad: 하드코딩
SECRET_KEY = 'my-secret-key-123'  # 보안 위험!
DEBUG = True  # 프로덕션에서도?
```

### 서비스 계층 분리
```python
# services/user_service.py
class UserService:
    """사용자 관련 비즈니스 로직"""

    @staticmethod
    def register_user(email: str, password: str) -> User:
        """사용자 등록"""
        # 1. 유효성 검증
        if User.objects.filter(email=email).exists():
            raise ValidationError("이미 존재하는 이메일입니다")

        # 2. 사용자 생성
        user = User.objects.create_user(
            email=email,
            password=password
        )

        # 3. 환영 이메일 발송 (비동기)
        send_welcome_email.delay(user.id)

        # 4. 이벤트 발행
        user_registered.send(sender=User, user=user)

        return user

# views.py
def register(request):
    """뷰는 얇게 유지"""
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = UserService.register_user(
                email=form.cleaned_data['email'],
                password=form.cleaned_data['password']
            )
            return redirect('login')
    else:
        form = RegisterForm()
    return render(request, 'register.html', {'form': form})
```

## 코드 리뷰 체크리스트

### 일반
- [ ] 코드가 PEP 8 스타일 가이드를 따르는가?
- [ ] 변수/함수명이 명확하고 의미를 담고 있는가?
- [ ] 타입 힌트가 적절히 사용되었는가?
- [ ] 문서화(Docstring)가 충분한가?
- [ ] 에러 처리가 적절한가?

### Django 특화
- [ ] 쿼리가 최적화되어 있는가? (N+1 문제 없는가?)
- [ ] 민감한 정보가 하드코딩되어 있지 않은가?
- [ ] CSRF, XSS 보안이 고려되었는가?
- [ ] 테스트 코드가 작성되었는가?
- [ ] 마이그레이션이 안전한가? (데이터 손실 위험 없는가?)

### 아키텍처
- [ ] 단일 책임 원칙을 따르는가?
- [ ] 계층이 명확히 분리되어 있는가?
- [ ] 의존성이 올바른 방향인가?
- [ ] 비즈니스 로직이 적절한 위치에 있는가?

## 권장 도구

### 코드 품질
- **Black**: 코드 포맷터
- **Flake8**: 린터
- **Pylint**: 정적 분석
- **MyPy**: 타입 체커
- **isort**: Import 정렬

### 테스팅
- **pytest**: 테스트 프레임워크
- **pytest-django**: Django 테스트
- **pytest-cov**: 커버리지
- **factory_boy**: 테스트 데이터 생성

### 보안
- **bandit**: 보안 취약점 검사
- **django-environ**: 환경 변수 관리
- **django-cors-headers**: CORS 설정

### 성능
- **django-debug-toolbar**: 디버그 도구
- **silk**: 프로파일링
- **locust**: 부하 테스트

## 학습 리소스

### 책
- "Clean Code" by Robert C. Martin
- "Design Patterns" by Gang of Four
- "Domain-Driven Design" by Eric Evans
- "Two Scoops of Django"

### 온라인
- [Django Best Practices](https://django-best-practices.readthedocs.io/)
- [Real Python](https://realpython.com/)
- [Awesome Django](https://github.com/wsvincent/awesome-django)

## 다음 단계

베스트 프랙티스를 학습한 후:
1. 기존 프로젝트를 리팩토링해보세요
2. 오픈소스 프로젝트에 기여해보세요
3. 실제 프로젝트를 진행하며 적용해보세요

**Remember**: 베스트 프랙티스는 상황에 따라 다를 수 있습니다.
맹목적으로 따르기보다는 '왜'를 이해하고 적절히 적용하세요!
