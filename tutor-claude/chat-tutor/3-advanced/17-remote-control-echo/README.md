# 17. 원격 클릭·입력과 에코 방지 — 이벤트가 양쪽에서 반복 전송되는 문제

## 이 장의 목표
- 상담사의 클릭·입력을 **명령(command)** 으로 바꿔 고객 브라우저에 반영하는 흐름을 설명할 수 있다.
- 고객 보호 장치(동의, 화이트리스트, 보호 필드, 원격 금지 요소)를 안다.
- **에코(메아리) 루프**가 생기는 원리와 세 가지 방지 기법(isTrusted, EchoGuard, ack+cmdId)을 구현할 수 있다.

## 프로젝트에서 이 장의 자리
"그 버튼 말고 오른쪽 버튼이요" 대신 상담사가 직접 가리키거나(highlight), 고객 허락 하에 대신 눌러 준다.
`agent.ts`(명령 만들기) → 서버(`CobrowseController.command`) → `remote-control.ts`(적용) → `ack` 프레임 → `agent.ts`(결과 반영).

---

## 1. 명령의 흐름

```
상담사가 복제본에서 버튼 클릭
  └ agent.ts: e.preventDefault()  ← 복제본에서 링크 이동·폼 전송이 일어나면 안 된다
              id = mirror.idOf(e.target)          (15장 노드 ID)
              SEND /app/cobrowse/{room}/command {type:"click", id:42, cmdId:"a1"}
서버: 권한(상담사·배정) 확인 → 고객 동의 확인 → by="agent-1", at=… 를 서버가 덮어씀 → /topic/…/commands
고객 SDK: remote-control.ts
              el = recorder.ids.nodeOf(42)
              동의? 금지 요소? → el.click()
              결과 → ack 프레임 {type:"ack", cmdId:"a1", ok:true}
고객 페이지가 바뀜 (예: 플랜 선택 → class 변경)
  └ MutationObserver → mutation 프레임 → 상담사 복제본에도 반영
```
상담사는 **명령의 결과를 DOM 변경분으로** 다시 본다. 명령이 "성공했다고 가정"해서 복제본을 먼저 바꾸지 않는다.

## 2. 고객 보호 장치

| 장치 | 어디서 | 설명 |
|---|---|---|
| **동의(consent)** | 서버(`CobrowseController`) + 고객 SDK(`RemoteControl.enabled`) | 고객이 "조작 허용"을 켜야 클릭·입력·스크롤. 양쪽에서 검사 |
| **가리키기는 동의 없이** | 서버 | highlight 는 고객 화면을 바꾸지 않는다 → 허용 |
| **명령 화이트리스트** | 서버 `COMMAND_TYPES` | click/input/scroll/highlight 만. "스크립트 실행" 같은 명령은 존재하지 않는다 |
| **보호 필드** | 고객 SDK | 마스킹 대상(비밀번호·카드)에는 원격 입력 거부 |
| **원격 금지 요소** | 고객 SDK | `data-cobrowse-no-remote` (예: "가입 신청" 최종 버튼) |
| **누가 했는지** | 서버가 `by` 를 찍음 | 감사 로그·분쟁 대비. 클라이언트 주장은 덮어쓴다 |

> 동의는 **업무 규칙**이라 거절해도 연결을 끊지 않는다 → `/user/queue/errors` (12장 "보안 위반 vs 업무 거절").

## 3. 입력을 "프레임워크가 알아채게" 넣기

React 는 `input.value` setter 를 가로채 자기가 아는 값과 비교한다. `el.value = v` 만 하면 React 는 모르고 다음 렌더링에서 옛 값으로 되돌린다.
→ 프로토타입의 **원래 setter** 를 호출하고 `input`·`change` 이벤트를 `dispatchEvent` 한다 (`setNativeValue`).

## 4. 에코 루프 — 왜 생기나

### 스크롤 핑퐁
```
상담사 스크롤 y=500 ──명령──▶ 고객 scrollTo(500) ──(브라우저가 scroll 이벤트 발생, isTrusted=true!)
     ▲                                 │
     │                          프레임 {scroll y=500}
     └── 복제본 scrollTop=500 ◀────────┘
         (복제본에서 scroll 이벤트 발생) ──명령──▶ … 무한 반복, 지연이 있으면 화면이 덜덜 떨린다
```
### 입력 덮어쓰기
```
상담사가 "kim" 을 빠르게 입력
  "k" 명령 → 고객 적용 → 고객이 "k" 를 되돌려 보냄 → 그 사이 상담사 칸은 이미 "ki" → "k" 로 덮어써짐 → 커서가 튐
```

