# 빠른 시작 가이드

> 5분 안에 NestJS 프로젝트를 실행하고 첫 번째 API를 호출해보세요!

## 1단계: 설치 및 실행 (2분)

```bash
# 1. 의존성 설치
npm install

# 2. 서버 실행
npm run start:basic
```

서버가 시작되면 다음과 같은 메시지가 보입니다:

```
╔═══════════════════════════════════════╗
║   🚀 NestJS Basic Server Started!   ║
╠═══════════════════════════════════════╣
║   📡 Server: http://localhost:3000    ║
║   📚 API Docs: http://localhost:3000/api ║
╚═══════════════════════════════════════╝
```

---

## 2단계: API 테스트 (3분)

### 방법 1: 브라우저에서 테스트

브라우저를 열고 다음 URL에 접속하세요:

```
http://localhost:3000/api/posts
```

게시글 목록이 JSON 형태로 표시됩니다!

### 방법 2: cURL로 테스트

터미널을 하나 더 열고 다음 명령어를 실행하세요:

```bash
# 모든 게시글 조회
curl http://localhost:3000/api/posts

# 특정 게시글 조회
curl http://localhost:3000/api/posts/1

# 게시글 생성
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"나의 첫 게시글","content":"NestJS 시작!","authorId":1}'

# 사용자 조회
curl http://localhost:3000/api/users
```

### 방법 3: Postman/Insomnia 사용

1. Postman 또는 Insomnia 설치
2. 새 Request 생성
3. URL: `http://localhost:3000/api/posts`
4. Method: GET
5. Send 버튼 클릭

---

## 3단계: 코드 살펴보기

### 첫 번째로 볼 파일들

```
✅ 1. syntax-reference.ts          ← TypeScript 문법 정리
✅ 2. src/1-basic/main.ts           ← 앱이 시작되는 곳
✅ 3. src/1-basic/app.module.ts     ← 모듈의 이해
✅ 4. src/1-basic/posts/posts.controller.ts  ← API 엔드포인트
✅ 5. src/1-basic/posts/posts.service.ts     ← 비즈니스 로직
```

각 파일을 열어보면 **상세한 한글 주석**이 있습니다!

---

## 4단계: 코드 수정해보기

### 실습 1: 새로운 엔드포인트 추가하기

`src/1-basic/posts/posts.controller.ts` 파일을 열고
다음 코드를 추가해보세요:

```typescript
@Get('my-first-endpoint')
myFirstEndpoint(): string {
  return '내가 만든 첫 번째 엔드포인트입니다!';
}
```

서버를 재시작하고 접속해보세요:
```
http://localhost:3000/api/posts/my-first-endpoint
```

### 실습 2: 샘플 데이터 추가하기

`src/1-basic/posts/posts.service.ts` 파일의 constructor에서
샘플 데이터를 추가해보세요.

---

## 5단계: 학습 계속하기

### 추천 학습 순서

1. **[LEARNING_GUIDE.md](./LEARNING_GUIDE.md)** 읽기
   - 전체 학습 로드맵 확인
   - 각 개념의 상세 설명

2. **1-basic 폴더 탐험**
   - 모든 파일을 순서대로 읽기
   - 주석을 따라가며 이해하기

3. **테스트 코드 보기**
   - `posts.service.spec.ts` 읽기
   - 테스트 실행: `npm test`

4. **직접 구현하기**
   - Comments 기능 추가해보기
   - Tags 기능 구현해보기

---

## 자주 하는 질문 (FAQ)

### Q: 서버를 수정할 때마다 재시작해야 하나요?

아니요! 개발 모드를 사용하세요:

```bash
npm run start:dev
```

파일을 수정하면 자동으로 서버가 재시작됩니다.

### Q: 포트를 변경하고 싶어요

```bash
PORT=4000 npm run start:basic
```

### Q: 에러가 발생했어요

1. 에러 메시지를 꼼꼼히 읽어보세요
2. TypeScript 에러는 보통 타입 문제입니다
3. `npm install`을 다시 실행해보세요
4. `node_modules`를 삭제하고 재설치해보세요

### Q: 다음에는 뭘 배우나요?

1단계를 마치면:
- 2-intermediate: Middleware, Guards, Interceptors
- 3-advanced: Clean Architecture, DDD, CQRS

---

## 유용한 명령어

```bash
# 개발 모드 (자동 재시작)
npm run start:dev

# 1단계 실행
npm run start:basic

# 테스트 실행
npm test

# 테스트 (자동 재실행)
npm run test:watch

# 빌드
npm run build
```

---

## 도움이 필요하면

1. **주석 읽기**: 모든 파일에 상세한 설명이 있습니다
2. **LEARNING_GUIDE.md**: 개념 설명과 가이드
3. **syntax-reference.ts**: 문법 참고
4. **NestJS 공식 문서**: https://docs.nestjs.com/

---

## 축하합니다! 🎉

NestJS 프로젝트를 성공적으로 실행했습니다!

이제 본격적으로 학습을 시작해보세요.

**즐거운 코딩 되세요!** 🚀
