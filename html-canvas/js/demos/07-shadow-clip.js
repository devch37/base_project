(function () {
/**
 * 07-shadow-clip.js — 그림자 효과와 클리핑(clip)
 * ------------------------------------------------------------------
 * [그림자]
 *  - shadowColor        : 그림자 색상 (기본은 완전 투명이라 아무 것도 안 보임 → 반드시 지정)
 *  - shadowBlur          : 그림자의 흐림 정도 (0이면 선명한 그림자)
 *  - shadowOffsetX/Y     : 그림자가 원본으로부터 얼마나 떨어져 그려질지
 *  - 그림자는 fill/stroke/drawImage/fillText 등 "그리기" 동작에 자동으로 함께 그려집니다.
 *
 * [클리핑]
 *  - clip() : 현재까지 만든 path를 "가위"처럼 사용해서, 이후 그려지는 모든 내용이
 *    그 도형 안쪽으로만 보이게 잘라냅니다.
 *  - save()/restore() 로 감싸지 않으면 한 번 clip 된 영역이 계속 유지되어
 *    이후의 모든 그리기가 그 영역 안에 갇히게 됩니다.
 */
registerDemo({
  id: 'shadow-clip',
  category: '2. 변형 & 합성',
  title: '그림자 & 클리핑',
  desc: 'shadowBlur/Offset 로 만드는 그림자 효과와 clip() 을 이용한 도형 마스킹',
  file: 'js/demos/07-shadow-clip.js',
  points: [
    'shadowColor 를 지정하지 않으면 기본값이 투명이라 그림자가 보이지 않습니다.',
    'shadowBlur 값이 클수록 부드럽고 넓게 퍼지는 그림자가 됩니다.',
    'clip() 은 반드시 save() 로 감싸서, 다른 도형까지 계속 잘리지 않도록 restore() 해줍니다.',
    '원형/별 모양 clip 안에 이미지를 그리면 "프로필 아바타" 같은 마스킹 효과를 낼 수 있습니다.',
  ],
  init(ctx, canvas, helpers) {
    const w = helpers.width();
    const h = helpers.height();
    ctx.clearRect(0, 0, w, h);

    // ---------- 1) 그림자 강도 비교 ----------
    [0, 8, 20].forEach((blur, i) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = blur;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#5b6cff';
      roundRect(ctx, 40 + i * 150, 40, 110, 90, 16);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#888';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(`shadowBlur=${blur}`, 40 + i * 150, 150);
    });

    // ---------- 2) 컬러 글로우(빛나는 텍스트): shadowColor + blur ----------
    ctx.save();
    ctx.shadowColor = '#ff6bd6';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px -apple-system, sans-serif';
    ctx.fillStyle = '#1c1e26';
    ctx.fillText('NEON GLOW TEXT', 40, 220);
    ctx.restore();

    // ---------- 3) clip(): 원 모양으로 이미지/그리드를 마스킹 ----------
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 340, 70, 0, Math.PI * 2);
    ctx.clip(); // 이제부터 이 원 밖으로는 아무것도 안 그려짐
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#20c997' : '#94ecc9';
      ctx.fillRect(50 + i * 15, 270, 15, 140);
    }
    ctx.restore(); // clip 해제 -> 이후 그리기는 다시 전체 캔버스에 적용됨
    ctx.fillStyle = '#888';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('원형 clip()', 75, 430);

    // ---------- 4) 별 모양 clip ----------
    ctx.save();
    starPath(ctx, 320, 340, 70, 30, 5);
    ctx.clip();
    const grad = ctx.createLinearGradient(250, 270, 390, 410);
    grad.addColorStop(0, '#ffd43b');
    grad.addColorStop(1, '#ff6b6b');
    ctx.fillStyle = grad;
    ctx.fillRect(250, 270, 140, 140);
    ctx.restore();
    ctx.fillStyle = '#888';
    ctx.fillText('별 모양 clip()', 275, 430);

    // ---------- 5) clip 을 안 풀면 생기는 문제 예시 ----------
    ctx.fillStyle = '#888';
    ctx.fillText('→ restore() 를 빼먹으면 이후 도형도 계속 잘려서 그려집니다.', 470, 340);
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

function starPath(ctx, cx, cy, outerR, innerR, spikes) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

})();
