(function () {
/**
 * 17-fractal-tree.js — 재귀로 그리는 프랙탈 나무 (애니메이션 + 인터랙티브)
 * ------------------------------------------------------------------
 * "가지 하나를 그리고, 그 끝에서 더 짧은 가지 두 개를 다시 그린다" 를
 * 재귀 함수로 반복하면 나무 모양의 프랙탈이 만들어집니다.
 *
 *  - translate(0,-len) 로 "펜을 가지 끝으로 이동"시키고, rotate(angle) 로
 *    다음 가지의 방향을 튼 뒤, 다시 자기 자신을 호출(재귀)합니다.
 *  - save()/restore() 가 없으면 왼쪽 가지를 그린 변형이 오른쪽 가지에도
 *    누적되어 나무가 아니라 나선형으로 뒤틀려버립니다 — 재귀에서 특히 중요합니다.
 *  - 매 프레임 각도에 sin(time) 값을 살짝 더해 "바람에 흔들리는" 효과를 냅니다.
 *  - 마우스 x 위치도 흔들림 각도에 반영해서 나무가 커서를 따라 기울어집니다.
 */
registerDemo({
  id: 'fractal-tree',
  category: '6. 프랙탈 & 생성 예술',
  title: '프랙탈 나무 (재귀)',
  desc: '재귀 함수 + translate/rotate 로 그리는 자연스럽게 흔들리는 나무',
  file: 'js/demos/17-fractal-tree.js',
  points: [
    '"가지 그리기 → 끝으로 이동 → 각도 틀고 재귀 호출" 을 반복하는 재귀 알고리즘입니다.',
    '재귀 호출 전후를 save()/restore() 로 감싸지 않으면 변형이 다음 가지에 누적되어 무너집니다.',
    'Math.sin(시간)을 각도에 더해 자연스러운 바람 흔들림 애니메이션을 만듭니다.',
    '마우스 x 좌표를 흔들림에 반영해 나무가 커서 쪽으로 기우는 인터랙션을 넣었습니다.',
  ],
  init(ctx, canvas, helpers) {
    const state = { spread: 26, ratio: 0.74, depth: 11, wind: true };
    let mouseSway = 0;

    helpers.controls.innerHTML = `
      <label>가지 각도 <input id="ft-spread" type="range" min="10" max="45" value="26" /></label>
      <label>길이 비율 <input id="ft-ratio" type="range" min="0.55" max="0.85" step="0.01" value="0.74" /></label>
      <label>깊이 <input id="ft-depth" type="range" min="6" max="14" value="11" /></label>
      <label>바람 <input id="ft-wind" type="checkbox" checked /></label>
    `;
    const spreadEl = document.getElementById('ft-spread');
    const ratioEl = document.getElementById('ft-ratio');
    const depthEl = document.getElementById('ft-depth');
    const windEl = document.getElementById('ft-wind');
    helpers.on(spreadEl, 'input', () => (state.spread = Number(spreadEl.value)));
    helpers.on(ratioEl, 'input', () => (state.ratio = Number(ratioEl.value)));
    helpers.on(depthEl, 'input', () => (state.depth = Number(depthEl.value)));
    helpers.on(windEl, 'change', () => (state.wind = windEl.checked));
    helpers.on(canvas, 'pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseSway = ((e.clientX - rect.left) / rect.width - 0.5) * 0.6; // -0.3 ~ 0.3 rad
    });

    // 재귀로 가지를 그림. 현재 좌표계의 원점에서 위쪽(0,-len)으로 한 가지를 그립니다.
    function branch(len, depth, t) {
      if (depth <= 0 || len < 2) return;

      const hue = 95 + depth * 4;
      ctx.strokeStyle = depth < 3 ? `hsl(${28}, 70%, ${38 + depth * 3}%)` : `hsl(${hue}, 55%, ${30 + depth * 3}%)`;
      ctx.lineWidth = Math.max(1, depth * 1.1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len);
      ctx.stroke();

      // 잎(가장 얇은 가지 끝)에 작은 잎사귀를 그려 화사하게 마무리
      if (depth <= 2) {
        ctx.beginPath();
        ctx.fillStyle = `hsl(${100 + Math.sin(t + len) * 20}, 65%, 60%)`;
        ctx.arc(0, -len, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.translate(0, -len);

      const windOffset = state.wind ? Math.sin(t * 1.6 + depth * 0.4) * 0.08 * (1 + (11 - depth) * 0.15) : 0;
      const sway = windOffset + mouseSway * (depth / state.depth);
      const rad = (state.spread * Math.PI) / 180;

      ctx.save();
      ctx.rotate(rad + sway);
      branch(len * state.ratio, depth - 1, t);
      ctx.restore();

      ctx.save();
      ctx.rotate(-rad * 0.9 + sway);
      branch(len * state.ratio, depth - 1, t);
      ctx.restore();
    }

    helpers.loop((t) => {
      const w = helpers.width();
      const h = helpers.height();
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h - 10);
      branch(h * 0.28, state.depth, t / 1000);
      ctx.restore();

      ctx.fillStyle = '#888';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText('마우스를 좌우로 움직여 바람 방향을 바꿔보세요', 14, 20);
    });
  },
});
})();
