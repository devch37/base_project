(function () {
/**
 * 03-line-styles.js — 선 스타일 (lineWidth, lineCap, lineJoin, dash)
 * ------------------------------------------------------------------
 *  - lineCap  : 선의 "끝부분" 모양 → butt(기본, 각짐) / round(둥글게) / square(사각으로 살짝 연장)
 *  - lineJoin : 선이 꺾이는 "모서리" 모양 → miter(뾰족, 기본) / round(둥글게) / bevel(각짐)
 *  - miterLimit : lineJoin이 miter일 때 뾰족함이 너무 심해지면 자동으로 bevel 처럼 잘라내는 임계값
 *  - setLineDash([선길이, 간격길이, ...]) : 점선/파선 패턴
 *  - lineDashOffset : 점선 패턴의 시작 위치를 이동시켜 "흐르는 개미행진" 애니메이션에 사용
 */
registerDemo({
  id: 'line-styles',
  category: '1. 기초 도형',
  title: '선 스타일 (Cap / Join / Dash)',
  desc: 'lineCap, lineJoin, miterLimit, 점선(setLineDash)과 흐르는 점선 애니메이션',
  file: 'js/demos/03-line-styles.js',
  points: [
    'lineCap 은 선의 "끝", lineJoin 은 선이 "꺾이는 지점"의 모양을 결정합니다.',
    'miterLimit 을 낮추면 뾰족한 모서리가 잘려서 bevel 처럼 보입니다.',
    'setLineDash([5,10]) 처럼 배열로 점선 패턴(선-간격 반복)을 지정합니다.',
    'lineDashOffset 을 매 프레임 변경하면 "개미행진" 애니메이션을 만들 수 있습니다.',
  ],
  init(ctx, canvas, helpers) {
    let offset = 0;
    helpers.loop(() => {
      offset -= 0.6;
      draw(ctx, helpers, offset);
    });
  },
});

function draw(ctx, helpers, dashOffset) {
  const w = helpers.width();
  const h = helpers.height();
  ctx.clearRect(0, 0, w, h);
  ctx.font = '12px -apple-system, sans-serif';

  // ---------- lineCap 비교 ----------
  ['butt', 'round', 'square'].forEach((cap, i) => {
    const y = 60 + i * 50;
    ctx.beginPath();
    ctx.lineWidth = 18;
    ctx.lineCap = cap;
    ctx.strokeStyle = '#5b6cff';
    ctx.moveTo(60, y);
    ctx.lineTo(200, y);
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.fillText(`lineCap = "${cap}"`, 220, y + 4);
  });

  // ---------- lineJoin 비교 ----------
  ['miter', 'round', 'bevel'].forEach((join, i) => {
    const x = 420 + i * 130;
    ctx.beginPath();
    ctx.lineWidth = 16;
    ctx.lineJoin = join;
    ctx.strokeStyle = '#ff9f43';
    ctx.moveTo(x, 120);
    ctx.lineTo(x + 40, 50);
    ctx.lineTo(x + 80, 120);
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.fillText(`lineJoin="${join}"`, x - 10, 150);
  });

  // ---------- 점선 (setLineDash) ----------
  ctx.beginPath();
  ctx.setLineDash([12, 8]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#20c997';
  ctx.moveTo(60, 240);
  ctx.lineTo(560, 240);
  ctx.stroke();
  ctx.setLineDash([]); // 원래대로(실선) 복구
  ctx.fillText('setLineDash([12, 8])', 60, 265);

  // ---------- 흐르는 점선 애니메이션 (lineDashOffset) ----------
  ctx.beginPath();
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = dashOffset;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#e64980';
  roundedRectPath(ctx, 60, 300, 500, 110, 20);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText('lineDashOffset 애니메이션 ("개미행진")', 60, 435);
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

})();
