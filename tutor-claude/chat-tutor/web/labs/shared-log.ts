/** 실습 페이지 공통: 로그 출력 */
export function makeLog(el: HTMLElement) {
  return (kind: 'in' | 'out' | 'sys' | 'err', text: string) => {
    const line = document.createElement('div');
    line.className = kind;
    const arrow = { in: '◀ ', out: '▶ ', sys: '· ', err: '✖ ' }[kind];
    line.textContent = `${new Date().toLocaleTimeString()} ${arrow}${text}`;
    el.appendChild(line);
    if (el.childElementCount > 500) el.firstElementChild?.remove();
    el.scrollTop = 1e9;
  };
}

export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
