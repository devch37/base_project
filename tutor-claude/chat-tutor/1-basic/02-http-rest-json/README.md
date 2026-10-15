# 02. HTTP 요청·응답과 REST — GET · POST · 상태 코드 · 헤더 · JSON · fetch

## 이 장의 목표
- HTTP 요청/응답의 네 부분(첫 줄, 헤더, 빈 줄, 본문)을 말할 수 있다.
- GET 과 POST 의 차이를 "안전성·멱등성"으로 설명할 수 있다.
- 상황에 맞는 상태 코드를 고르고, `fetch` 로 JSON API 를 호출할 수 있다.

## 프로젝트에서 이 장의 자리
- 고객 페이지 → 고객사 백엔드: `POST /tenant/customer/session` (상담 시작)
- 고객사 백엔드 → 우리 서버: `POST /internal/rooms`, `POST /internal/tokens` (06·11장)
- 상담사 콘솔 → 방 목록: `GET /tenant/rooms`

실시간 메시지는 WebSocket 으로 가지만, **준비 작업(방 만들기, 토큰 받기, 목록 보기)은 전부 평범한 REST API** 다.

---

## 1. 요청과 응답의 모양

```
POST /api/rooms HTTP/1.1                 ← 요청 줄: 메서드  경로  버전
Host: localhost:8080                     ← 헤더들
Content-Type: application/json              (본문이 어떤 형식인지)
Content-Length: 41                          (본문 바이트 수 — 14장)
                                         ← 빈 줄 = "헤더 끝"
{"customerId":"c-1","topic":"카드 분실"}   ← 본문
```
```
HTTP/1.1 201 Created                     ← 상태 줄: 버전  상태 코드  설명
Location: /api/rooms/3f2a...             ← "새로 만든 자원은 여기"
Content-Type: application/json

{"id":"3f2a...","customerId":"c-1",...}
```

## 2. 메서드: GET vs POST (★ 안전성·멱등성)

| 메서드 | 의미 | 안전(서버 상태 안 바꿈) | 멱등(여러 번 = 한 번) | 본문 |
|---|---|---|---|---|
| GET | 조회 | O | O | 보통 없음 |
| POST | 생성·처리 요청 | X | **X** | 있음 |
| PUT | 전체 교체 | X | O | 있음 |
| DELETE | 삭제 | X | O | 보통 없음 |

**멱등성이 왜 중요한가?** 네트워크가 불안정하면 "응답을 못 받았는데 서버는 처리했을 수도" 있다.
- GET 은 다시 보내도 안전하다 → **재시도 가능** (06장 CrmClient 가 GET 만 재시도하는 이유)
- POST 를 다시 보내면 방이 두 개 생길 수 있다 → 재시도하려면 "멱등 키" 같은 장치가 필요하다 (⏭ 고급)

## 3. 상태 코드 고르기

| 코드 | 의미 | 이 프로젝트의 예 |
|---|---|---|
| 200 OK | 성공 | 방 조회 |
| 201 Created | 새로 만들어짐 + `Location` | 방 생성 (`RoomController.create`) |
| 400 Bad Request | 요청 모양이 틀림 | 필수 필드 누락 |
| 401 Unauthorized | **누구인지 모름** (인증 실패) | API 키 틀림 (10장) |
| 403 Forbidden | 누구인지는 아는데 **권한 없음** (인가 실패) | (10장) |
| 404 Not Found | 그런 자원 없음 | 없는 방, **남의 고객사 방도 404** (존재를 숨김, 12장) |
| 415 Unsupported Media Type | 본문 형식(Content-Type)을 처리 못 함 | JSON 이 아님 |
| 422 Unprocessable | 모양은 맞는데 업무 규칙상 불가 | 영업시간 외 상담 (05장) |
| 500 / 502 / 503 / 504 | 서버 쪽 문제 | 06장에서 재시도 대상 |

