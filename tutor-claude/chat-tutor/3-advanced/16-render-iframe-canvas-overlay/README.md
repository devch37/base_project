# 16. 상담사 화면 재현 — iframe · canvas · overlay, 그리고 CSS · 이미지 · 스크립트가 어려운 이유

## 이 장의 목표
- 받은 DOM 을 **iframe** 안에 안전하게 다시 만드는 방법과 이유를 설명할 수 있다.
- **canvas 오버레이**로 복제본을 건드리지 않고 커서·강조를 그리는 이유를 안다.
- 웹페이지를 "복제"할 때 CSS·이미지·스크립트·폰트·canvas·iframe 이 각각 왜 어려운지 말할 수 있다.

## 프로젝트에서 이 장의 자리
상담사 콘솔(`web/apps/agent/`)의 가운데 영역. `Mirror`(DOM 재현) + `Overlay`(덧그리기) + 배율 맞추기(`fit()`).

---

## 1. 왜 iframe 인가

복제한 DOM 을 상담사 콘솔 페이지에 그냥 넣으면:
- 고객 사이트의 CSS(`body { font-size: 30px }`)가 **콘솔까지 망가뜨린다**, 반대도 마찬가지.
- 고객 페이지의 `id` 가 콘솔의 `id` 와 겹친다.

iframe 은 **별도의 문서**다. 스타일·DOM·스크롤이 완전히 분리된다.

```html
<iframe id="mirror" sandbox="allow-same-origin"></iframe>
```
| sandbox 토큰 | 의미 | 우리 선택 |
|---|---|---|
| (없음) | 모든 제한 적용: 스크립트·폼·팝업·상위 이동 금지, 고유 출처(null) | — |
| `allow-same-origin` | 부모와 같은 출처로 취급 → **부모 JS 가 안의 DOM 을 만들 수 있다** | 넣음 |
| `allow-scripts` | 안에서 스크립트 실행 | **절대 안 넣음** |
| `allow-same-origin` + `allow-scripts` 같이 | iframe 안 스크립트가 sandbox 를 스스로 풀 수 있다 | **금지 조합** |

## 2. DOM 재현 (`Mirror`)

- 스냅샷이 오면 `document.open(); document.write('<!DOCTYPE html><html></html>'); close()` → **표준 모드**로 초기화.
  doctype 없이 만들면 quirks 모드가 되어 고객 화면과 레이아웃이 달라진다 (테스트: `compatMode === 'CSS1Compat'`).
- 노드는 `createElement` / `createElementNS`(SVG) + 소독한 `setAttribute` 로 **한 땀씩** 만든다. `innerHTML` 은 쓰지 않는다 (22장).
- input 값은 **property** 로 넣는다 (`el.value = …`, 13장).
- `document.open()` 은 문서의 이벤트 리스너를 지운다 → 스냅샷마다 상담사 조작 리스너를 다시 단다 (`agent.ts` 의 `attachInteractions`).

## 3. 배율 맞추기

고객 화면은 1440×900 인데 콘솔 영역은 900px 폭일 수 있다.
iframe 을 **고객 뷰포트 크기 그대로** 만들고 CSS `transform: scale(k)` 로 축소한다 → 고객과 **같은 레이아웃**(같은 줄바꿈·같은 반응형 분기).
iframe 크기를 콘솔에 맞춰 줄이면 반응형 CSS 가 모바일 레이아웃으로 바뀌어 고객이 보는 것과 달라진다.

## 4. overlay — 왜 iframe 위에 canvas 를 겹치나

고객의 마우스 위치, 상담사가 가리킨 요소를 표시해야 한다.
- 복제본 DOM 안에 표시용 요소를 넣으면 → 복제본이 원본과 **달라지고**, 이후 변경분 적용 때 형제 순서·번호가 어긋날 수 있다.
- 그래서 같은 크기의 **투명 canvas** 를 iframe 위에 겹치고(`pointer-events: none` 으로 클릭은 통과) 그 위에 그린다.
- 초당 수십 번 움직이는 커서는 DOM 요소를 옮기는 것보다 canvas 를 지우고 다시 그리는 편이 단순하고 reflow 를 일으키지 않는다.
  `requestAnimationFrame` 으로 한 프레임에 한 번만 그린다 (`overlay.ts`).
- canvas 의 **내부 픽셀 크기**(`width`/`height` 속성)와 CSS 크기를 맞추지 않으면 그림이 흐려진다.

## 5. 웹페이지 복제가 어려운 이유

