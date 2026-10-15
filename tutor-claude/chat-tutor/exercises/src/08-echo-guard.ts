/**
 * 연습 08 (17장) — 에코 방지
 *
 * ScrollSync 는 "상대 화면의 스크롤을 내 화면에 적용"하고 "내 화면의 스크롤을 상대에게 보낸다".
 *  - applyRemote(y, nowMs): 원격에서 온 위치를 적용한다 (→ this.position = y). 곧 같은 값의 scroll 이벤트가 돌아올 것이다.
 *  - onLocalScroll(y, nowMs): 내 화면에서 scroll 이벤트가 났다. 보내야 하면 y 를, 메아리면 null 을 돌려준다.
 *      · 마지막 원격 적용 후 ttlMs 안에, 그 값과 같은 y 이벤트는 메아리
 *      · 다른 값이거나 ttl 이 지났으면 사용자가 직접 움직인 것 → 보낸다
 */
export class ScrollSync {
  position = 0;

  constructor(readonly ttlMs: number) {}

  applyRemote(y: number, nowMs: number): void {
    throw new Error('TODO: applyRemote');
  }

  onLocalScroll(y: number, nowMs: number): number | null {
    throw new Error('TODO: onLocalScroll');
  }
}
