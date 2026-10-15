import { $, makeLog } from '../shared-log.ts';

const log = makeLog($('log'));
const phase = (e: Event) => ['NONE', '캡처', '타깃', '버블'][e.eventPhase];

// 1. 전파
for (const id of ['outer', 'middle', 'inner']) {
  const el = $(id);
  el.addEventListener('click', (e) => log('sys', `[${phase(e)}] ${id} (capture 리스너)`), true);
  el.addEventListener('click', (e) => {
    log('in', `[${phase(e)}] ${id} (bubble 리스너)`);
    if (id === 'middle' && $<HTMLInputElement>('stop').checked) {
      e.stopPropagation();
      log('err', 'middle 에서 stopPropagation → outer 버블 리스너는 실행되지 않는다');
    }
  });
}
document.addEventListener('click', (e) => log('out', `[${phase(e)}] document capture — 무엇이든 가장 먼저 본다 (target=${(e.target as Element).id || (e.target as Element).tagName})`), true);

// 2. isTrusted
$('target').addEventListener('click', (e) => log(e.isTrusted ? 'in' : 'err', `대상 버튼 클릭: isTrusted=${e.isTrusted}`));
$('by-click').onclick = () => $('target').click();
$('by-dispatch').onclick = () => $('target').dispatchEvent(new MouseEvent('click', { bubbles: true }));

// 3. attribute vs property
$('inspect').onclick = () => {
  const f = $<HTMLInputElement>('field');
  log('sys', `getAttribute('value') = "${f.getAttribute('value')}"  /  .value = "${f.value}"  /  .defaultValue = "${f.defaultValue}"`);
};

// 4. MutationObserver
const watched = $('watched');
new MutationObserver((records) => {
  for (const r of records) {
    if (r.type === 'childList') log('in', `childList: +${r.addedNodes.length} -${r.removedNodes.length}`);
    else if (r.type === 'attributes') log('in', `attributes: ${r.attributeName} → "${(r.target as Element).getAttribute(r.attributeName!)}"`);
    else log('in', `characterData: "${r.target.textContent}"`);
  }
  log('sys', `↑ 콜백 1번에 레코드 ${records.length}개 (같은 마이크로태스크 안의 변경은 묶여서 온다)`);
}).observe(watched, { childList: true, attributes: true, characterData: true, subtree: true });

$('m-add').onclick = () => watched.appendChild(Object.assign(document.createElement('b'), { textContent: ' 새 요소' }));
$('m-attr').onclick = () => (watched.className = `c${Date.now() % 100}`);
$('m-text').onclick = () => ($('wtext').firstChild!.textContent = `텍스트 ${Date.now() % 1000}`);
$('m-value').onclick = () => {
  $<HTMLInputElement>('winput').value = `값 ${Date.now() % 1000}`;
  log('err', '.value 를 바꿨지만 MutationObserver 는 아무것도 보고하지 않는다 → SDK 는 input 이벤트로 따로 보낸다');
};
$('m-style').onclick = () => {
  watched.style.background = watched.style.background ? '' : '#fff3bf';
};
