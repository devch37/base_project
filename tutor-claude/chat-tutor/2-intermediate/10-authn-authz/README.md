# 10. 인증과 인가 — 쿠키·세션 vs 토큰

## 이 장의 목표
- **인증(Authentication, 너 누구야?)** 과 **인가(Authorization, 너 이거 해도 돼?)** 를 구분하고 401/403 과 짝지을 수 있다.
- 쿠키·세션 방식과 토큰 방식의 동작, 장단점을 비교할 수 있다.
- 이 프로젝트가 왜 WebSocket 인증에 **토큰**을 쓰는지 설명할 수 있다.

## 프로젝트에서 이 장의 자리
상담 서버는 "이 연결이 **고객 c-100** 인지, **상담사 agent-1** 인지"(인증)를 알아야 하고,
"c-100 은 자기 방 r-1 만, agent-1 은 배정된 방만"(인가)을 지켜야 한다.
그런데 고객은 **다른 회사(고객사) 사이트**에서 로그인한 사람이다. 우리 서버는 그 로그인 세션을 볼 수 없다.

---

## 1. 인증 vs 인가

| | 인증 (AuthN) | 인가 (AuthZ) |
|---|---|---|
| 질문 | 너 누구야? | 너 이거 해도 돼? |
| 실패하면 | **401** Unauthorized (이름과 달리 "인증 안 됨") | **403** Forbidden |
| 클라이언트의 대응 | 다시 로그인 / 새 토큰 | 권한 요청, 다른 행동 |
| 이 프로젝트 | JWT 검증 (STOMP CONNECT) | 방·역할 검사 (SUBSCRIBE/SEND) |
| 순서 | 먼저 | 인증된 뒤에 |

## 2. 쿠키·세션 방식

```
1) POST /login (아이디·비번) ───────────▶ 서버: 세션 생성 { id: "abc123", userId: "kim" } (서버 메모리/저장소)
   ◀── Set-Cookie: JSESSIONID=abc123; HttpOnly; Secure; SameSite=Lax
2) GET /me  Cookie: JSESSIONID=abc123 ──▶ 서버: 세션 저장소에서 abc123 조회 → kim
```
- **상태가 서버에 있다(stateful).** 쿠키에는 의미 없는 ID 만.
- 장점: 서버가 세션을 지우면 **즉시 로그아웃**(무효화 쉬움). 브라우저가 쿠키를 **자동으로** 붙인다.
- 단점:
  - 서버가 여러 대면 세션을 공유해야 한다 (sticky session 이나 공유 저장소, 23장).
  - 쿠키는 **도메인에 묶인다.** 고객사 도메인의 쿠키를 우리 서버는 못 받는다.
  - 자동으로 붙는다는 장점이 곧 **CSRF/CSWSH** 위험이다 (22장).

### ★ 쿠키 속성
| 속성 | 의미 |
|---|---|
| `HttpOnly` | JS 가 `document.cookie` 로 읽을 수 없음 → XSS 로 세션 탈취 어렵게 |
| `Secure` | HTTPS 에서만 전송 |
| `SameSite=Lax/Strict/None` | 다른 사이트에서 시작된 요청에 쿠키를 붙일지. `None` 이면 다른 사이트 요청에도 붙음(+Secure 필수) |
| `Domain`, `Path` | 어느 주소에 보낼지 |

## 3. 토큰 방식

```
1) 로그인 → 서버가 토큰 발급: "kim, CUSTOMER, 방 r-1, 15분 뒤 만료" + 서명
2) 요청마다 Authorization: Bearer <토큰> ──▶ 서버: 서명만 검증 → kim (저장소 조회 없음)
```
- **상태가 토큰 안에 있다(stateless).** 서버는 비밀키만 있으면 어느 서버든 검증할 수 있다.
- 장점: 서버 여러 대에 유리, **다른 도메인**으로도 쉽게 전달, CSRF 에 강함(자동으로 안 붙으니까).
- 단점: 발급한 토큰을 **중간에 무효화하기 어렵다** → 짧은 만료 + 갱신 + (필요하면) 폐기 목록. 저장 위치(메모리/localStorage)에 따라 XSS 에 노출.

## 4. 이 프로젝트의 선택

