# 04. 실행 환경과 빌드 도구 — Node.js · npm · Vite · Gradle · JAR · 환경 변수

## 이 장의 목표
- 같은 TypeScript 라도 **브라우저**에서 도는 코드와 **Node.js** 에서 도는 코드를 구분할 수 있다.
- npm·Vite(프론트), Gradle·JAR(백엔드)가 각각 무엇을 하는지 설명하고 직접 실행할 수 있다.
- 설정을 코드 밖(환경 변수·yml·명령행)으로 빼는 이유와 **우선순위**를 안다.

## 프로젝트에서 이 장의 자리
이 저장소에는 세 종류의 실행물이 있다.

| 무엇 | 언어 | 어디서 실행 | 무엇으로 실행 |
|---|---|---|---|
| 채팅 서버 (`server/*`) | Java | JVM | Gradle → JAR → `java -jar` |
| 고객사 백엔드, 실습 스크립트 | TypeScript | **Node.js** | `tsx` (TS 를 바로 실행) |
| SDK, 고객 페이지, 상담사 콘솔 | TypeScript | **브라우저** | Vite (개발 서버·번들러) |

---

## 1. 브라우저 실행 vs Node.js 실행

| | 브라우저 | Node.js |
|---|---|---|
| 있는 것 | `window`, `document`, DOM, `localStorage` | `process`, `fs`, `net`, `Buffer` |
| 둘 다 있는 것 | `fetch`, `WebSocket`(Node 22+), `TextEncoder`, `CompressionStream`, `URL`, `crypto.randomUUID`, `setTimeout`, `btoa` ||
| 보안 | 사용자 컴퓨터에서 남의 코드가 돈다 → 샌드박스, Same-Origin Policy | 서버에서 우리 코드가 돈다 → 파일·네트워크 마음대로 |
| 비밀값 | **넣을 수 없다** (누구나 개발자도구로 본다) | 환경 변수로 넣는다 |

SDK(`web/sdk/src`)는 **양쪽 공통 API 만** 쓴다(`bytes.ts`). 그래서 브라우저에서도 돌고, Node 의 테스트(vitest)에서도 돈다.

## 2. npm · package.json · tsx · Vite

- **npm**: JS 패키지 관리자. `package.json` 의 `dependencies`(실행에 필요) / `devDependencies`(개발에만 필요)를 `node_modules` 에 설치한다.
  `package-lock.json` 은 "정확히 어떤 버전을 설치했는지" 기록 — 커밋한다.
- **scripts**: `npm run dev`, `npm run lab:01:server` 처럼 자주 쓰는 명령에 이름을 붙인다.
- **tsx**: TypeScript 를 컴파일 없이 Node 에서 바로 실행 (`npm run tenant`).
- **Vite**:
  - 개발 모드(`npm run dev`): 파일을 바로 브라우저에 서빙하고, 저장하면 즉시 반영. **프록시**도 해 준다(`web/vite.config.ts`).
  - 빌드(`npx vite build --config web/vite.config.ts`): 여러 파일을 묶고(bundle) 줄여서(minify) 배포용 정적 파일을 만든다.
  - 라이브러리 빌드(`npm run build:sdk`): SDK 를 고객사가 쓸 파일로 만든다 (20장).

## 3. Gradle · JAR

- **Gradle**: Java 빌드 도구. 의존성 다운로드 → 컴파일 → 테스트 → 패키징.
  - 이 저장소는 **멀티 프로젝트**: 루트 `settings.gradle.kts` 에 `server:*` 모듈 5개가 있다.
  - 공통 설정은 루트 `build.gradle.kts` 의 `subprojects { }`, 모듈별 의존성은 `server/<모듈>/build.gradle.kts`.
  - `./gradlew` = 이 프로젝트가 정한 Gradle 버전을 자동으로 받아 쓰는 래퍼. 시스템에 설치된 gradle 대신 이걸 쓴다.
- **JAR**: 컴파일된 클래스 + 리소스를 묶은 zip. Spring Boot 의 `bootJar` 는 **의존성까지 다 넣은 실행 가능한 JAR**(fat jar)를 만든다.

