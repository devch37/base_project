# 15. DOM 스냅샷과 MutationObserver — 전체 스냅샷 + 이후 변경분

## 이 장의 목표
- "처음엔 전체를, 그다음엔 바뀐 것만" 보내는 구조와 그 이유를 설명할 수 있다.
- MutationObserver 가 **무엇을 잡고 무엇을 못 잡는지** 표로 말하고, 못 잡는 것을 이벤트로 보완할 수 있다.
- ★ 노드 ID 매핑과, 한 배치 안의 복잡한 변경(삽입 순서, 추가 후 삭제, 이동)을 정확히 재생하는 방법을 안다.

## 프로젝트에서 이 장의 자리
`web/sdk/src/recorder.ts`(고객 쪽 기록)와 `mirror.ts`(상담사 쪽 재생)가 화면 공유의 심장이다.

---

## 1. 왜 "스냅샷 + 변경분"인가

| 방식 | 문제 |
|---|---|
| 변화가 있을 때마다 전체 DOM 을 보낸다 | 글자 하나 칠 때마다 수십 KB. 네트워크·CPU 낭비 |
| 변경분만 보낸다 | 처음 들어온 상담사는 **기준 화면**이 없다 |
| **스냅샷 1회 + 이후 변경분** | 기준 + 작은 차이. 중간에 들어오거나 뭔가 빠지면 **새 스냅샷**부터 다시(19장) |

"스냅샷부터 다시" 하는 경우: 상담사 입장(viewer-joined), 고객 재연결, 상담사의 재동기화 요청.
스냅샷마다 **epoch**(새 ID)를 붙인다 — "어느 스냅샷 기준의 변경분인가".

## 2. MutationObserver

```ts
new MutationObserver((records) => { /* 한 배치 */ })
  .observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
```
- 콜백은 **마이크로태스크**로, 여러 변경이 **묶여서** 온다(03장). 같은 동기 코드 안의 변경 100개 → 콜백 1번.
- 레코드 종류: `childList`(추가/삭제), `attributes`(속성), `characterData`(텍스트).

### 잡는 것 / 못 잡는 것 — DOM 변경 감지 vs 입력·스크롤 동기화

| 변화 | MutationObserver | SDK 가 쓰는 방법 |
|---|---|---|
| 요소 추가·삭제·이동 | O | mutation `add`/`remove` |
| class·style 등 **속성** | O | mutation `attr` |
| 텍스트 노드 내용 | O | mutation `text` |
| 입력란에 **타이핑한 값** (property) | **X** | `input` 이벤트 → `{type:'input'}` |
| 체크박스·select 선택 | **X** | `change` 이벤트 |
| **스크롤 위치** | **X** | `scroll` 이벤트(캡처) → `{type:'scroll'}` |
| 창 크기 | X | `resize` → `{type:'viewport'}` |
| 마우스 위치 | X | `mousemove`(throttle) → `{type:'pointer'}` |
| CSSOM `insertRule` (CSS-in-JS) | X | 스냅샷 때만 `sheet.cssRules` 로 (⏭ 이후 변경 추적은 고급) |
| canvas 그림 | X | 스냅샷 때 이미지로 (16장) |

"DOM 이 바뀌었다"와 "사용자가 무언가 했다"는 **다른 신호**다. 둘 다 보내야 화면이 맞는다.

## 3. ★ 노드 ID

"`body > div:nth-child(3) > ul > li:nth-child(2)`" 같은 경로로 노드를 가리키면 앞에 노드 하나만 끼어들어도 전부 어긋난다.
그래서 스냅샷 때 **노드마다 번호**를 붙인다(`NodeIds`). 이후 변경은 번호로 말한다:
```json
{"op":"add","parentId":17,"beforeId":23,"node":{"id":91,"t":"el","tag":"li",...}}
{"op":"attr","id":17,"name":"class","value":"selected"}
{"op":"remove","id":23}
```
- 고객 쪽: `WeakMap<Node, id>` (페이지가 지운 노드를 붙잡지 않아 메모리가 안 샌다) + `Map<id, Node>`(원격 명령용)
- 상담사 쪽: 받은 번호 그대로 `Map<id, Node>` 에 등록 → 클릭한 요소의 번호를 역으로 찾아 명령에 쓴다(17장)

## 4. ★ 한 배치 안의 까다로운 경우

`Recorder.onMutations()` 의 원칙: **레코드는 도착 순서대로 처리하되, 노드의 상태는 "지금 DOM" 기준으로 읽는다.**

