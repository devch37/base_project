# 빠른 시작 (Quick Start)

## 1. 설치

```bash
cd nestjs-tutorial
npm install
cp .env.example .env
```

Node.js 20 이상 필요. 추가 인프라(DB 서버, Redis) 불필요 — SQLite 파일 DB.

## 2. 예제 데이터 넣기 (선택)

```bash
npm run seed
```
관리자 1명 + 사용자 2명 + 게시글 2개 + 댓글 2개가 생성됩니다.
- `admin@example.com` (관리자)
- `alice@example.com`, `bob@example.com`
- 공통 비밀번호: `Passw0rd!`

## 3. 실행

```bash
npm run start:dev      # 파일 변경 시 자동 재시작
```

- API 루트: http://localhost:3000/api
- **Swagger 문서: http://localhost:3000/api/docs**
- 헬스체크: http://localhost:3000/api/health

## 4. API 훑어보기 (curl)

```bash
# 회원가입 (토큰 발급됨)
curl -X POST localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"me@ex.com","nickname":"나","password":"Passw0rd!"}'

# 로그인 → 액세스 토큰 저장
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"me@ex.com","password":"Passw0rd!"}' \
  | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')

# 내 정보
curl localhost:3000/api/users/me -H "Authorization: Bearer $TOKEN"

# 게시글 작성
curl -X POST localhost:3000/api/posts -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"첫 글","content":"내용","tags":["nestjs","study"]}'

# 게시글 목록 (비로그인 가능, 검색/페이지네이션)
curl 'localhost:3000/api/posts?page=1&limit=10&search=첫'

# 댓글 작성
curl -X POST localhost:3000/api/posts/1/comments -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"content":"좋은 글!"}'
```

## 5. 학습 시작

```
docs/00-환경설정과-첫-실행.md  부터 순서대로
```

## 6. 주요 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/auth/register` | ❌ | 회원가입 |
| POST | `/api/auth/login` | ❌ | 로그인 |
| POST | `/api/auth/refresh` | (refresh 토큰) | 액세스 토큰 갱신 |
| POST | `/api/auth/logout` | ✅ | 로그아웃 |
| GET | `/api/users/me` | ✅ | 내 정보 |
| GET | `/api/users` | ✅ 관리자 | 전체 사용자 |
| GET | `/api/posts` | ❌ | 목록 (검색/필터/페이지네이션) |
| GET | `/api/posts/:id` | ❌ | 단건 (조회수 +1) |
| POST | `/api/posts` | ✅ | 작성 |
| PATCH/DELETE | `/api/posts/:id` | ✅ 작성자/관리자 | 수정/삭제 |
| GET | `/api/posts/:postId/comments` | ❌ | 댓글 목록 |
| POST | `/api/posts/:postId/comments` | ✅ | 댓글 작성 |
| PATCH/DELETE | `/api/comments/:id` | ✅ 작성자/관리자 | 댓글 수정/삭제 |
| GET | `/api/health` `/api/health/ready` | ❌ | 헬스체크 |

## 7. 문제 해결

| 증상 | 해결 |
|------|------|
| `JWT_ACCESS_SECRET ... is required` | `.env` 파일을 만들었는지 확인 (`cp .env.example .env`) |
| `better-sqlite3` 설치 실패 | Xcode CLT / build-essential 필요. `npm i` 재시도 |
| 포트 충돌 | `.env` 의 `PORT` 변경 |
| DB를 초기화하고 싶음 | `rm -f data/dev.sqlite && npm run seed` |
| 테스트가 안 끝남 | 정상 종료됨(약 2초). 계속 매달리면 `npm test -- --forceExit` |