```bash
./gradlew :server:cobrowse-server:test            # 테스트
./gradlew :server:cobrowse-server:bootRun         # 개발 중 실행 (소스에서 바로)
./gradlew :server:cobrowse-server:bootJar         # 배포용 JAR 생성
java -jar server/cobrowse-server/build/libs/cobrowse-server.jar   # JAR 실행 (운영과 같은 방식)
```

## 4. 환경 변수와 외부 설정

**같은 JAR 를 개발·스테이징·운영에서 그대로** 쓰고, 달라지는 값(포트, 비밀키, 다른 서버 주소)만 밖에서 넣는다.
비밀키를 코드나 yml 에 적으면 Git 에 영원히 남는다.

Spring Boot 설정 우선순위 (위가 이긴다, 자주 쓰는 것만):
1. 명령행 인자 `java -jar app.jar --server.port=8081`
2. 환경 변수 `SERVER_PORT=8081` — Spring 이 `SERVER_PORT` → `server.port` 로 바꿔 준다(relaxed binding)
3. `application.yml` 의 값 (`${CHAT_JWT_SECRET:기본값}` 처럼 환경 변수를 참조할 수도 있다)

`server/cobrowse-server/src/main/resources/application.yml` 을 열어 `${...:...}` 패턴을 찾아보자.

> 실측 함정: 테스트에서 `SpringApplicationBuilder.properties("server.port=0")` 로 넣은 값은 "기본값" 취급이라 yml 에 졌다.
> 명령행 인자(`.run("--server.port=0")`)로 바꿔서 해결했다 → `ClusterTest.start()` 주석.

**브라우저 쪽 설정은?** 브라우저에는 환경 변수가 없다. Vite 는 빌드 시점에 `import.meta.env.VITE_*` 값을 **코드에 문자열로 박아 넣는다.**
→ `VITE_API_KEY` 같은 비밀은 그대로 JS 파일에 노출된다. 비밀은 서버(고객사 백엔드)에만 둔다 (11장).

---

## 코드 읽기
- `package.json` 의 `scripts`
- `settings.gradle.kts`, `build.gradle.kts`, `server/cobrowse-server/build.gradle.kts`
- `web/vite.config.ts` (프록시 설정), `web/sdk/vite.lib.config.ts` (라이브러리 빌드)
- `1-basic/04-runtime-build-tools/where-am-i.ts`

## 직접 해 보기
```bash
npm run lab:04
CHAT_SERVER=http://localhost:9090 npm run lab:04      # 환경 변수가 바뀌는지

./gradlew :server:spring-basics:bootJar
java -jar server/spring-basics/build/libs/spring-basics-1.0.0.jar --server.port=8085
CHAT_TENANT=acme-bank java -jar server/spring-basics/build/libs/spring-basics-1.0.0.jar   # 05장 정책 전환
unzip -l server/spring-basics/build/libs/spring-basics-1.0.0.jar | head -30          # JAR 안을 들여다보기
```

## 자주 하는 실수
- `gradle` (시스템 설치본)과 `./gradlew` 를 섞어 쓰다 버전 차이로 빌드가 깨진다.
- 브라우저 코드에서 `process.env` 를 쓴다 → 브라우저에는 `process` 가 없다.
- 환경 변수 이름 오타(`CHAT_TENENT`) → Spring 은 모르는 변수를 조용히 무시한다. 기동 로그에서 실제 값을 확인하는 습관.

## 확인 질문
1. `npm install` 과 `npm ci` 는 무엇이 다를까? (찾아보기)
2. `bootRun` 과 `java -jar` 중 운영 환경과 더 같은 것은?
3. 상담 서버의 JWT 비밀키를 프론트 빌드 환경 변수 `VITE_JWT_SECRET` 으로 넘기면 무엇이 문제인가?

<details><summary>답</summary>

1. `npm ci` 는 lock 파일 그대로만 설치하고(다르면 실패), node_modules 를 지우고 새로 설치한다 → CI·배포용.
2. `java -jar`. bootRun 은 Gradle 이 소스에서 바로 띄운다.
3. 빌드 결과 JS 에 비밀키가 그대로 들어가 누구나 위조 토큰을 만들 수 있다.
</details>

다음 → [05. Spring 서버 구조](../05-spring-structure/)