| 상황 | 처리 |
|---|---|
| 추가했다가 같은 배치에서 삭제 | 처리 시점에 `isConnected=false` → 건너뜀 (보낼 필요 없음) |
| 부모가 같은 배치에서 새로 추가됨 | 부모를 직렬화할 때 자식까지 통째로 들어감 → 자식 레코드는 "이미 아는 노드"라 건너뜀 |
| 형제 순서 (A 앞에 B, 다시 그 앞에 C …) | `beforeId` = **이미 번호가 있는** 다음 형제. 아직 모르는 형제는 건너뛰고 찾는다 |
| 노드 이동 (remove 후 다른 곳 add) | remove 로 옛 번호를 잊고, add 에서 새 번호로 다시 직렬화 |
| SDK 자신의 오버레이 | `data-cobrowse-ignore` → 무시 |

이 규칙이 맞는지는 `web/sdk/test/recorder-mirror.test.ts` 의 **퍼징 테스트**(무작위 추가·삭제·이동 150회 후 원본 == 복제본)가 확인한다.

## 5. 직렬화할 때 걸러 내는 것 (16·22장에서 자세히)
`<script>`, `on*` 속성, `javascript:` URL, `<base>`, `<meta http-equiv>`, cross-origin iframe(→ 자리표시), 마스킹 대상 값.

---

## 코드 읽기 (`web/sdk/src/`)
1. `protocol.ts` — `SerializedNode`, `MutationOp`, `Frame` 타입
2. `node-ids.ts` — WeakMap + Map
3. `serializer.ts` — `serializeDocument`, `serializeNode`, `captureFormState`
4. `recorder.ts` — `start()`(스냅샷 + 관찰), `onMutations()`(배치 처리), `listen()`(이벤트 보완), `throttle()`
5. `mirror.ts` — `applySnapshot`, `applyOp`, `applyInput`, `applyScroll`
6. 테스트 `recorder-mirror.test.ts`, `serializer.test.ts`

## 직접 해 보기
```bash
npm run dev   # http://localhost:5173/labs/15-mutation-mirror/  (서버 불필요)
```
1. 왼쪽 원본에서 버튼을 눌러 보며 오른쪽 복제본과 아래 로그(`#seq type(ops) 원본 nB → 선 nB`)를 본다.
2. "100개 한꺼번에" → mutation 프레임 **1개**, ops 100개. 압축 효과도 확인.
3. "첫 항목을 맨 뒤로"(이동) → remove + add.
4. 입력란에 타이핑 → mutation 이 아니라 **input** 프레임. 비밀번호 칸은 복제본에서 `•••`.
5. '스크롤 영역' 상자를 스크롤 → **scroll** 프레임 (throttle 50ms 로 개수가 제한되는지).
6. `npx vitest run --config web/vitest.config.ts -t 퍼징` — 퍼징 테스트만 돌려 보기.

**도전 과제**: `recorder.ts` 에서 `nextKnownSibling` 대신 `n.nextSibling` 의 id 를 그대로 쓰도록 바꿔 보고 테스트를 돌려라. 어떤 테스트가 왜 깨지나? (다시 되돌리기)

## 자주 하는 실수
- 경로(XPath/CSS 선택자)로 노드를 가리킨다.
- MutationObserver 만으로 입력값·스크롤이 동기화될 거라 기대한다.
- 레코드의 `nextSibling`(기록 당시)을 그대로 믿는다 → 같은 배치의 이후 변경과 섞이면 순서가 틀어진다.
- 스냅샷 없이 변경분부터 적용하려 한다.

## 확인 질문
1. 상담사가 상담 도중에 들어왔다. 고객 SDK 는 무엇을 보내야 하나?
2. `input.value = 'x'` 를 스크립트로 바꿨다. MutationObserver 는? input 이벤트는?
3. 고객 쪽 노드 맵에 WeakMap 을 쓰는 이유는?

<details><summary>답</summary>

1. 새 스냅샷(새 epoch). 서버의 PresenceService 가 "viewer-joined" resync 를 고객에게 보낸다.
2. 둘 다 아무것도 안 나온다 (property 변경 + 스크립트 변경은 input 이벤트를 안 낸다). 이런 경우는 다음 스냅샷에서 맞춰진다 — SDK 의 알려진 한계.
3. 페이지가 지운 노드를 우리가 강하게 참조하면 GC 되지 않아 메모리가 샌다.
</details>

다음 → [16. 상담사 화면 재현](../16-render-iframe-canvas-overlay/)
