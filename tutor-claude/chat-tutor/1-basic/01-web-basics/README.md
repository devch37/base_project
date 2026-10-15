# 01. 웹 통신 기초 — 브라우저 · 서버 · 포트 · URL · Origin

## 이 장의 목표
- 브라우저가 주소창의 URL 하나로 **어느 컴퓨터의 어느 프로그램과** 대화하게 되는지 설명할 수 있다.
- HTTP 가 TCP 연결 위에 오가는 **약속된 형식의 텍스트**라는 것을 눈으로 본다.
- **Origin**(출처)이 무엇인지, 왜 이후 장(쿠키·CORS·WebSocket 보안)의 출발점인지 안다.

## 프로젝트에서 이 장의 자리
고객 페이지는 `https://shop.acme.com`, 상담 서버는 `wss://chat.our-solution.com` 처럼 **서로 다른 출처**에 있다.
이 "다른 출처" 사실 하나 때문에 CORS(22장), WebSocket Origin 검사(07·22장), 쿠키 대신 토큰을 쓰는 이유(10장)가 생긴다.

---

## 1. 브라우저와 서버

- **클라이언트(브라우저)**: 요청을 "보내는" 쪽. 사용자가 보는 화면을 그린다.
- **서버**: 요청을 "기다렸다가" 응답하는 프로그램. 우리 Spring 앱, Node 스크립트가 서버다.
- 같은 컴퓨터 안에서도 서버·클라이언트가 될 수 있다. `localhost` = "지금 이 컴퓨터".

## 2. URL 해부

```
https://chat.example.com:8443/api/rooms?page=2#top
└─┬─┘   └──────┬───────┘└─┬─┘└───┬───┘└──┬──┘└┬┘
scheme       host       port   path    query hash
```

| 부분 | 의미 | 서버로 가나? |
|---|---|---|
| scheme | 어떤 규칙으로 말할지: `http`, `https`, `ws`, `wss` | 연결 방식에 사용 |
| host | 어느 컴퓨터인지 (도메인 → **DNS** 가 IP 로 바꿔 준다) | Host 헤더로 감 |
| port | 그 컴퓨터의 **어느 프로그램**인지 (생략하면 http 80, https 443) | 연결 대상 |
| path | 서버 안의 어떤 자원인지 | 요청 줄에 포함 |
| query | 추가 조건 `?key=value&...` | 요청 줄에 포함 |
| hash | 페이지 안의 위치 | **안 간다** (브라우저 전용) |

### ★ DNS 와 TCP (원래 목록에 없지만 필요)
1. 브라우저는 `chat.example.com` 을 **DNS** 에 물어 IP 주소(예: `203.0.113.5`)를 얻는다.
2. 그 IP 의 443 포트로 **TCP 연결**을 맺는다 (3-way handshake). 이 연결은 "순서대로, 빠짐없이" 바이트를 나르는 관이다.
3. https 면 그 위에 **TLS** 암호화 터널을 만든다 (21장).
4. 그 관 안으로 **HTTP 텍스트**를 보낸다.

→ WebSocket(07장)도 이 TCP 연결을 "닫지 않고 계속 쓰는" 것이다. 그래서 TCP 를 먼저 감 잡아 두면 07장이 쉬워진다.

## 3. 포트 — 한 컴퓨터, 여러 프로그램

이 튜토리얼에서 동시에 뜨는 것들:

| 포트 | 프로그램 |
|---|---|
| 5173 | Vite 개발 서버 (브라우저가 보는 페이지) |
| 8080 | Spring 채팅 서버 |
| 3000 | 고객사 백엔드 (Node) |
| 5701 | Hazelcast 멤버끼리 통신 (23장) |

"포트가 이미 사용 중" 오류 = 같은 번호로 이미 다른 프로그램이 기다리고 있다는 뜻 → [TROUBLESHOOTING](../../docs/TROUBLESHOOTING.md).

## 4. Origin (출처)

> **Origin = scheme + host + port.** 셋이 모두 같아야 "같은 출처"다. path·query 는 상관없다.

| A | B | 같은 출처? | 이유 |
|---|---|---|---|
| `http://localhost:5173/a` | `http://localhost:5173/b?x=1` | 같음 | path·query 만 다름 |
| `http://localhost:5173` | `http://localhost:8080` | **다름** | port |
| `http://example.com` | `https://example.com` | **다름** | scheme |
| `https://example.com` | `https://api.example.com` | **다름** | host (서브도메인도 다른 host) |
| `https://example.com` | `https://example.com:443` | 같음 | 443 은 https 기본 포트 |

**왜 중요한가?** 브라우저는 "지금 페이지의 출처"를 기준으로 보안 규칙(Same-Origin Policy)을 적용한다.
- 다른 출처의 **HTTP 응답을 JS 가 읽으려면** 서버의 허락(CORS 헤더)이 필요하다 (22장).
- **WebSocket 은 이 규칙이 적용되지 않는다.** 대신 브라우저가 요청에 `Origin` 헤더를 실어 보내고, **서버가 직접 검사**해야 한다 (07·22장).

---

## 코드 읽기
- `1-basic/01-web-basics/raw-http-server.ts` — 프레임워크 없이 TCP 소켓으로 HTTP 를 주고받는다.
- `1-basic/01-web-basics/url-origin.ts` — URL 분해와 Origin 비교.

## 직접 해 보기
```bash
npm run lab:01:server                     # 터미널 1
curl -v "http://localhost:8000/hello?name=kim"   # 터미널 2
```
1. 서버 터미널에 찍힌 **요청 원문**에서 첫 줄(`GET /hello?name=kim HTTP/1.1`)과 헤더, 그리고 빈 줄을 찾아라. 줄바꿈이 `⏎`(CRLF)로 표시된다.
2. 같은 주소를 브라우저로 열어 보라. 브라우저가 보내는 헤더(`User-Agent`, `Accept-Language`, `Sec-Fetch-*`…)가 curl 보다 훨씬 많다.
3. `curl -v http://localhost:8000/#section` — `#section` 이 서버 로그에 보이는가? (안 보여야 정상)
4. `npm run lab:01:url` — 출력의 같음/다름 판정을 먼저 예측하고 맞춰 보자.

## 자주 하는 실수
- `localhost` 와 `127.0.0.1` 은 같은 컴퓨터지만 **다른 출처**다 (host 문자열이 다르므로). 쿠키도 따로 저장된다.
- URL 의 hash 는 서버로 안 간다. "서버에서 #뒤 값을 읽으려고" 해도 안 된다.
- Origin 판단을 `startsWith` 로 하면 `https://shop.example.com.evil.com` 이 통과한다 → 연습 01.

## 확인 질문
1. `https://acme.com/apply` 페이지의 JS 가 `wss://chat.solution.com/ws` 에 연결할 때, 서버가 받는 `Origin` 헤더 값은?
2. 포트를 생략한 `https://acme.com` 은 몇 번 포트로 연결되나?
3. 같은 출처인지 판단할 때 path 를 보지 않는 이유는?

<details><summary>답</summary>

1. `https://acme.com` — **페이지의** 출처가 실린다. WebSocket 주소가 아니다.
2. 443.
3. 출처는 "누가 만든 코드인가(어느 사이트인가)"의 단위이기 때문이다. 같은 사이트 안의 다른 경로는 같은 운영 주체로 본다.
</details>

## 연습
- `exercises/src/01-origin.ts` (originOf, sameOrigin, isAllowedOrigin)

다음 → [02. HTTP 요청·응답과 REST](../02-http-rest-json/)
