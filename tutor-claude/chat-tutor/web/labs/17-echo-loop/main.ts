/**
 * 17장 실습: 에코 루프를 "일부러" 만들고, 막아 본다.
 *
 * 스크롤: 프로그램으로 scrollTop 을 바꿔도 scroll 이벤트는 isTrusted=true 로 발생한다 → isTrusted 로는 못 거른다
 *         → EchoGuard("방금 원격으로 적용한 값")로 거른다
 * 입력  : 프로그램으로 .value 를 바꾸면 input 이벤트 자체가 안 난다. 그런데 프레임워크 호환을 위해
 *         dispatchEvent 로 가짜 이벤트를 쏘면 다시 이벤트가 난다 → 이건 isTrusted=false 로 거를 수 있다
 */
import { EchoGuard } from '../../sdk/src/echo-guard.ts';
import { $, makeLog } from '../shared-log.ts';

const log = makeLog($('log'));
const panes = { a: $('a'), b: $('b') };
for (const p of Object.values(panes)) p.innerHTML = Array.from({ length: 80 }, (_, i) => `<p>${i + 1}번째 줄</p>`).join('');
const guards = { a: new EchoGuard(400), b: new EchoGuard(400) };
let sent = 0;
setInterval(() => {
  $('rate').textContent = `${sent} msg/s`;
  $('rate').className = `badge ${sent > 30 ? 'bad' : sent > 0 ? 'warn' : ''}`;
  sent = 0;
}, 1000);

const guarded = () => $<HTMLSelectElement>('mode').value === 'guard';
const net = (fn: () => void) => setTimeout(fn, Number($<HTMLInputElement>('delay').value));

function wireScroll(from: 'a' | 'b', to: 'a' | 'b') {
  panes[from].addEventListener('scroll', () => {
    const y = panes[from].scrollTop;
    if (guarded() && guards[from].isEcho('scroll', y)) return; // 방금 원격 적용한 값 → 메아리
    sent++;
    net(() => {
      if (guarded()) guards[to].markApplied('scroll', y); // "곧 돌아올 scroll 이벤트는 내가 만든 것"
      panes[to].scrollTop = y; // 이 대입이 to 쪽에서 scroll 이벤트를 다시 일으킨다
    });
  });
}
wireScroll('a', 'b');
wireScroll('b', 'a');

function wireInput(from: HTMLInputElement, to: HTMLInputElement, name: string) {
  from.addEventListener('input', (e) => {
    if (guarded() && !e.isTrusted) return; // 원격 적용이 만든 합성 이벤트 → 보내지 않음
    sent++;
    const v = from.value;
    net(() => {
      to.value = v;
      to.dispatchEvent(new Event('input', { bubbles: true })); // 프레임워크가 알아채도록 (isTrusted=false)
      log('sys', `${name} 적용: "${v}"`);
    });
  });
}
wireInput($<HTMLInputElement>('ia'), $<HTMLInputElement>('ib'), 'A→B');
wireInput($<HTMLInputElement>('ib'), $<HTMLInputElement>('ia'), 'B→A');
