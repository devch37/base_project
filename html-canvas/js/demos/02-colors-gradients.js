(function () {
/**
 * 02-colors-gradients.js — 색상, 그라디언트, 패턴
 * ------------------------------------------------------------------
 *  - fillStyle / strokeStyle 에는 색상 문자열뿐 아니라
 *    CanvasGradient, CanvasPattern 객체를 넣을 수도 있습니다.
 *  - createLinearGradient(x0,y0,x1,y1)  : 두 점을 잇는 직선 방향 그라디언트
 *  - createRadialGradient(x0,y0,r0,x1,y1,r1) : 두 원 사이를 보간 (도넛/원형 확산 효과 가능)
 *  - createConicGradient(startAngle, x, y) : 중심점을 기준으로 "시계처럼" 회전하며 보간
 *  - createPattern(image, repeat) : 이미지를 타일처럼 반복 채우기
 *  - addColorStop(offset, color) : 0~1 사이 위치에 색상 정지점을 추가
 */
registerDemo({
  id: 'gradients',
  category: '1. 기초 도형',
  title: '색상 & 그라디언트 & 패턴',
  desc: 'Linear / Radial / Conic 그라디언트와 Pattern 채우기',
  file: 'js/demos/02-colors-gradients.js',
  points: [
    'addColorStop(0~1, color) 로 그라디언트에 색상 정지점을 여러 개 추가할 수 있습니다.',
    'Radial 그라디언트는 시작원과 끝원의 위치/반지름을 다르게 주면 "스포트라이트" 효과가 납니다.',
    'Conic 그라디언트는 각도 기준이라 파이차트/색상환 표현에 유용합니다.',
    'createPattern 은 반복 방식으로 repeat/repeat-x/repeat-y/no-repeat 를 지정합니다.',
  ],
  init(ctx, canvas, helpers) {
    const w = helpers.width();
    const h = helpers.height();
    ctx.clearRect(0, 0, w, h);

    // ---------- 1) Linear gradient ----------
    const linear = ctx.createLinearGradient(20, 0, 240, 0);
    linear.addColorStop(0, '#5b6cff');
    linear.addColorStop(0.5, '#a06cff');
    linear.addColorStop(1, '#ff6bd6');
    ctx.fillStyle = linear;
    roundRect(ctx, 20, 30, 220, 110, 14);
    ctx.fill();
    label(ctx, 'Linear Gradient', 20, 160);

    // ---------- 2) Radial gradient (스포트라이트 느낌) ----------
    const radial = ctx.createRadialGradient(340, 60, 10, 360, 85, 110);
    radial.addColorStop(0, '#fff3b0');
    radial.addColorStop(0.5, '#ff9f43');
    radial.addColorStop(1, '#c0392b');
    ctx.fillStyle = radial;
    roundRect(ctx, 270, 30, 220, 110, 14);
    ctx.fill();
    label(ctx, 'Radial Gradient', 270, 160);

    // ---------- 3) Conic gradient (색상환) ----------
    if (ctx.createConicGradient) {
      const conic = ctx.createConicGradient(0, 630, 85);
      conic.addColorStop(0, '#ff595e');
      conic.addColorStop(0.17, '#ffca3a');
      conic.addColorStop(0.34, '#8ac926');
      conic.addColorStop(0.51, '#1982c4');
      conic.addColorStop(0.68, '#6a4c93');
      conic.addColorStop(1, '#ff595e');
      ctx.save();
      ctx.beginPath();
      ctx.arc(630, 85, 55, 0, Math.PI * 2);
      ctx.fillStyle = conic;
      ctx.fill();
      ctx.restore();
    } else {
      label(ctx, '(이 브라우저는 conic gradient 를 지원하지 않습니다)', 520, 85);
    }
    label(ctx, 'Conic Gradient', 520, 160);

    // ---------- 4) Pattern (체크무늬 타일 이미지를 만들어서 반복) ----------
    const tile = document.createElement('canvas');
    tile.width = tile.height = 20;
    const tctx = tile.getContext('2d');
    tctx.fillStyle = '#eef0ff';
    tctx.fillRect(0, 0, 20, 20);
    tctx.fillStyle = '#5b6cff';
    tctx.fillRect(0, 0, 10, 10);
    tctx.fillRect(10, 10, 10, 10);

    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pattern;
    roundRect(ctx, 20, 210, 220, 110, 14);
    ctx.fill();
    label(ctx, 'Pattern (createPattern)', 20, 340);

    // ---------- 5) globalAlpha 로 겹쳐진 원 반투명 표현 ----------
    ctx.save();
    ctx.translate(400, 265);
    ['#ff6b6b', '#4dabf7', '#69db7c'].forEach((c, i) => {
      ctx.beginPath();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = c;
      ctx.arc(i * 45 - 40, 0, 55, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    label(ctx, 'globalAlpha (반투명 겹침)', 300, 340);
  },
});

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function label(ctx, text, x, y) {
  ctx.fillStyle = '#888';
  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillText(text, x, y);
}

})();
