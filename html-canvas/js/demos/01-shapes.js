(function () {
/**
 * 01-shapes.js — 기본 도형 그리기
 * ------------------------------------------------------------------
 * Canvas 2D API 의 가장 기본이 되는 도형 그리기 메서드들을 보여줍니다.
 *
 *  - fillRect / strokeRect / clearRect : 사각형은 path 없이 바로 그릴 수 있는 유일한 도형
 *  - beginPath()  : 새 도형(경로)을 시작한다는 선언. 이걸 빼먹으면 이전에 그리던
 *                   경로에 계속 점이 이어붙어서 의도치 않은 모양이 나옵니다.
 *  - arc(x, y, r, startAngle, endAngle) : 각도는 "라디안" 단위이고 3시 방향이 0도입니다.
 *  - moveTo / lineTo : 펜을 떼지 않고 점과 점을 잇는 방식으로 다각형을 만듭니다.
 *  - closePath()  : 마지막 점과 첫 점을 자동으로 이어줍니다 (선택사항이지만 fill 시 자동 적용됨).
 *  - fill() / stroke() : 만들어진 경로를 각각 "채우기" / "테두리 그리기" 합니다.
 */
registerDemo({
  id: 'shapes',
  category: '1. 기초 도형',
  title: '기본 도형 그리기',
  desc: 'rect, arc, path(선/곡선)를 이용한 사각형·원·삼각형·다각형·별 그리기',
  file: 'js/demos/01-shapes.js',
  points: [
    'fillRect/strokeRect 는 beginPath 없이 즉시 그려지는 유일한 도형입니다.',
    'arc() 의 각도는 라디안이며, 0rad = 3시 방향에서 시작합니다.',
    '다각형은 moveTo → lineTo 를 반복해서 점을 이어 만듭니다.',
    'quadraticCurveTo / bezierCurveTo 로 곡선(하트 모양)도 만들 수 있습니다.',
  ],
  init(ctx, canvas, helpers) {
    draw(ctx, helpers);
  },
});

function draw(ctx, helpers) {
  const w = helpers.width();
  const h = helpers.height();
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 3;
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#333';

  // ---------- 1) 사각형: fillRect / strokeRect / clearRect ----------
  ctx.save();
  ctx.fillStyle = '#5b6cff';
  ctx.fillRect(40, 40, 120, 80); // 채워진 사각형
  ctx.strokeStyle = '#222';
  ctx.strokeRect(180, 40, 120, 80); // 테두리만 있는 사각형
  ctx.fillStyle = '#5b6cff';
  ctx.fillRect(320, 40, 120, 80);
  ctx.clearRect(345, 60, 70, 40); // 그린 영역의 일부를 지워서 "구멍"을 냄
  ctx.restore();
  label(ctx, '사각형 (fill / stroke / clear)', 40, 140);

  // ---------- 2) 원 & 부채꼴: arc() ----------
  ctx.beginPath();
  ctx.fillStyle = '#ff6b6b';
  ctx.arc(100, 210, 40, 0, Math.PI * 2); // 0 ~ 2π = 완전한 원
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#ffb347';
  ctx.moveTo(240, 210); // 중심점을 먼저 찍어야 "파이 조각" 모양이 됨
  ctx.arc(240, 210, 40, 0, Math.PI * 1.2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 6;
  ctx.arc(380, 210, 40, -Math.PI / 2, Math.PI, true); // 반시계 방향(counterclockwise=true)
  ctx.stroke();
  label(ctx, '원 / 부채꼴 / 호 (arc)', 40, 280);

  // ---------- 3) 다각형: moveTo + lineTo ----------
  ctx.beginPath();
  ctx.fillStyle = '#845ef7';
  ctx.moveTo(100, 320);
  ctx.lineTo(60, 400);
  ctx.lineTo(140, 400);
  ctx.closePath(); // 삼각형: 마지막 점 → 첫 점을 자동 연결
  ctx.fill();

  drawPolygon(ctx, 260, 360, 42, 6, '#20c997'); // 육각형
  drawStar(ctx, 400, 360, 42, 18, 5, '#f06595'); // 별
  label(ctx, '다각형 (삼각형 / 육각형 / 별)', 40, 430);

  // ---------- 4) 곡선: quadraticCurveTo / bezierCurveTo (하트 모양) ----------
  ctx.save();
  ctx.translate(560, 190);
  ctx.scale(1.3, 1.3);
  ctx.beginPath();
  ctx.fillStyle = '#e64980';
  ctx.moveTo(0, 15);
  ctx.bezierCurveTo(0, 5, -10, -10, -25, -10);
  ctx.bezierCurveTo(-45, -10, -45, 15, -45, 15);
  ctx.bezierCurveTo(-45, 35, -25, 50, 0, 65);
  ctx.bezierCurveTo(25, 50, 45, 35, 45, 15);
  ctx.bezierCurveTo(45, 15, 45, -10, 25, -10);
  ctx.bezierCurveTo(12, -10, 0, 5, 0, 15);
  ctx.fill();
  ctx.restore();
  label(ctx, 'bezierCurveTo (하트)', 500, 300);
}

// 정다각형: 중심(cx,cy) 기준으로 반지름 r 만큼 떨어진 sides 개의 점을 이어 그립니다.
function drawPolygon(ctx, cx, cy, r, sides, color) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// 별 모양: 바깥 반지름(outerR)과 안쪽 반지름(innerR)을 번갈아 사용해 뾰족한 점을 만듭니다.
function drawStar(ctx, cx, cy, outerR, innerR, spikes, color) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function label(ctx, text, x, y) {
  ctx.fillStyle = '#888';
  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillText(text, x, y);
}

})();
