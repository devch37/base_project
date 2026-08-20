(function () {
/**
 * 05-transform.js — 좌표 변형 (translate / rotate / scale)
 * ------------------------------------------------------------------
 *  - save() / restore() : 현재 상태(변형 행렬, 색상, 선 스타일 등)를 스택에 push/pop.
 *    변형을 적용하기 전에 반드시 save() 하고, 끝나면 restore() 해서
 *    다음 도형이 이전 변형의 영향을 받지 않도록 합니다.
 *  - translate(x, y) : 원점(0,0)을 옮김. 이후의 모든 좌표는 이 새 원점 기준.
 *  - rotate(rad)      : 원점을 중심으로 회전. 그래서 회전시키고 싶은 도형의 중심으로
 *                       먼저 translate 한 뒤 rotate 하는 것이 정석입니다.
 *  - scale(sx, sy)    : 원점 기준으로 확대/축소. 음수를 주면 반전(미러) 효과.
 *  - 변형은 "누적"됩니다: translate → rotate → scale 순서로 호출하면
 *    각 변형이 이전 좌표계 위에 곱해집니다(행렬 곱셈, 순서가 결과에 영향을 줌).
 */
registerDemo({
  id: 'transform',
  category: '2. 변형 & 합성',
  title: '좌표 변형 (Transform)',
  desc: 'translate / rotate / scale 과 save·restore 로 좌표계를 중첩해서 사용하는 방법',
  file: 'js/demos/05-transform.js',
  points: [
    'translate → rotate → scale 순서로 호출하며, 순서가 바뀌면 결과가 달라집니다.',
    '회전은 항상 "현재 원점"을 축으로 일어나므로, 도형 중심으로 translate 후 회전합니다.',
    'save()/restore() 로 변형을 스택에 쌓아두면 형제 도형끼리 서로 영향을 주지 않습니다.',
    '풍차의 날개들처럼 "부모 좌표계 위에 자식 좌표계를 얹는" 계층 구조를 만들 수 있습니다.',
  ],
  init(ctx, canvas, helpers) {
    // ---------- 슬라이더 UI 구성 ----------
    const state = { angle: 0, scale: 1, spin: true };
    helpers.controls.innerHTML = `
      <label>회전 속도 <input id="t-spin" type="checkbox" checked /></label>
      <label>Scale <input id="t-scale" type="range" min="0.5" max="1.8" step="0.05" value="1" /></label>
    `;
    const spinBox = document.getElementById('t-spin');
    const scaleRange = document.getElementById('t-scale');
    helpers.on(spinBox, 'change', () => (state.spin = spinBox.checked));
    helpers.on(scaleRange, 'input', () => (state.scale = Number(scaleRange.value)));

    helpers.loop(() => {
      if (state.spin) state.angle += 0.012;
      draw(ctx, helpers, state);
    });
  },
});

function draw(ctx, helpers, state) {
  const w = helpers.width();
  const h = helpers.height();
  ctx.clearRect(0, 0, w, h);

  // ---------- 왼쪽: translate 로 캔버스 곳곳에 같은 도형 찍어내기 ----------
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.translate(60 + i * 40, 60 + i * 25);
    ctx.fillStyle = `hsl(${i * 40}, 70%, 60%)`;
    ctx.fillRect(-15, -15, 30, 30); // 항상 "원점(0,0)" 기준 -15~15 사각형을 그리기만 하면 됨
    ctx.restore();
  }
  label(ctx, 'translate() 반복 배치', 40, 220);

  // ---------- 가운데: 풍차 (translate + rotate 중첩, 부모/자식 좌표계) ----------
  ctx.save();
  ctx.translate(320, 150);
  ctx.rotate(state.angle);
  ctx.scale(state.scale, state.scale);
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((Math.PI / 2) * i); // 자식 좌표계: 부모(풍차 중심) 기준으로 90도씩 회전
    ctx.fillStyle = i % 2 === 0 ? '#5b6cff' : '#ff9f43';
    ctx.beginPath();
    ctx.ellipse(0, -45, 18, 45, 0, 0, Math.PI * 2); // 날개 하나
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  label(ctx, 'translate+rotate 중첩 (풍차)', 250, 220);

  // ---------- 오른쪽: scale 반전으로 미러 이미지 만들기 ----------
  ctx.save();
  ctx.translate(560, 150);
  drawFlag(ctx, '#20c997');
  ctx.scale(-1, 1); // x축 반전 → 좌우 미러
  drawFlag(ctx, '#e64980');
  ctx.restore();
  label(ctx, 'scale(-1,1) 로 좌우 미러', 470, 220);

  // ---------- 아래: save/restore 없이 변형을 안 풀면 생기는 문제 시각화 ----------
  ctx.save();
  ctx.translate(60, 320);
  ctx.font = '13px -apple-system, sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('save()/restore() 로 각 도형의 변형을 서로 격리시킵니다.', 0, 0);
  ctx.restore();
}

function drawFlag(ctx, color) {
  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.lineTo(50, -35);
  ctx.lineTo(0, -20);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillRect(-2, -50, 4, 90);
}

function label(ctx, text, x, y) {
  ctx.fillStyle = '#888';
  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillText(text, x, y);
}

})();
