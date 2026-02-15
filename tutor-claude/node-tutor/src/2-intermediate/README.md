# 2단계: Intermediate - NestJS 고급 기능

> 1단계를 완료하셨나요? 이제 NestJS의 강력한 기능들을 배워봅시다!

## 이 단계에서 배울 내용

### 1. Middleware (미들웨어)
요청/응답 사이클에서 실행되는 함수
- HTTP 요청 로깅
- 요청 데이터 변환
- 인증 토큰 검증
- CORS 처리

### 2. Guards (가드)
라우트 접근 제어
- 인증 (Authentication): 사용자 식별
- 인가 (Authorization): 권한 확인
- JWT 토큰 검증
- Role-based Access Control

### 3. Interceptors (인터셉터)
요청/응답 변환 및 추가 기능
- 응답 데이터 가공
- 로깅 및 모니터링
- 캐싱
- 타임아웃 처리

### 4. Pipes (파이프)
입력 데이터 검증 및 변환
- class-validator로 자동 검증
- 데이터 변환 (string → number 등)
- Custom Validation
- 에러 메시지 커스터마이징

### 5. Exception Filters (예외 필터)
에러 처리 및 응답 표준화
- 전역 예외 처리
- Custom Exception
- 에러 로깅
- 클라이언트 친화적인 에러 응답

### 6. DTO & Validation
- class-validator 활용
- 중첩 검증
- 조건부 검증
- Custom Decorator

---

## 학습 순서

```
1. middleware/
   - logger.middleware.ts
   - auth.middleware.ts

2. guards/
   - auth.guard.ts
   - roles.guard.ts

3. interceptors/
   - logging.interceptor.ts
   - transform.interceptor.ts
   - timeout.interceptor.ts

4. pipes/
   - validation.pipe.ts
   - parse-int.pipe.ts

5. filters/
   - http-exception.filter.ts
   - all-exceptions.filter.ts

6. dto/
   - validation examples
```

---

## 실행 방법

```bash
npm run start:intermediate
```

---

## 다음 단계

이 단계를 완료하면:
- 실무에서 바로 사용 가능한 기능 구현 가능
- 견고한 API 설계
- 프로덕션 레벨의 에러 처리
- 3단계(Advanced)로 진행 준비 완료

---

**주의**: 이 폴더는 현재 구조만 준비되어 있습니다.
1단계를 먼저 완료하고, 필요하다면 추가 학습 자료를 요청하세요!