```
[고객 브라우저] ──(고객사 쿠키 세션으로 로그인)──▶ [고객사 서버]
       ▲                                          │ X-Api-Key (서버↔서버, 11장)
       │                     JWT                   ▼
       └─────────────────────────────────── [우리 상담 서버 /internal/tokens]
[고객 브라우저] ── WebSocket + STOMP CONNECT (Authorization: Bearer JWT) ──▶ [우리 상담 서버]
```
- 고객은 **고객사 쿠키 세션**으로 로그인 (고객사의 일)
- 고객사 서버가 우리에게 "이 사람 몫의 토큰을 줘" 요청 → **JWT** 발급
- 브라우저는 JWT 를 **메모리**에 들고 WebSocket CONNECT 에 넣는다

왜 쿠키가 아니라 토큰인가:
1. 고객사 도메인 ≠ 우리 도메인 → 고객사 쿠키를 우리가 못 받는다.
2. 우리 서버도 여러 대다 → 서명 검증만으로 어느 서버든 OK.
3. 쿠키는 자동 전송이라 다른 사이트가 몰래 WebSocket 을 열면(CSWSH) 쿠키가 따라간다. 토큰은 JS 가 명시적으로 넣어야 한다.

---

## 코드 읽기
- `server/secure-chat/.../demo/AuthStyleDemoController` — 같은 "내가 누구지?"를 세션 방식과 토큰 방식으로
- `server/secure-chat/.../auth/ChatPrincipal` — 인증된 사용자 객체 (`getName()` 이 `tenant:userId` 인 이유)
- 테스트 `SecureStompTest.토큰_방식_me는_Authorization_헤더만으로_동작한다` — 401 + `WWW-Authenticate: Bearer`

## 직접 해 보기
```bash
./gradlew :server:secure-chat:bootRun

# 세션 방식: -c/-b 로 쿠키를 저장·전송
curl -i -c /tmp/jar -X POST 'localhost:8080/demo/session/login?userId=kim'   # Set-Cookie: JSESSIONID=...
curl -s -b /tmp/jar localhost:8080/demo/session/me                           # 쿠키만으로 kim
curl -s localhost:8080/demo/session/me                                       # 쿠키 없음 → 401
curl -s -b /tmp/jar -X POST localhost:8080/demo/session/logout
curl -s -b /tmp/jar localhost:8080/demo/session/me                           # 서버가 무효화 → 401

# 토큰 방식: 고객사 백엔드 역할로 토큰 발급 (11장에서 자세히)
TOKEN=$(curl -s -X POST localhost:8080/internal/tokens -H 'X-Api-Key: dev-acme-key' -H 'Content-Type: application/json' \
  -d '{"userId":"agent-1","role":"AGENT"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s localhost:8080/demo/token/me -H "Authorization: Bearer $TOKEN"
curl -i localhost:8080/demo/token/me                                         # 401 + WWW-Authenticate: Bearer
```
- 세션 방식은 서버를 **재시작**하면? (메모리 세션이 사라져 다시 401)
- 토큰 방식은 서버 재시작 후에도 같은 토큰이 통하나? (비밀키가 같으면 통한다 — stateless)

## 자주 하는 실수
- 인증 실패에 403, 권한 없음에 401 (반대로 씀)
- JWT 를 쿠키에 넣고 "토큰 방식이라 CSRF 안전"이라고 믿음 → 쿠키에 넣는 순간 자동 전송된다.
- 토큰을 `localStorage` 에 장기간 보관 → XSS 한 번이면 탈취. 이 프로젝트는 **메모리에만** 두고, 필요하면 고객사 서버에서 다시 받는다.

## 확인 질문
1. 상담사가 퇴사했다. 세션 방식과 토큰 방식에서 각각 "지금 당장" 접근을 막는 방법은?
2. 401 응답에 붙는 `WWW-Authenticate` 헤더의 역할은?
3. 고객사 쿠키를 우리 서버가 받을 수 없는 이유를 01장의 개념으로 설명하라.

<details><summary>답</summary>

1. 세션: 세션 삭제. 토큰: 이미 발급된 토큰은 만료까지 유효 → 짧은 만료 + 서버 측 차단(12장의 강제 퇴장 4003, 배정 해제) 또는 폐기 목록.
2. "어떤 방식으로 인증하라"를 알려 준다 (예: Bearer).
3. 쿠키는 도메인(출처의 host)에 묶여 그 도메인으로 가는 요청에만 붙는다.
</details>

다음 → [11. JWT](../11-jwt/)