## 5. 방지 기법 세 가지

| 기법 | 원리 | 어디에 |
|---|---|---|
| **① isTrusted** | 원격 적용이 쏜 `dispatchEvent` 는 `isTrusted=false` → Recorder 가 input 프레임을 만들지 않는다 | `recorder.ts` `onInput` |
| **② EchoGuard** | "방금 원격으로 적용한 값"을 짧게(500ms) 기억 → 같은 값의 이벤트는 메아리로 간주 | 스크롤: 고객 `remote-control.ts`(markApplied) + `recorder.ts`(isEcho), 상담사 `agent.ts` 양쪽 |
| **③ ack + cmdId** | 입력 명령마다 cmdId. 고객이 **적용 결과**를 ack 로 돌려줌. 상담사는 **가장 최근에 보낸 cmdId 의 ack 만** 반영, 그 전까지 고객의 중간값 input 프레임은 무시 | `agent.ts` `pendingInput`, `onAck` |

③의 덤: 페이지가 값을 **가공**하는 경우(휴대폰 번호에 하이픈 자동 삽입)에도 상담사 칸이 고객 칸과 정확히 같아진다.
e2e 테스트: 상담사가 `01012345678` 입력 → 고객 `010-1234-5678` → ack 로 상담사 칸도 `010-1234-5678`.

isTrusted 만으로 안 되는 이유: 스크립트가 `scrollTo()` 해도 브라우저가 내는 scroll 이벤트는 `isTrusted=true` (13장).

---

## 코드 읽기
- `web/sdk/src/agent.ts` — `attachInteractions`(click/input/scroll → 명령), `pendingInput`, `onAck`
- `server/cobrowse-server/.../web/CobrowseController.command` — 화이트리스트, 동의, by/cmdId 스탬프
- `web/sdk/src/remote-control.ts` — 동의·보호 필드·금지 요소, `setNativeValue`, ack, highlight 상자(`data-cobrowse-ignore`)
- `web/sdk/src/echo-guard.ts`
- 테스트: `web/sdk/test/remote-control.test.ts`, `server/.../CobrowseFlowTest.고객_동의_전에는…`, `web/e2e/cobrowse.e2e.ts`

## 직접 해 보기
1. `npm run dev` → `labs/17-echo-loop/`: "보호 없음"으로 A 를 빠르게 휠 스크롤 → msg/s 폭증·떨림. "EchoGuard" 로 바꿔 비교.
   입력칸도 같은 실험 (보호 없음이면 A↔B 가 계속 서로 덮어쓴다).
2. 최종 앱에서:
   - 동의 전 상담사 클릭 → 고객 화면에 **주황 테두리**(가리키기)만. 로그에 거절 사유.
   - 고객이 "조작 허용" → 상담사가 플랜 클릭 → 고객 화면이 바뀌고 그 결과가 다시 복제본에.
   - 상담사가 휴대폰 칸에 숫자만 입력 → 양쪽 다 하이픈 포맷.
   - "가입 신청"(no-remote) 클릭 → ack 거절.
   - 비밀번호 칸 원격 입력 → 거절.

## 자주 하는 실수
- 명령을 보낸 쪽이 결과를 가정하고 자기 화면을 먼저 바꿈 → 실제 결과와 어긋남.
- 복제본 클릭의 기본 동작을 막지 않아 iframe 이 고객 사이트로 이동해 버림.
- 모든 메아리를 isTrusted 로 해결하려 함.
- 상담사가 보낸 `by` 를 그대로 믿음.

## 확인 질문
1. 상담사 클릭이 고객 화면을 바꿨다. 상담사 복제본은 무엇으로 갱신되나?
2. EchoGuard 의 유효 시간이 너무 길면/짧으면?
3. ack 에 `value` 를 담아 돌려주는 이유는?

<details><summary>답</summary>

1. 고객 페이지의 DOM 변경 → MutationObserver → mutation 프레임.
2. 길면: 사용자가 우연히 같은 위치로 스크롤한 진짜 동작까지 무시. 짧으면: 네트워크 지연보다 짧아 메아리를 못 거름.
3. 고객 페이지가 값을 가공했을 수 있다(포맷·길이 제한). 상담사 화면을 "보낸 값"이 아니라 "실제 결과"로 맞춘다.
</details>

## 연습
- `exercises/src/08-echo-guard.ts` — 양방향 스크롤에서 메시지가 1개로 끝나야 한다

다음 → [18. 큰 메시지 조각내기](../18-chunking/)
