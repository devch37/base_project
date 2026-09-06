(function () {
/**
 * 18-mandelbrot.js — 만델브로트 집합 (확대/이동 가능한 프랙탈)
 * ------------------------------------------------------------------
 * 복소평면의 각 점 c 에 대해 z = z² + c 를 반복했을 때 z가 발산하지 않으면
 * "집합에 속한다"고 정의합니다. 발산까지 걸린 반복 횟수를 색상으로 매핑하면
 * 그 유명한 프랙탈 이미지가 나옵니다.
 *
 *  - 성능이 핵심이라, fillRect 를 픽셀마다 호출하는 대신 ImageData 의
 *    Uint8ClampedArray 에 RGBA 값을 "직접" 써넣고 한 번에 putImageData 합니다.
 *  - 매 프레임 전체 캔버스 해상도로 계산하면 느리므로, 작은 오프스크린 버퍼(예: 420×280)
 *    에서만 계산한 뒤 drawImage 로 확대해서 표시합니다 (11-offscreen.js 와 같은 기법).
 *  - 휠로 확대/축소, 드래그로 이동, 더블클릭으로 그 지점을 중심으로 확대합니다.
 */
registerDemo({
  id: 'mandelbrot',
  category: '6. 프랙탈 & 생성 예술',
  title: '만델브로트 집합 (줌 가능)',
  desc: '픽셀을 직접 써서(ImageData) 그리는 무한히 확대 가능한 프랙탈. 휠로 줌, 드래그로 이동',
  file: 'js/demos/18-mandelbrot.js',
  points: [
    'z = z² + c 를 반복해 발산 여부/속도를 계산하고, 반복 횟수를 색으로 매핑합니다.',
    '픽셀마다 fillRect 를 부르면 느리므로 Uint8ClampedArray 에 RGBA 를 직접 기록합니다.',
    '작은 오프스크린 버퍼에서 계산 후 drawImage 로 확대 표시해 프레임당 연산량을 줄입니다.',
    '확대할수록 필요한 반복 횟수(maxIter)를 늘려야 경계가 뭉개지지 않습니다.',
  ],
  init(ctx, canvas, helpers) {
    const RES_W = 420,
      RES_H = 280;
    const buf = document.createElement('canvas');
    buf.width = RES_W;
    buf.height = RES_H;
    const bctx = buf.getContext('2d');
    const imageData = bctx.createImageData(RES_W, RES_H);

    const view = { cx: -0.5, cy: 0, scale: 3 }; // scale = 화면에 보이는 복소평면 가로 폭
    let dragging = false,
      dragStart = null,
      viewStart = null;
    let renderTimer = null;

    helpers.controls.innerHTML = `<button id="mb-reset">리셋</button> <span id="mb-info" style="color:var(--text-dim)"></span>`;
    const infoEl = document.getElementById('mb-info');
    helpers.on(document.getElementById('mb-reset'), 'click', () => {
      view.cx = -0.5;
      view.cy = 0;
      view.scale = 3;
      scheduleRender();
    });

    function hslToRgb(h, s, l) {
      h = h % 360;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l - c / 2;
      let r = 0,
        g = 0,
        b = 0;
      if (h < 60) [r, g, b] = [c, x, 0];
      else if (h < 120) [r, g, b] = [x, c, 0];
      else if (h < 180) [r, g, b] = [0, c, x];
      else if (h < 240) [r, g, b] = [0, x, c];
      else if (h < 300) [r, g, b] = [x, 0, c];
      else [r, g, b] = [c, 0, x];
      return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    }

    function render() {
      const scaleY = (view.scale * RES_H) / RES_W;
      const maxIter = Math.min(600, Math.floor(90 + 40 * Math.log2(3 / view.scale + 1)));
      const data = imageData.data;

      for (let py = 0; py < RES_H; py++) {
        const cy0 = view.cy - scaleY / 2 + (py / RES_H) * scaleY;
        for (let px = 0; px < RES_W; px++) {
          const cx0 = view.cx - view.scale / 2 + (px / RES_W) * view.scale;
          let zx = 0,
            zy = 0,
            iter = 0;
          while (zx * zx + zy * zy <= 4 && iter < maxIter) {
            const nzx = zx * zx - zy * zy + cx0;
            zy = 2 * zx * zy + cy0;
            zx = nzx;
            iter++;
          }
          const idx = (py * RES_W + px) * 4;
          if (iter >= maxIter) {
            data[idx] = data[idx + 1] = data[idx + 2] = 0; // 집합 내부는 검정
          } else {
            // 부드러운 색상 전이를 위한 continuous escape-time 보정
            const smooth = iter + 1 - Math.log(Math.log(Math.sqrt(zx * zx + zy * zy))) / Math.log(2);
            const hue = (smooth * 6) % 360;
            const [r, g, b] = hslToRgb(hue, 0.85, 0.5);
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
          data[idx + 3] = 255;
        }
      }
      bctx.putImageData(imageData, 0, 0);
      draw();
      infoEl.textContent = `중심 (${view.cx.toFixed(4)}, ${view.cy.toFixed(4)})  확대 ${(3 / view.scale).toFixed(1)}x  반복 ${maxIter}`;
    }

    function draw() {
      const w = helpers.width();
      const h = helpers.height();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buf, 0, 0, RES_W, RES_H, 0, 0, w, h);
    }

    // 무거운 계산이라, 연속 이벤트(휠/드래그) 도중에는 살짝 지연시켜 마지막 상태만 렌더링합니다.
    function scheduleRender(delay = 0) {
      clearTimeout(renderTimer);
      renderTimer = setTimeout(render, delay);
    }

    helpers.on(canvas, 'wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width; // 0~1
      const my = (e.clientY - rect.top) / rect.height;
      const scaleYBefore = (view.scale * RES_H) / RES_W;
      // 확대/축소 전, 마우스가 가리키고 있던 복소평면 좌표를 기억해둔다
      const worldX = view.cx - view.scale / 2 + mx * view.scale;
      const worldY = view.cy - scaleYBefore / 2 + my * scaleYBefore;

      const factor = e.deltaY > 0 ? 1.25 : 0.8; // 휠 아래로=축소, 위로=확대
      view.scale *= factor;
      const scaleYAfter = (view.scale * RES_H) / RES_W;

      // 같은 world 좌표가 확대/축소 후에도 마우스 아래 같은 화면 위치에 오도록 중심을 역산
      view.cx = worldX - mx * view.scale + view.scale / 2;
      view.cy = worldY - my * scaleYAfter + scaleYAfter / 2;
      scheduleRender(60);
    });

    helpers.on(canvas, 'pointerdown', (e) => {
      dragging = true;
      dragStart = { x: e.clientX, y: e.clientY };
      viewStart = { cx: view.cx, cy: view.cy };
      canvas.setPointerCapture(e.pointerId);
    });
    helpers.on(canvas, 'pointermove', (e) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const scaleY = (view.scale * RES_H) / RES_W;
      const dx = ((e.clientX - dragStart.x) / rect.width) * view.scale;
      const dy = ((e.clientY - dragStart.y) / rect.height) * scaleY;
      view.cx = viewStart.cx - dx;
      view.cy = viewStart.cy - dy;
      scheduleRender(30);
    });
    const stopDrag = () => (dragging = false);
    helpers.on(canvas, 'pointerup', stopDrag);
    helpers.on(canvas, 'pointerleave', stopDrag);

    helpers.on(canvas, 'dblclick', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      const scaleY = (view.scale * RES_H) / RES_W;
      view.cx = view.cx - view.scale / 2 + mx * view.scale;
      view.cy = view.cy - scaleY / 2 + my * scaleY;
      view.scale *= 0.4;
      scheduleRender();
    });

    render();
  },
});
})();
