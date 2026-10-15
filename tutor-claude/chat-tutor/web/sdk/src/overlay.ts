/**
 * 상담사 화면 위에 덧그리는 투명 캔버스 (16장).
 *
 * 왜 iframe 안이 아니라 "위에" 그리나?
 *   iframe 안 DOM 은 고객 화면의 복제본이다. 거기에 커서 표시용 요소를 넣으면
 *   (1) 복제본이 원본과 달라지고 (2) 다음 변경분 적용 때 번호가 어긋날 수 있다.
 *   그래서 "복제본은 건드리지 않고" 같은 크기의 캔버스를 겹쳐 놓고 그 위에 그린다.
 *
 * DOM 대신 canvas 를 쓰는 이유: 초당 수십 번 움직이는 커서를 그릴 때 DOM 요소를 옮기는 것보다
 * 캔버스를 지우고 다시 그리는 편이 단순하고 레이아웃 계산(reflow)을 일으키지 않는다.
 */
export class Overlay {
  private pointer: { x: number; y: number; at: number } | null = null;
  private box: { x: number; y: number; w: number; h: number; until: number } | null = null;
  private raf = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  resize(w: number, h: number): void {
    // canvas 는 CSS 크기와 "내부 픽셀 크기"가 따로다. 둘을 맞추지 않으면 그림이 늘어나 흐려진다.
    this.canvas.width = w;
    this.canvas.height = h;
    this.schedule();
  }

  showPointer(x: number, y: number): void {
    this.pointer = { x, y, at: performance.now() };
    this.schedule();
  }

  showBox(rect: { x: number; y: number; w: number; h: number }): void {
    this.box = { ...rect, until: performance.now() + 2500 };
    this.schedule();
  }

  private schedule(): void {
    // 같은 프레임 안의 여러 요청을 한 번의 그리기로 합친다
    if (!this.raf) this.raf = requestAnimationFrame(() => this.draw());
  }

  private draw(): void {
    this.raf = 0;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const now = performance.now();

    if (this.box && now < this.box.until) {
      ctx.strokeStyle = '#ff5722';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.box.x - 4, this.box.y - 4, this.box.w + 8, this.box.h + 8);
      this.schedule();
    }
    if (this.pointer && now - this.pointer.at < 5000) {
      // 고객 마우스 위치: 5초 동안 안 움직이면 사라진다
      ctx.fillStyle = 'rgba(33, 150, 243, 0.85)';
      ctx.beginPath();
      ctx.arc(this.pointer.x, this.pointer.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '12px sans-serif';
      ctx.fillText('고객', this.pointer.x + 10, this.pointer.y - 8);
      this.schedule();
    }
  }
}
