# 21. HTTP/HTTPS · WS/WSS · TLS, 프록시와 WebSocket upgrade

## 이 장의 목표
- HTTPS/WSS 가 HTTP/WS 위에 TLS 를 씌운 것임을 설명하고, 운영에서 왜 반드시 써야 하는지 안다.
- 리버스 프록시(nginx·로드밸런서)가 WebSocket 을 통과시키려면 무엇이 필요한지 안다.
- ★ 프록시의 **idle timeout** 과 STOMP heartbeat 의 관계를 실측으로 이해한다.

## 프로젝트에서 이 장의 자리
운영 구조: 브라우저 ─(wss)─▶ 로드밸런서/nginx (TLS 종료) ─(ws)─▶ Spring 서버 여러 대.
개발 중에는 Vite 가 같은 역할(프록시)을 한다 (`web/vite.config.ts` 의 `ws: true`).

---

## 1. HTTP/HTTPS, WS/WSS, TLS

| | 평문 | 암호화 |
|---|---|---|
| 웹 페이지·API | `http://` (80) | `https://` (443) |
| WebSocket | `ws://` (80) | `wss://` (443) |

`https`/`wss` = 같은 프로토콜을 **TLS 터널** 안에서. TLS 가 주는 것:
- **기밀성**: 중간(카페 와이파이, ISP)에서 내용을 못 본다 → Bearer 토큰·화면 데이터 보호 (11장: 토큰은 "가진 사람이 주인")
- **무결성**: 중간에서 못 고친다
- **서버 인증**: 인증서로 "진짜 chat.example.com" 임을 확인

규칙:
- **https 페이지에서 `ws://` 로 연결하면 브라우저가 막는다**(mixed content). 페이지가 https 면 WebSocket 도 wss.
- SDK 는 페이지 프로토콜을 따라 고른다: `location.protocol === 'https:' ? 'wss' : 'ws'` (`web/apps/*/main.ts`)

### TLS 종료(termination)
보통 nginx·로드밸런서가 TLS 를 풀고(인증서 관리 한곳), 내부망에서는 평문으로 Spring 에 넘긴다.
그러면 Spring 은 "원래 요청이 https 였는지, 클라이언트 IP 가 뭔지"를 모른다 → 프록시가 `X-Forwarded-Proto`, `X-Forwarded-For` 를 붙이고,
Spring 은 `server.forward-headers-strategy=framework`(또는 native) 로 그 헤더를 신뢰한다(**신뢰할 프록시 뒤에서만**).

## 2. 프록시와 WebSocket upgrade

`Upgrade`·`Connection` 은 **hop-by-hop 헤더**다 — 프록시는 기본적으로 다음 구간에 전달하지 않는다.
WebSocket 을 통과시키려면 명시적으로 넘겨야 한다:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```
Vite: `proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } }` — `ws: true` 가 같은 일을 한다.

## 3. ★ idle timeout vs heartbeat (실측)

프록시는 **한동안 바이트가 안 흐르는 연결**을 끊는다 (nginx `proxy_read_timeout` 기본 60초, 클라우드 LB 도 보통 60~350초).
상담사가 화면만 보고 고객이 아무것도 안 하면 연결이 조용해진다 → 프록시가 끊는다 → 1006 → 재연결 → 스냅샷… 이 반복.

`proxy-demo.ts --mode=idle` (15초 동안 조용하면 끊는 프록시) + `stomp-chat`(서버 heartbeat 10초) 실측:
```
heartbeat 0     → [15.1s] 연결 종료 code=1006
heartbeat 2000  → 30초 동안 살아 있음
```
그리고 **함정** — idle 을 5초로 줄이면 heartbeat 2000 을 요청한 클라이언트도 5초에 끊긴다:
협상된 실제 주기는 `max(클라이언트 2000, 서버 10000)` = **10초**라서 프록시의 5초보다 길다 (09장 협상 규칙).
→ 규칙: **협상된 heartbeat 주기 < 경로상 모든 프록시의 idle timeout** (보통 절반 이하로).

## 4. 그 밖의 프록시 주의점
- 메시지 크기·버퍼 한도 (18장 표의 "프록시" 층)
- 배포 시 프록시가 연결을 **한꺼번에** 끊으면 → 재연결 폭주 → jitter 가 중요 (09장)
- `/internal/**` 은 외부 프록시 경로에서 막고, 고객사 서버만 사설 경로로 (`nginx.conf` 참고)

---

## 코드 읽기
- `4-practical/21-tls-proxy-upgrade/proxy-demo.ts` — Node 로 만든 리버스 프록시 (good / no-upgrade / idle / 라운드로빈)
- `4-practical/21-tls-proxy-upgrade/ws-through-proxy.ts` — 프록시 너머에서 연결 수명 재기
- `4-practical/21-tls-proxy-upgrade/nginx.conf` — 운영용 참고 설정 (**⚠ 이 저장소에서 nginx 로 실행 검증하지 않음**)
- `web/vite.config.ts` — 개발용 프록시

## 직접 해 보기
```bash
./gradlew :server:stomp-chat:bootRun                    # 터미널 1
npm run lab:21:proxy -- --mode=idle                     # 터미널 2 (15초 idle)
npm run lab:21:client -- --hb=0                         # 터미널 3: 15초 뒤 끊김
npm run lab:21:client -- --hb=2000                      #           30초 생존
# 함정 재현: 터미널 2 를 --mode=idle --idle=5 로 다시 띄우고 --hb=2000 → 왜 끊기나?
npm run lab:21:proxy -- --mode=no-upgrade               # Upgrade 를 안 넘기는 프록시 → WebSocket 오류
curl -s localhost:8888/api/rooms/r1/presence            # 일반 HTTP 는 잘 통과한다
```
(선택) 로컬 HTTPS: `mkcert` 로 인증서를 만들고 `nginx.conf` 경로를 바꿔 nginx 로 띄워 보자. https 페이지에서 `ws://` 로 연결하면 어떤 오류가 나는가?

## 자주 하는 실수
- https 사이트에 SDK 를 붙였는데 `ws://` 로 연결 → mixed content 차단
- 프록시에 Upgrade 헤더 설정 누락 → 핸드셰이크가 400/일반 응답으로 끝남
- heartbeat 를 끄거나 프록시 timeout 보다 길게
- `X-Forwarded-*` 를 아무 데서나 믿음 → 클라이언트가 IP·프로토콜을 위조

## 확인 질문
1. TLS 를 nginx 에서 종료하면 Spring 은 어떻게 "원래 https 였다"를 아나?
2. 서버 heartbeat 를 10초로 두고, 클라우드 LB idle timeout 이 60초면 안전한가?
3. 왜 `Upgrade` 헤더는 프록시가 "알아서" 넘기지 않나?

<details><summary>답</summary>

1. 프록시가 붙인 `X-Forwarded-Proto: https` 를 신뢰하도록 설정한다 (신뢰 가능한 프록시 뒤에서만).
2. 안전하다. 협상 주기 10초 < 60초.
3. hop-by-hop 헤더는 "바로 옆 구간"에만 의미가 있어서, 프록시는 기본적으로 다음 구간에 전달하지 않는다.
</details>

다음 → [22. 브라우저 보안과 개인정보](../22-browser-security-privacy/)
