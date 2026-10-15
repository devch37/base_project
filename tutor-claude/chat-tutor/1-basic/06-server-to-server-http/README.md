# 06. 서버 간 HTTP 호출과 오류 처리 — 타임아웃 · 재시도 · 대체값

## 이 장의 목표
- 다른 서버를 부를 때 반드시 정해야 하는 네 가지(**타임아웃, 오류 분류, 재시도, 대체값**)를 설명할 수 있다.
- 타임아웃을 안 걸면 **우리 서버 전체**가 멈출 수 있는 이유를 스레드 관점에서 말할 수 있다.
- Spring `RestClient` 로 안전한 호출 코드를 쓸 수 있다.

## 프로젝트에서 이 장의 자리
- 상담방을 열 때 우리 서버 → 고객사 CRM 에 "이 고객 이름 알려 줘" (`CrmClient`, 이 장)
- 고객사 백엔드 → 우리 서버 내부 API 로 방·토큰 발급 (`web/tenant-backend/server.ts`, 11장)
- 서버가 여러 대일 때 "첫 서버가 죽었으면 다음 서버로" (`tenant-backend` 의 `chatApi()`, 23장)

---

## 1. 네 가지 결정

```
우리 서버 ──GET /customers/c-1──▶ 고객사 CRM
            ① 얼마나 기다릴까?        (타임아웃)
            ② 실패하면 무슨 종류?      (4xx: 내 잘못 / 5xx·타임아웃: 상대 사정)
            ③ 다시 해 볼까?           (재시도: 멱등 요청 + 상대 사정일 때만)
            ④ 끝내 실패하면?          (대체값: 상담은 열고 이름만 "고객"으로)
```

## 2. 타임아웃이 없으면 생기는 일 (★ 스레드 모델)

톰캣은 요청마다 스레드 하나를 쓴다(기본 최대 200개).
CRM 이 응답을 안 주면 → 그 요청 스레드는 **계속 기다린다** → 요청이 쌓이면 200개가 전부 CRM 을 기다리며 멈춘다
→ **CRM 과 상관없는 요청(헬스체크, 다른 API)까지 전부 응답 불능.** 한 외부 서비스의 장애가 우리 서버로 번진다(장애 전파).

타임아웃은 두 개다:
- **연결 타임아웃**: TCP 연결 맺기까지 (상대가 꺼져 있거나 방화벽에 막힘)
- **읽기 타임아웃**: 연결은 됐는데 응답이 안 옴 (상대가 느리거나 멈춤)

> 실측 함정 (`CrmClientTest`): 테스트용 가짜 CRM 을 JDK `HttpServer` 로 만들었더니, 기본이 **스레드 1개**라서
> 느린 요청 하나가 뒤 요청을 전부 막았다. `setExecutor(Executors.newCachedThreadPool())` 로 해결.
> "서버가 요청을 몇 개의 스레드로 처리하는가"는 서버를 만들 때도, 부를 때도 중요하다.

## 3. 오류 분류와 재시도

| 결과 | 의미 | 재시도? | `CrmClient` 의 처리 |
|---|---|---|---|
| 2xx | 성공 | — | 이름 사용 |
| 404 | 그런 고객 없음 | X (몇 번 물어도 없다) | "미등록 고객" |
| 그 외 4xx (400, 401…) | 우리 요청·설정(API 키)이 틀림 | X | 대체값 + **경고 로그** (설정 오류를 알아채야 함) |
| 5xx | 상대 서버 문제 | O | 재시도 후 대체값 |
| 타임아웃·연결 거부 (`ResourceAccessException`) | 네트워크·상대 상태 | O | 재시도 후 대체값 |

재시도는 **멱등(GET)일 때만**. POST 를 무작정 재시도하면 같은 일이 두 번 일어난다(02장).
재시도 간격은 점점 늘린다(백오프). 실시간 재연결의 백오프 + jitter 는 09장에서 본격적으로.

## 4. 대체값(fallback)은 "숨기지 않는다"

`CrmResult(name, outcome, attempts)` — 이름만 돌려주지 않고 **어떻게 얻었는지**도 돌려준다.
대체값을 썼다는 사실을 숨기면, CRM 이 몇 시간째 죽어 있어도 아무도 모른다(모니터링의 사각지대).

---

## 코드 읽기 (`server/spring-basics/.../crm/`)
- `CrmProperties` — `chat.crm.*` 설정을 타입 있는 record 로 (Duration 자동 변환)
- `CrmClient` — 타임아웃 설정, 오류 분류 `catch` 블록, 재시도 루프
- `FakeCrmController` — `slow-*`, `err-*`, `none-*`, `flaky-*` 로 장애를 흉내 내는 가짜 CRM
- `src/test/.../CrmClientTest` — 진짜 HTTP 서버로 타임아웃까지 검증
- `web/tenant-backend/server.ts` 의 `chatApi()` — Node 버전: `AbortSignal.timeout`, 4xx 는 즉시 실패, 5xx·연결 실패는 **다음 서버로**

## 직접 해 보기
```bash
./gradlew :server:spring-basics:bootRun
for id in c-1 none-1 err-1 slow-1 flaky-1; do
  echo "== $id"; time curl -s -X POST localhost:8080/api/rooms -H 'Content-Type: application/json' \
    -d "{\"customerId\":\"$id\",\"topic\":\"t\"}"; echo
done
```
- `slow-1` 은 몇 초 걸렸나? (`read-timeout: 2s` × `max-attempts: 2` + 백오프) 서버 로그의 `CRM 호출 실패 attempt=…` 를 보라.
- `flaky-1` 은 첫 시도 503 → 두 번째 성공. 같은 요청을 한 번 더 보내면?
- `application.yml` 의 `read-timeout` 을 `5s` 로 바꾸면 `slow-1` 결과가 어떻게 바뀌나?

**도전 과제 (Java)**: CrmClient 에 "최근 30초 동안 실패가 5번 넘으면 30초 동안은 호출하지 않고 바로 대체값"(간단한 **서킷 브레이커**)을 추가해 보라. (실무에서는 Resilience4j 를 쓴다 — ⏭ 고급)

## 자주 하는 실수
- 타임아웃 없음 (`RestTemplate`/`RestClient` 기본값은 사실상 무한 대기일 수 있다)
- 4xx 를 재시도 → 같은 실패를 N 번 + 상대 서버에 부하
- 재시도 횟수 × 타임아웃이 **우리 클라이언트의 타임아웃보다 길다** → 우리가 대체값을 만들기도 전에 앞단이 먼저 포기한다
- `InterruptedException` 을 삼킨다 → 종료 신호가 사라진다 (`Thread.currentThread().interrupt()`)

## 확인 질문
1. 읽기 타임아웃 2초, 최대 3회, 백오프 100ms·200ms. 상대가 완전히 멈췄을 때 최악 대기 시간은?
2. CRM 이 401 을 준다. 재시도해야 할까? 무엇을 의심해야 할까?
3. 대체값을 쓰는 것이 항상 옳은가? 예외적인 경우는?

<details><summary>답</summary>

1. 약 2×3 + 0.1 + 0.2 = 6.3초.
2. 재시도 무의미. 우리 쪽 API 키·인증 설정 오류(만료, 교체 누락)를 의심 → 로그·알림.
3. 아니다. 결제 금액·권한 판단처럼 "틀린 값보다 실패가 나은" 경우는 대체값 대신 실패를 돌려준다.
</details>

## 연습
- `exercises/src/02-retry.ts`

다음 단계 → [2단계: 07. HTTP 와 WebSocket](../../2-intermediate/07-http-vs-websocket/)
