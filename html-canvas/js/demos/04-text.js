(function () {
/**
 * 04-text.js — 텍스트 렌더링
 * ------------------------------------------------------------------
 *  - font : CSS font shorthand 문법을 그대로 사용 ("bold 32px sans-serif")
 *  - fillText(text, x, y) / strokeText(text, x, y) : 채워진/테두리만 있는 텍스트
 *  - textAlign : 텍스트가 x좌표를 기준으로 어디에 정렬되는지 (start/end/left/right/center)
 *  - textBaseline : 텍스트가 y좌표를 기준으로 어디에 정렬되는지 (top/middle/alphabetic/bottom 등)
 *  - measureText(text) : 실제 렌더링 없이 텍스트의 폭/높이 등 메트릭 정보를 얻음
 *    → 텍스트를 캔버스 중앙에 정확히 배치하거나, 자동 줄바꿈을 구현할 때 필수
 */
registerDemo({
  id: 'text',
  category: '1. 기초 도형',
  title: '텍스트 렌더링',
  desc: 'font, textAlign/Baseline, strokeText, measureText 를 이용한 텍스트 배치와 자동 줄바꿈',
  file: 'js/demos/04-text.js',
  points: [
    'font 속성은 CSS font shorthand 문법 ("italic bold 28px sans-serif") 을 그대로 씁니다.',
    'textAlign/textBaseline 조합으로 기준점을 9방향(좌상~우하)으로 잡을 수 있습니다.',
    'measureText(text).width 로 텍스트 폭을 알아내 정확한 중앙 정렬이나 줄바꿈이 가능합니다.',
    'strokeText 는 채우기 없이 외곽선만 그려서 아웃라인 타이포 효과를 낼 수 있습니다.',
  ],
  init(ctx, canvas, helpers) {
    const w = helpers.width();
    const h = helpers.height();
    ctx.clearRect(0, 0, w, h);

    // ---------- 1) 기본 폰트 스타일들 ----------
    ctx.fillStyle = '#1c1e26';
    ctx.font = '28px -apple-system, sans-serif';
    ctx.fillText('일반 텍스트 28px', 30, 50);

    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.fillText('굵게 (bold)', 30, 90);

    ctx.font = 'italic 28px -apple-system, sans-serif';
    ctx.fillText('기울임 (italic)', 30, 130);

    // ---------- 2) strokeText: 외곽선만 있는 텍스트 ----------
    ctx.font = 'bold 40px -apple-system, sans-serif';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#5b6cff';
    ctx.strokeText('OUTLINE TEXT', 30, 190);

    // ---------- 3) textAlign / textBaseline 기준점 시각화 ----------
    const px = 420,
      py = 100;
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(px - 60, py);
    ctx.lineTo(px + 160, py);
    ctx.moveTo(px, py - 40);
    ctx.lineTo(px, py + 40);
    ctx.stroke();

    ctx.font = '16px -apple-system, sans-serif';
    ctx.fillStyle = '#ff6b6b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('align=left, baseline=top', px, py);

    ctx.fillStyle = '#5b6cff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('center / middle', px, py + 25);
    ctx.beginPath();
    ctx.arc(px, py + 25, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#5b6cff';
    ctx.fill();

    // ---------- 4) measureText 로 텍스트 폭을 재서 배지(badge) 만들기 ----------
    ctx.font = '18px -apple-system, sans-serif';
    const text = 'measureText 로 크기를 잰 배지';
    const metrics = ctx.measureText(text);
    const padding = 14;
    const boxW = metrics.width + padding * 2;
    const boxH = 36;
    const bx = 30,
      by = 240;

    ctx.fillStyle = '#eef0ff';
    roundRect(ctx, bx, by, boxW, boxH, boxH / 2);
    ctx.fill();
    ctx.fillStyle = '#5b6cff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + padding, by + boxH / 2 + 1);

    // ---------- 5) measureText 를 이용한 자동 줄바꿈 ----------
    ctx.font = '15px -apple-system, sans-serif';
    ctx.fillStyle = '#333';
    const longText =
      'measureText 를 이용하면 폭이 정해진 영역 안에서 단어 단위로 줄바꿈되는 문단을 직접 구현할 수 있습니다. Canvas 는 CSS 처럼 자동 줄바꿈을 지원하지 않기 때문입니다.';
    wrapText(ctx, longText, 30, 320, 560, 24);
  },
});

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

})();
