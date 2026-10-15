# 13. HTML · DOM · DOM 이벤트

## 이 장의 목표
- HTML(문서)과 DOM(메모리 속 트리)의 관계를 설명할 수 있다.
- 이벤트 전파(★캡처 → 타깃 → 버블)와 SDK 가 `capture: true` 를 쓰는 이유를 안다.
- ★ `isTrusted`(진짜 사용자 vs 스크립트), ★ attribute vs property 의 차이를 실험으로 확인한다.

## 프로젝트에서 이 장의 자리
화면 공유는 "DOM 을 읽어서(15장) 보내고, 다시 만들고(16장), 이벤트를 흉내 내는(17장)" 일이다.
이 장의 세 가지 ★ 개념은 각각 15장(property 는 MutationObserver 에 안 잡힌다), 17장(isTrusted 로 메아리 거르기), SDK 리스너 설계(capture)에 그대로 쓰인다.

---

## 1. HTML 과 DOM

```html
<ul id="list"><li class="item">사과</li></ul>
```
브라우저가 HTML 텍스트를 **파싱**하면 메모리에 객체 트리(DOM)가 생긴다.
```
Document
 └ html (Element)
    ├ head
    └ body
       └ ul#list (Element)
          └ li.item (Element)
             └ "사과" (Text 노드)
```
- 노드 종류: **Element**(태그), **Text**(글자), Comment, Document …
- JS 가 DOM 을 바꾸면(`appendChild`, `className = …`) 화면이 바뀐다. HTML 파일은 그대로다.
- 화면 공유 SDK 가 보내는 것은 **HTML 파일이 아니라 지금 이 순간의 DOM** 이다 (JS 가 바꾼 결과 포함).

## 2. ★ attribute vs property

```html
<input id="name" value="초기값">
```
| | attribute | property |
|---|---|---|
| 읽기 | `el.getAttribute('value')` | `el.value` |
| 의미 | HTML 에 적힌 **초기값** | 지금 화면에 보이는 **현재 값** |
| 사용자가 타이핑하면 | 그대로 | 바뀐다 |
| MutationObserver 가 감지 | O (`setAttribute` 시) | **X** |

체크박스 `checked`, select 의 선택값, textarea 내용, 스크롤 위치도 property 쪽이다.
→ SDK 는 스냅샷 때 property 를 별도로 담고(`SerializedElement.value`), 이후에는 `input` 이벤트로 보낸다 (15장).

## 3. DOM 이벤트와 ★ 전파

```
           document  ◀── ① 캡처 단계: 바깥 → 안 (addEventListener(..., true))
             │  ▲
             ▼  │ ③ 버블 단계: 안 → 바깥 (기본)
            body
             │  ▲
             ▼  │
          [button] ── ② 타깃 단계
```
- 페이지 코드가 버블 단계에서 `e.stopPropagation()` 하면 바깥 리스너는 못 듣는다.
- SDK 는 `document` 에 **capture: true** 로 단다 → 페이지가 뭘 하든 **가장 먼저** 본다 (`recorder.ts` 의 `listen()`).
- `passive: true`: "preventDefault 안 할게" → 스크롤 성능 저하 방지.
- **이벤트 위임**: 자식마다 리스너를 다는 대신 부모 하나에 달고 `e.target` 으로 구분. SDK 는 document 하나에 달아 페이지 전체를 본다.
- `scroll` 이벤트는 **버블링하지 않는다.** 그래도 document 의 **캡처**로는 잡힌다.

## 4. ★ isTrusted

| 이벤트를 만든 것 | `isTrusted` |
|---|---|
| 사용자의 실제 클릭·타이핑 | `true` |
| `el.click()` | `false` |
| `el.dispatchEvent(new Event('input'))` | `false` |
| 스크립트가 `scrollTo()` 해서 브라우저가 낸 `scroll` | **`true`** ← 함정 (17장) |

SDK 는 `input` 이벤트에서 `isTrusted=false` 를 무시한다 → 원격 명령이 만든 가짜 입력 이벤트가 다시 상담사에게 돌아가는 메아리를 끊는다.
스크롤은 isTrusted 로 못 걸러서 EchoGuard 가 필요하다.

---

## 코드 읽기
- `web/labs/13-dom-events/` — 이 장의 실험 페이지
- `web/sdk/src/recorder.ts` 의 `listen()` (capture/passive), `onInput()` (isTrusted)
- `web/sdk/src/serializer.ts` 의 `captureFormState()` (property 를 담는 이유)

## 직접 해 보기
```bash
npm run dev      # http://localhost:5173/labs/13-dom-events/
```
1. inner 버튼 클릭 → 로그 순서: document capture → outer/middle/inner capture → inner → middle → outer bubble.
2. "stopPropagation" 체크 후 다시 → outer 버블 리스너가 사라진다. **document capture 는 여전히 보인다.**
3. "대상 버튼" 직접 클릭 vs ".click()" vs "dispatchEvent" → isTrusted 비교.
4. 입력란에 타이핑 → "비교": attribute 는 "초기값", property 는 친 값.
5. MutationObserver 섹션: ".value 변경"만 아무 레코드도 안 나온다. "style 변경"은 `attributes: style` 로 나온다.

## 자주 하는 실수
- `getAttribute('value')` 로 현재 입력값을 읽으려 한다.
- 버블 단계 리스너에 의존 → 페이지의 stopPropagation 에 막힌다.
- `isTrusted` 로 모든 메아리를 거를 수 있다고 믿는다 (scroll 은 안 된다).

## 확인 질문
1. React 페이지에서 사용자가 입력란에 타이핑했다. MutationObserver 에 무엇이 잡히나?
2. 고객사 페이지가 모든 클릭에 `stopPropagation()` 을 한다. SDK 의 클릭 감지는?
3. 원격 입력 후 `dispatchEvent(new Event('input'))` 을 하는 이유와, 그 이벤트의 isTrusted 는?

<details><summary>답</summary>

1. 보통 아무것도(value 는 property). React 가 리렌더링하며 다른 DOM 을 바꾸면 그건 잡힌다.
2. capture 단계에서 document 가 먼저 받으므로 영향 없다.
3. 페이지 프레임워크가 값 변화를 알아채게 하려고. isTrusted=false.
</details>

다음 → [14. 문자열 · 바이트 · 압축](../14-bytes-encoding-compression/)
