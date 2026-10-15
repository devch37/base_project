# QUICK START

## 0. 준비물

| 도구 | 버전 | 확인 |
|---|---|---|
| Java (JDK) | 21 | `java -version` |
| Node.js | 20 이상 (WebSocket 내장은 22+, 권장 22~23) | `node -v` |
| Gradle | 설치 불필요 (`./gradlew` 가 받아 옴) | |
| Playwright Chromium | e2e 를 돌릴 때만 | `npx playwright install chromium` |

```bash
cd chat-tutor
npm install
./gradlew build -x test     # 처음 한 번: 의존성 다운로드 + 컴파일 (몇 분 걸릴 수 있다)
```

## 1. 한 번에 확인 (모두 통과하면 환경 OK)

```bash
./gradlew test              # 서버 5개 모듈 테스트
npm test                    # SDK 단위 테스트
npm run ex:solution         # 연습문제 해답 테스트
npm run typecheck
./gradlew :server:cobrowse-server:bootJar -q && npm run e2e   # 실제 브라우저 e2e (포트 18080~18082, 13000~13001, 15173~15174 사용)
```

## 2. 최종 프로젝트 데모 (터미널 3개)

```bash
./gradlew :server:cobrowse-server:bootRun      # ① 채팅 서버 :8080
npm run tenant                                  # ② 고객사 백엔드 :3000 (API 키 보관)
npm run dev                                     # ③ 웹 :5173
```
1. http://localhost:5173/apps/customer/ → 오른쪽 아래 위젯 **상담 시작**
2. 다른 창에서 http://localhost:5173/apps/agent/ → 대기열의 방 **배정받고 입장**
3. 고객 페이지에서 입력·스크롤·플랜 선택·수익자 추가 → 상담사 화면에 실시간 반영 (주민번호·카드번호는 `•••`)
4. 고객 위젯 **상담사 조작 허용** → 상담사가 복제 화면을 클릭·입력하면 고객 화면이 바뀐다
5. 양쪽 채팅

허브 페이지: http://localhost:5173/ — 모든 실습 페이지 링크

## 3. 장별 실행 명령

| 장 | 서버 | 그 밖에 |
|---|---|---|
| 01 | — | `npm run lab:01:server` + `curl -v localhost:8000/hello`, `npm run lab:01:url` |
| 02 | — | `npm run lab:02` |
| 03 | — | `npm run lab:03`, `npm run lab:03:promise` |
| 04 | — | `npm run lab:04` |
| 05~06 | `./gradlew :server:spring-basics:bootRun` | curl 예시는 각 README |
| 07 | `./gradlew :server:raw-websocket:bootRun` | `npm run lab:07`, `npm run dev` → `/labs/07-raw-websocket/` |
| 08~09 | `./gradlew :server:stomp-chat:bootRun` | `npm run lab:08`, `npm run lab:09`, `npm run dev` → `/labs/08-stomp-chat/` |
| 10~12 | `./gradlew :server:secure-chat:bootRun` | `npm run tenant`, `npm run lab:11`, `npm run dev` → `/labs/12-secure-chat/` |
| 13, 15, 17 | — (브라우저만) | `npm run dev` → `/labs/13-dom-events/`, `/labs/15-mutation-mirror/`, `/labs/17-echo-loop/` |
| 14, 18, 19 | — | `npm run lab:14`, `npm run lab:18`, `npm run lab:19` |
| 16~24 | `./gradlew :server:cobrowse-server:bootRun` | 위 2번 데모 |
| 20 | — | `npm run build:sdk` |
| 21 | `./gradlew :server:stomp-chat:bootRun` | `npm run lab:21:proxy -- --mode=idle` + `npm run lab:21:client -- --hb=0` |
| 23~24 | 서버 2대 (아래) | |

> 서버 모듈은 모두 8080 을 쓴다. **한 번에 하나만** 띄우자 (다른 모듈로 바꿀 때는 Ctrl+C 로 끄고).

## 4. 서버 2대 (23·24장)

```bash
./gradlew :server:cobrowse-server:bootJar -q
JAR=server/cobrowse-server/build/libs/cobrowse-server.jar
SERVER_PORT=8081 CHAT_CLUSTER_ENABLED=true CHAT_CLUSTER_PORT=5701 java -jar $JAR
SERVER_PORT=8082 CHAT_CLUSTER_ENABLED=true CHAT_CLUSTER_PORT=5702 java -jar $JAR
CHAT_SERVERS=http://localhost:8081,http://localhost:8082 npm run tenant
CHAT_SERVER=http://localhost:8081 npm run dev
```
- 고객: http://localhost:5173/apps/customer/?ws=ws://localhost:8081/ws,ws://localhost:8082/ws
- 상담사: http://localhost:5173/apps/agent/?ws=ws://localhost:8082/ws
- 8081 터미널을 Ctrl+C(정상 종료) 또는 `kill -9`(강제 종료) → 고객이 8082 로 넘어가 화면이 다시 맞춰지는지

## 5. 주요 설정 (환경 변수)

| 변수 | 기본값 | 의미 |
|---|---|---|
| `SERVER_PORT` | 8080 | cobrowse-server HTTP 포트 |
| `CHAT_JWT_SECRET` | dev-only-… | JWT 서명 키 (32바이트 이상, **운영에서 반드시 변경**) |
| `ACME_API_KEY`, `SHOP_API_KEY` | dev-acme-key, dev-shop-key | 고객사 내부 API 키 |
| `CHAT_ALLOWED_ORIGINS` | http://localhost:*,http://127.0.0.1:* | WebSocket·CORS 허용 Origin |
| `CHAT_CLUSTER_ENABLED` | false | Hazelcast 클러스터 모드 |
| `CHAT_CLUSTER_PORT`, `CHAT_CLUSTER_MEMBERS` | 5701, 127.0.0.1:5701~5703 | Hazelcast 멤버 포트·목록 |
| `CHAT_SERVERS` (tenant) | http://localhost:8080 | 고객사 백엔드가 부를 채팅 서버들 |
| `CHAT_SERVER`, `TENANT_SERVER` (vite) | :8080, :3000 | Vite 프록시 대상 |

문제가 생기면 → [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
