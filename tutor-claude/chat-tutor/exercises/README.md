# 연습문제

각 장을 읽고 나서 해당 문제를 풀자. `exercises/src/*.ts` 의 `TODO` 를 채우면 된다.

```bash
npm run ex            # 내가 푼 코드(src)를 테스트 — 처음엔 전부 실패하는 게 정상
npm run ex:solution   # 해답(solutions)을 테스트 — 막히면 해답을 열어 보자
npx vitest run --config exercises/vitest.config.ts -t "연습 03"   # 한 문제만
```

| 번호 | 파일 | 관련 장 | 무엇을 연습하나 |
|---|---|---|---|
| 01 | `01-origin.ts` | 01, 22 | Origin 계산, WebSocket Origin 허용 목록 검사 (접두어 함정) |
| 02 | `02-retry.ts` | 06 | 재시도: 재시도할 오류/하지 말 오류 구분, 대기 |
| 03 | `03-stomp-frame.ts` | 08 | STOMP 프레임 직접 만들고 해석 (heartbeat, 이스케이프) |
| 04 | `04-jwt.ts` | 11 | HS256 서명·검증, alg none 차단, 타이밍 안전 비교 |
| 05 | `05-utf8.ts` | 14 | 글자 수 vs UTF-8 바이트 수, base64 길이 |
| 06 | `06-chunker.ts` | 18 | 조각 나누기·조립·중복·타임아웃 |
| 07 | `07-seq-buffer.ts` | 19 | 순서 번호로 재정렬, 빈 번호 찾기 |
| 08 | `08-echo-guard.ts` | 17 | 양방향 스크롤 동기화에서 메아리 끊기 |
| 09 | `09-mask.ts` | 22 | 마스킹 규칙과 값 가리기 |

> 이 문제들은 실제 SDK 코드(`web/sdk/src`)의 축소판이다. 풀고 나서 SDK 의 같은 부분
> (codec.ts, sequencer.ts, echo-guard.ts, masking.ts …)을 비교해 읽으면 "실무 코드가 무엇을 더 신경 쓰는지" 보인다.

**Java 쪽 연습**은 각 장 README 의 "직접 해 보기"에 있다 (예: 05장 고객사 정책 Bean 추가, 12장 접근 규칙 추가).
