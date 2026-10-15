/**
 * 에코(메아리) 방지 (17장).
 *
 * 문제: 상담사가 스크롤 → 명령 → 고객 화면 스크롤 → 고객 쪽 scroll 이벤트 발생 → 프레임 → 상담사 화면 스크롤
 *       → 상담사 쪽 scroll 이벤트 발생 → 또 명령 → ... 무한히 핑퐁하거나 화면이 덜덜 떨린다.
 *
 * 해결: "방금 내가 원격 지시로 적용한 값"을 기억해 두고, 같은 값의 이벤트가 짧은 시간 안에
 *       돌아오면 내 사용자가 만든 것이 아니라 메아리로 보고 보내지 않는다.
 *
 * isTrusted 로는 부족한 이유: 스크립트로 scrollTo() 해도 브라우저가 발생시키는 scroll 이벤트는 isTrusted=true 다.
 */
export class EchoGuard {
  private readonly applied = new Map<string, { value: string; until: number }>();

  constructor(
    private readonly ttlMs = 500,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** 원격 지시로 값을 적용하기 "직전"에 호출 */
  markApplied(key: string, value: unknown): void {
    this.applied.set(key, { value: JSON.stringify(value), until: this.now() + this.ttlMs });
  }

  /** 이벤트를 보내기 전에 호출. true 면 메아리이므로 보내지 않는다. */
  isEcho(key: string, value: unknown): boolean {
    const entry = this.applied.get(key);
    if (!entry) return false;
    if (this.now() > entry.until) {
      this.applied.delete(key);
      return false;
    }
    return entry.value === JSON.stringify(value);
  }
}