| 대상 | 문제 | SDK 의 처리 | 남는 한계 |
|---|---|---|---|
| **상대 URL** (`img src="/a.png"`, CSS `url(bg.png)`) | 상담사 iframe 의 주소(about:blank/콘솔)를 기준으로 해석돼 깨진다 | 직렬화 때 **절대 URL** 로 (`sanitize.ts`). CSS 파일 안의 url() 은 **CSS 파일 위치** 기준 | — |
| **로그인이 필요한 이미지·CSS** | 상담사 브라우저에는 고객의 쿠키가 없다 → 404/403 | 같은 출처 스타일시트는 **CSSOM 에서 읽어 `<style>` 로 인라인** | 이미지는 상담사 쪽에서 다시 받는다 → 인증이 필요한 이미지는 안 보인다 (⏭ 프록시·캐싱은 고급) |
| **다른 출처 CSS (CDN)** | 브라우저 보안상 `cssRules` 를 못 읽는다 (SecurityError) | `<link>` 주소만 보낸다 (상담사가 직접 받음) | CDN 이 CORS·핫링크를 막으면 깨짐 |
| **스크립트** | 복제본에서 실행되면 이중 동작(장바구니 두 번 담기), 보안 위험 | **보내지 않는다** + 받는 쪽도 제거 + sandbox | 스크립트가 만든 **결과 DOM** 은 MutationObserver 로 따라간다 |
| **CSS-in-JS** (`insertRule`) | 빈 `<style>` + CSSOM 에만 규칙 → textContent 가 비어 있다 | 스냅샷 때 `sheet.cssRules` 를 읽는다 | 이후 insertRule 은 MutationObserver 에 안 잡힌다 (⏭) |
| **폰트** | 웹폰트가 출처 제한(CORS)이 걸려 있으면 다른 글꼴로 보인다 | — | 줄바꿈 위치가 달라질 수 있다 |
| **canvas** | 내용이 DOM 이 아니라 **픽셀** | 스냅샷 때 `toDataURL` 로 이미지화(20만 자 이하) | 이후 변경 안 따라감. 다른 출처 이미지를 그린 canvas 는 읽기 금지(tainted) → 자리표시 |
| **video** | 픽셀 스트림 | — (요소만 복제, 재생 상태는 다름) | ⏭ WebRTC 화면 공유와 혼합 |
| **iframe (특히 결제창)** | 다른 출처 iframe 의 DOM 은 읽을 수 없다 | **자리표시 상자** | 같은 출처 iframe 재귀 복제는 ⏭ |
| **Shadow DOM** | 일반 childNodes 로 안 보인다 | — | ⏭ |
| **`<meta http-equiv=refresh>`, `<base>`** | 복제본을 다른 곳으로 보내거나 URL 해석을 바꾼다 | 제거 | — |

> 결론: DOM 기반 화면 공유는 "**대부분**의 업무 화면"에 아주 효과적이지만 100% 픽셀 동일은 아니다.
> 그래서 상담사 화면 상단에 고객의 실제 URL 을 보여 주고, 재동기화 버튼을 둔다.

---

## 코드 읽기
- `web/sdk/src/mirror.ts` — `applySnapshot`(표준 모드), `buildElement`(소독 + createElementNS)
- `web/sdk/src/serializer.ts` — `serializeLink`(인라인/링크), `styleChildren`(CSSOM), `serializeCanvas`, `placeholder`
- `web/sdk/src/sanitize.ts` — `absolutizeUrl`, `absolutizeSrcset`, `absolutizeCss`
- `web/sdk/src/overlay.ts`
- `web/apps/agent/index.html`(sandbox, scaler, overlay 배치), `main.ts` 의 `fit()`
- `web/apps/customer/assets/site.css` — `url("pattern.svg")` 상대 경로가 있는 고객사 CSS

## 직접 해 보기
최종 앱 실행 ([QUICK_START](../../QUICK_START.md) "4단계") 후:
1. 상담사 콘솔 개발자도구 → iframe 안 `<style data-cobrowse-from="…site.css">` 를 찾아라 — 외부 CSS 가 인라인됐다.
   그 안의 `url(…pattern.svg)` 가 **절대 URL** 인지 확인.
2. iframe 안에 `<script>` 가 하나도 없는지, `#cb-widget`(SDK 위젯)이 없는지 확인.
3. 고객 페이지의 canvas 차트 → 상담사 쪽에서는 `<img data-cobrowse-canvas>`.
4. 브라우저 창 폭을 바꿔 콘솔 배율이 바뀌어도 복제본 레이아웃(줄바꿈)이 고객과 같은지.
5. labs/15 에서 "모든 입력값 마스킹" 토글 → 스냅샷이 새로 찍힌다.

## 자주 하는 실수
- `allow-scripts` + `allow-same-origin` 동시 부여.
- iframe 크기를 콘솔에 맞춰 줄여서 반응형 레이아웃이 달라짐.
- 커서 표시용 요소를 복제본 DOM 에 삽입.
- 상대 URL 을 그대로 보냄 → 이미지·CSS 가 전부 깨짐.

## 확인 질문
1. sandbox 에 `allow-same-origin` 이 없으면 무엇이 안 되나?
2. 고객 페이지 CSS 가 `/static/app.css`(같은 출처, 로그인 필요)다. 상담사 화면에 스타일이 적용되는 원리는?
3. 상담사 화면에서 결제창(PG사 iframe)이 회색 상자로 보인다. 버그인가?

<details><summary>답</summary>

1. iframe 이 고유 출처(null)가 되어 부모 JS 가 `contentDocument` 에 접근해 DOM 을 만들 수 없다.
2. 고객 브라우저가 이미 로드한 CSS 를 SDK 가 CSSOM 에서 읽어 `<style>` 텍스트로 보낸다. 상담사는 그 파일을 다시 받을 필요가 없다.
3. 아니다. 다른 출처 iframe 은 고객 브라우저에서도 DOM 을 읽을 수 없다(Same-Origin Policy). 결제 정보 보호 측면에서도 바람직.
</details>

다음 → [17. 원격 클릭·입력과 에코 방지](../17-remote-control-echo/)