> 4xx = "**네(클라이언트) 요청**을 고쳐라", 5xx = "**내(서버) 사정**이다". 이 구분이 06장 재시도 판단의 기준이 된다.

## 4. 헤더 — 본문 밖의 정보

자주 보게 될 헤더: `Content-Type`, `Content-Length`, `Authorization: Bearer ...`(11장), `Origin`(22장), `Cookie`/`Set-Cookie`(10장),
`Upgrade: websocket`(07장), `X-Api-Key`(우리가 만든 사용자 정의 헤더, 11장).

## 5. JSON 과 REST

- **JSON**: 텍스트로 된 데이터 형식. 문자열은 반드시 `"`, 숫자/불리언/null/배열/객체.
- **REST**: "URL 은 자원(명사), 메서드는 행동(동사)" 이라는 설계 스타일.
  `POST /api/rooms`(방 만들기), `GET /api/rooms/{id}`(방 하나), `GET /api/rooms`(목록).
  `/api/createRoom` 처럼 동사를 URL 에 넣지 않는다.

## 6. fetch

```ts
const res = await fetch('/api/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customerId: 'c-1', topic: '카드 분실' }),
});
if (!res.ok) throw new Error(`${res.status}`);   // ★ fetch 는 404·500 이어도 throw 하지 않는다!
const room = await res.json();
```

- `fetch` 가 throw 하는 것은 **네트워크 자체가 실패**했을 때(서버 다운, DNS 실패, CORS 차단, 취소)뿐이다.
- 상태 코드 확인은 직접 해야 한다 (`web/apps/agent/main.ts` 의 `tenant()` 함수 참고).

---

## 코드 읽기
- `1-basic/02-http-rest-json/rest-demo.ts` — Node 로 만든 작은 REST 서버 + fetch 클라이언트.
- `server/spring-basics/.../room/RoomController.java` — 같은 일을 Spring 으로 (05장에서 자세히).
- `web/tenant-backend/server.ts` — 실제로 쓰이는 REST API.

## 직접 해 보기
```bash
npm run lab:02
```
1. 각 요청의 상태 코드를 **실행 전에** 예측해서 적어 보라.
2. 마지막 줄 "fetch 는 404 에도 throw 하지 않는다"를 확인하라.
3. (05장 이후) Spring 서버로 같은 일을:
   ```bash
   ./gradlew :server:spring-basics:bootRun
   curl -i -X POST localhost:8080/api/rooms -H 'Content-Type: application/json' -d '{"customerId":"c-1","topic":"카드 분실"}'
   curl -i -X POST localhost:8080/api/rooms -H 'Content-Type: application/json' -d '{"customerId":""}'
   ```
   두 번째 응답의 본문이 `ProblemDetail` 형식(`type`, `title`, `status`, `detail`)인 것을 확인.

## 자주 하는 실수
- `fetch` 결과를 `res.ok` 확인 없이 `res.json()` 한다 → 오류 본문을 정상 데이터로 착각.
- `Content-Type: application/json` 없이 JSON 문자열을 보낸다 → Spring 은 415 를 준다.
- 인증 실패에 403 을 준다 → 클라이언트가 "다시 로그인"해야 하는지(401) 판단할 수 없다.

## 확인 질문
1. 상담방 생성 API 가 타임아웃났다. 클라이언트가 그냥 다시 POST 해도 될까?
2. 고객이 남의 고객사 방 ID 로 조회했다. 403 과 404 중 무엇이 나을까?
3. `Content-Length: 41` 의 41 은 글자 수인가 바이트 수인가?

<details><summary>답</summary>

1. 위험하다. 첫 요청이 사실 처리됐다면 방이 두 개 생긴다. POST 는 멱등이 아니다.
2. 404 가 낫다. 403 은 "그 방이 존재한다"는 정보를 흘린다 (`InternalApiController.ownRoom`).
3. 바이트 수. 한글 한 글자는 UTF-8 로 3바이트다 (14장).
</details>

다음 → [03. 비동기 JavaScript](../03-async-js/)
