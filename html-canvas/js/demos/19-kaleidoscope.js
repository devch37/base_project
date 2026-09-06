(function () {
/**
 * 19-kaleidoscope.js — 만화경 드로잉 (대칭 반사)
 * ------------------------------------------------------------------
 * 마우스로 그린 선 하나를 중심점 기준으로 N등분 회전 + 좌우 반전(mirror) 시켜
 * 똑같이 반복해서 그리면 만화경처럼 대칭적인 무늬가 만들어집니다.
 *
 *  - 화면 중심으로 translate 한 좌표계에서, rotate(i * 2π/N) 을 돌며 N번 같은 선을 그립니다.
 *  - 각 회전마다 scale(1,-1) 로 한 번 더 반전해서 그리면 대칭이 두 배(2N겹)로 늘어납니다.
 *  - "자동 재생"을 켜면 사람이 그리지 않아도 Lissajous 곡선(두 개의 sin 파를 합성한 궤적)을
 *    따라 펜이 저절로 움직이며 계속 화려한 패턴을 그려냅니다.
 */
registerDemo({
  id: 'kaleidoscope',
  category: '6. 프랙탈 & 생성 예술',
  title: '만화경 드로잉',
  desc: '한 번의 드래그를 회전+반전으로 N배 복제해서 그리는 대칭 드로잉 (자동 재생 지원)',
  file: 'js/demos/19-kaleidoscope.js',
  points: [
    '중심으로 translate 후 rotate(i·2π/N) 를 반복하며 같은 선을 N번 그려 회전 대칭을 만듭니다.',
    '각 회전마다 scale(1,-1) 로 한 번 더 반사시켜 대칭 개수를 2배로 늘립니다.',
    '자동 재생은 Lissajous 곡선(sin(at), sin(bt+phase))을 펜의 좌표로 사용해 스스로 그립니다.',
    '잔상(rgba 반투명 덮기)을 살짝 남겨 궤적이 부드럽게 이어지는 느낌을 줍니다.',
  ],
  init(ctx, canvas, helpers) {
    const state = { symmetry: 8, hue: 0, auto: true };
    let last = null;
    let drawing = false;
    let backgroundPainted = false;

    helpers.controls.innerHTML = `
      <label>대칭 수 <input id="k-sym" type="range" min="3" max="16" value="8" /></label>
      <label>자동 재생 <input id="k-auto" type="checkbox" checked /></label>
      <button id="k-clear">전체 지우기</button>
    `;
    const symEl = document.getElementById('k-sym');
    const autoEl = document.getElementById('k-auto');
    helpers.on(symEl, 'input', () => (state.symmetry = Number(symEl.value)));
    helpers.on(autoEl, 'change', () => {
      state.auto = autoEl.checked;
      last = null;
    });
    helpers.on(document.getElementById('k-clear'), 'click', () => {
      ctx.clearRect(0, 0, helpers.width(), helpers.height());
    });

    function toLocal(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left - helpers.width() / 2, y: e.clientY - rect.top - helpers.height() / 2 };
    }

    helpers.on(canvas, 'pointerdown', (e) => {
      state.auto = false;
      autoEl.checked = false;
      drawing = true;
      last = toLocal(e);
    });
    helpers.on(canvas, 'pointermove', (e) => {
      if (!drawing) return;
      const p = toLocal(e);
      drawSymmetric(last, p);
      last = p;
    });
    const stop = () => (drawing = false);
    helpers.on(canvas, 'pointerup', stop);
    helpers.on(canvas, 'pointerleave', stop);

    function drawSymmetric(from, to) {
      const w = helpers.width();
      const h = helpers.height();
      const n = state.symmetry;
      state.hue = (state.hue + 1.2) % 360;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `hsl(${state.hue}, 90%, 62%)`;

      for (let i = 0; i < n; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / n);

        // 원본 방향
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // 같은 회전각에서 y축 반전(거울 대칭)까지 한 번 더 그려 만화경 특유의 무늬를 만듦
        ctx.save();
        ctx.scale(1, -1);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      }
      ctx.restore();
    }

    // 배경에 아주 옅은 페이드를 매 프레임 덮어서 오래된 궤적이 서서히 옅어지게 함
    helpers.loop((t) => {
      const w = helpers.width();
      const h = helpers.height();
      if (!backgroundPainted) {
        ctx.fillStyle = '#0d0e17';
        ctx.fillRect(0, 0, w, h);
        backgroundPainted = true;
      }
      ctx.fillStyle = 'rgba(13, 14, 23, 0.04)';
      ctx.fillRect(0, 0, w, h);

      if (state.auto) {
        const time = t / 1000;
        const r = Math.min(w, h) * 0.32;
        const p = {
          x: Math.sin(time * 1.3) * r * Math.sin(time * 0.21),
          y: Math.sin(time * 1.9 + 1.2) * r * Math.sin(time * 0.21),
        };
        if (last) drawSymmetric(last, p);
        last = p;
      }
    });
  },
});
})();
