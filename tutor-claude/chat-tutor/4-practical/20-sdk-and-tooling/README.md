# 20. SDK 로 만들기 — SDK 와 일반 업무 화면 코드의 차이

## 이 장의 목표
- "남의 웹사이트에 끼워 들어가는 코드(SDK)"가 우리 업무 화면 코드와 무엇이 다른지 설명할 수 있다.
- SDK 를 라이브러리로 빌드(ES 모듈 / IIFE)하고, 공개 API·버전·호환성을 관리하는 방법을 안다.

## 프로젝트에서 이 장의 자리
`web/sdk/` 는 고객사(ACME 보험 등)가 자기 사이트에 붙이는 제품이다. 상담사 콘솔(`web/apps/agent`)은 우리 업무 화면이다.
같은 TypeScript 지만 지켜야 할 규칙이 다르다.

---

## 1. 무엇이 다른가

| | 업무 화면 코드 (상담사 콘솔) | SDK (고객사 사이트에 삽입) |
|---|---|---|
| 실행 환경 | **우리가** 통제하는 페이지 | **남의** 페이지 (어떤 프레임워크·CSS·전역 변수가 있을지 모름) |
| 배포 | 우리가 배포하면 즉시 전원 새 버전 | 고객사가 붙인 버전이 **오래 남는다** (캐시, 고객사 배포 주기) |
| 전역 오염 | 어느 정도 괜찮음 | **금지** — `window.Cobrowse` 하나만 (IIFE 빌드의 `name`) |
| CSS | 마음대로 | 고객사 CSS 와 **충돌 금지** (위젯은 고객사가 만들거나, Shadow DOM 으로 격리 ⏭) |
| 크기 | 덜 민감 | **민감** — 고객사 페이지 로딩을 늦춘다 (현재 IIFE gzip 17.5KB) |
| 오류 | 우리 화면만 망가짐 | **고객사 페이지를 망가뜨리면 안 된다** — 모든 비동기에 catch, 리스너는 `passive` |
| 공개 범위 | 내부 | 공개 API 가 곧 **계약**. 넓게 열면 나중에 못 바꾼다 |
| 데이터 | 우리 데이터 | 고객의 개인정보가 지나간다 → 마스킹 책임 (22장) |

## 2. 공개 API 는 좁게

고객사 개발자가 알아야 할 것은 이게 전부다 (`web/apps/customer/main.ts` 참고):
```ts
const cb = new CobrowseCustomer({ urls, roomId, getToken, mask, onState, onStatus, onChat, onError });
cb.start();
cb.setRemoteControl(true);
cb.sendChat('...');
await cb.stop();
```
- 토큰은 SDK 가 직접 받지 않고 `getToken` **콜백**으로 고객사에 묻는다 → API 키가 SDK 안에 들어갈 일이 없다 (11장).
- `index.ts` 는 학습용으로 내부 부품(Recorder, Mirror…)도 export 하지만, 실제 제품이라면 좁혀야 한다.

## 3. 버전과 호환

- **SDK 버전**: 빌드 때 `__SDK_VERSION__` 에 package.json 버전을 박아 넣는다 → 장애 시 "어느 SDK 였나".
- **프로토콜 버전**: 모든 프레임에 `v: 1` (`protocol.ts`). 상담사 콘솔이 v2 를 이해하도록 올라가도, 고객 브라우저에는 v1 SDK 가 남아 있다.
  - 수신 측은 모르는 버전이면 재동기화 요청 / 안내 (`OrderedReceiver` 의 `'version'`)
  - 새 필드는 **추가만**(옛 버전은 무시할 수 있게), 의미 변경·삭제는 버전 올림
- 서버도 프레임 내용을 해석하지 않으므로 SDK 버전업에 서버 배포가 덜 묶인다.

## 4. 라이브러리 빌드 (`web/sdk/vite.lib.config.ts`)

```bash
npm run build:sdk
#  web/sdk/dist/cobrowse-sdk.js       ES 모듈: import { CobrowseCustomer } from '…'  (번들러를 쓰는 고객사)
#  web/sdk/dist/cobrowse-sdk.iife.js  <script src="…"></script> 후 window.Cobrowse.CobrowseCustomer (번들러 없는 사이트)
#  *.map                               소스맵: 고객사 사이트 오류를 원래 코드 위치로 추적
```
- 의존성(`@stomp/stompjs`)을 함께 묶는다 → 고객사가 따로 설치할 필요 없다.
- 업무 화면 빌드(`npx vite build --config web/vite.config.ts`)는 HTML 여러 개를 입력으로 하는 **앱 빌드**다. 비교해 보자.

## 5. 브라우저 실행 vs Node 실행 (04장 복습)
SDK 핵심 로직은 브라우저·Node 공통 API 만 쓴다 → vitest(Node + jsdom)로 단위 테스트, Playwright(진짜 Chromium)로 e2e.
DOM 이 필요한 테스트 파일 맨 위의 `// @vitest-environment jsdom` 을 보라.

---

## 코드 읽기
- `web/sdk/src/index.ts`(공개 API), `customer.ts`(파사드), `protocol.ts`(버전, 주소 모음 `dest`)
- `web/sdk/vite.lib.config.ts`, `web/vite.config.ts`
- `web/apps/customer/main.ts` — 고객사 개발자 입장의 코드 (업무 코드와 SDK 사용이 섞여 있는 모습)

## 직접 해 보기
```bash
npm run build:sdk && ls -la web/sdk/dist
head -c 300 web/sdk/dist/cobrowse-sdk.iife.js      # var Cobrowse=(function(...){...}) — 전역 하나
grep -o '"1.0.0"' web/sdk/dist/cobrowse-sdk.iife.js | head -1
```
**도전**: `web/sdk/dist/cobrowse-sdk.iife.js` 를 `<script>` 로만 붙인 아주 단순한 HTML(번들러 없이)을 만들어 상담을 시작해 보라.
(토큰은 `fetch('/tenant/customer/session')` 로. Vite 개발 서버의 `web/` 아래에 두면 프록시가 그대로 동작한다)

## 자주 하는 실수
- SDK 가 `window.someHelper = …` 같은 전역을 남긴다.
- SDK 오류가 고객사 페이지 전체를 멈춘다 (catch 없는 Promise, 동기 무한 루프).
- 내부 구조를 그대로 공개해서 리팩터링할 때마다 고객사 코드가 깨진다.
- 프로토콜 필드의 의미를 버전 없이 바꾼다.

## 확인 질문
1. SDK 가 토큰을 직접 발급받지 않고 `getToken` 콜백을 받는 이유는?
2. 상담사 콘솔을 배포했더니 일부 고객 화면만 깨져 보인다. 무엇을 의심하나?
3. ES 빌드와 IIFE 빌드가 둘 다 필요한 이유는?

<details><summary>답</summary>

1. 토큰 발급에는 API 키가 필요하고, API 키는 고객사 서버에만 있어야 한다. SDK 는 "어떻게 받는지" 모르는 게 맞다.
2. 고객 브라우저의 옛 SDK 와 새 콘솔의 프로토콜 불일치 → 프레임의 `v`, SDK 버전 로그 확인.
3. 고객사마다 사이트 구성이 다르다(번들러 사용 여부).
</details>

다음 → [21. HTTPS · WSS · TLS · 프록시](../21-tls-proxy-upgrade/)
