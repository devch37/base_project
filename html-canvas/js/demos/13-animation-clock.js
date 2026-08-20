(function () {
/**
 * 13-animation-clock.js — requestAnimationFrame 애니메이션 기초
 * ------------------------------------------------------------------
 *  - requestAnimationFrame(callback) : 브라우저의 다음 화면 재도색(repaint) 타이밍에 맞춰
 *    콜백을 실행합니다. setInterval 과 달리 화면 주사율(보통 60fps)에 자동으로 맞춰지고,
 *    탭이 백그라운드일 때는 자동으로 느려져 배터리를 아낍니다.
 *  - 애니메이션의 기본 패턴: 매 프레임마다 (1) 캔버스를 지우고 (2) 상태를 갱신하고
 *    (3) 새로운 상태로 다시 그리는 것을 반복합니다.
 *  - 이 데모는 실제 "현재 시각"을 기반으로 시/분/초 바늘을 그리는 아날로그 시계입니다.
 *    각도 계산이 transform(rotate) 활용의 좋은 실전 예시가 됩니다.
 */
registerDemo({
  id: 'clock',
  category: '4. 인터랙션 & 애니메이션',
  title: '애니메이션 기초 (아날로그 시계)',
  desc: 'requestAnimationFrame 루프와 rotate() 를 이용해 실시간으로 움직이는 아날로그 시계',
  file: 'js/demos/13-animation-clock.js',
  points: [
    'requestAnimationFrame 은 매 프레임 다시 자기 자신을 예약해서 루프를 만듭니다.',
    '애니메이션 패턴: 지우기 → 상태 갱신 → 그리기 를 매 프레임 반복합니다.',
    '시침/분침/초침은 translate(중심) 후 rotate(각도) 로 방향을 정해 그립니다.',
    '초침의 각도는 밀리초 단위까지 반영해 부드럽게(끊김 없이) 움직이도록 계산했습니다.',
  ],
  init(ctx, canvas, helpers) {
    helpers.loop(() => draw(ctx, helpers));
  },
});

function draw(ctx, helpers) {
  const w = helpers.width();
  const h = helpers.height();
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 2 - 30;

  const now = new Date();
  const ms = now.getMilliseconds();
  const sec = now.getSeconds() + ms / 1000;
  const min = now.getMinutes() + sec / 60;
  const hour = (now.getHours() % 12) + min / 60;

  // ---------- 시계 테두리 & 시간 눈금 ----------
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#1c1e26';
  ctx.lineWidth = 4;
  ctx.fill();
  ctx.stroke();

  for (let i = 0; i < 60; i++) {
    const angle = (Math.PI * 2 * i) / 60;
    const isHour = i % 5 === 0;
    const len = isHour ? 14 : 6;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -radius + 6);
    ctx.lineTo(0, -radius + 6 + len);
    ctx.lineWidth = isHour ? 3 : 1.5;
    ctx.strokeStyle = isHour ? '#1c1e26' : '#aaa';
    ctx.stroke();
    ctx.restore();
  }

  // ---------- 시침: 12시간에 360도 = 시간당 30도 ----------
  drawHand(ctx, (Math.PI * 2 * hour) / 12, radius * 0.5, 6, '#1c1e26');
  // ---------- 분침: 60분에 360도 = 분당 6도 ----------
  drawHand(ctx, (Math.PI * 2 * min) / 60, radius * 0.75, 4, '#5b6cff');
  // ---------- 초침: 60초에 360도 = 초당 6도 (ms까지 반영해 부드럽게) ----------
  drawHand(ctx, (Math.PI * 2 * sec) / 60, radius * 0.85, 2, '#ff6b6b');

  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#1c1e26';
  ctx.fill();

  ctx.restore();

  // ---------- 디지털 시계 텍스트 ----------
  ctx.fillStyle = '#555';
  ctx.font = '16px -apple-system, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(now.toLocaleTimeString('ko-KR'), cx, cy + radius + 40);
  ctx.textAlign = 'left';
}

// 시계 중심(0,0)이 이미 원점으로 translate 된 상태에서 호출됨을 가정
function drawHand(ctx, angle, length, width, color) {
  ctx.save();
  ctx.rotate(angle); // 바늘 자체를 (0,-length) 로 "위쪽(12시 방향)"을 향하게 그려뒀기 때문에,
  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.moveTo(0, 10); // 중심에서 살짝 반대편으로도 삐져나오게(시계 바늘 느낌)
  ctx.lineTo(0, -length);
  ctx.stroke();
  ctx.restore();
}

})();
