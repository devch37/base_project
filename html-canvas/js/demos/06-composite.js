(function () {
/**
 * 06-composite.js — 합성 모드 (globalCompositeOperation)
 * ------------------------------------------------------------------
 * 새로 그리는 도형("source")과 이미 캔버스에 있던 내용("destination")을
 * 어떻게 픽셀 단위로 합성할지 정하는 속성입니다. Photoshop 의 블렌드 모드와 유사합니다.
 *
 *  - 'source-over' (기본값) : 새 도형을 기존 내용 위에 그냥 덮어 그림
 *  - 'destination-over'     : 새 도형을 기존 내용 "뒤에" 그림
 *  - 'source-in' / 'source-out' : 겹치는/겹치지 않는 부분만 새 도형을 남김 (마스킹)
 *  - 'destination-in' / 'destination-out' : 반대로 기존 내용 쪽을 마스킹
 *  - 'multiply', 'screen', 'overlay' 등 : 색상을 수학적으로 섞는 블렌드 모드
 *  - 'xor' : 겹치는 부분만 투명하게 뚫어버림
 *
 * globalCompositeOperation 은 그리기 전에 설정해야 하며, 이후 그려지는 모든 도형에 적용됩니다.
 */
registerDemo({
  id: 'composite',
  category: '2. 변형 & 합성',
  title: '합성 모드 (globalCompositeOperation)',
  desc: '두 도형이 겹쳤을 때 색을 어떻게 섞을지 결정하는 26가지 블렌드/마스킹 모드',
  file: 'js/demos/06-composite.js',
  points: [
    'globalCompositeOperation 은 "그 다음에 그려지는" 도형부터 적용되는 상태값입니다.',
    'source-in/out, destination-in/out 조합으로 도형 모양의 마스크를 만들 수 있습니다.',
    'multiply/screen 등은 사진 편집 툴의 레이어 블렌드 모드와 동일한 원리입니다.',
    '큰 배경 위에 작은 도형으로 "구멍 뚫기(destination-out)" 효과가 자주 쓰입니다.',
  ],
  init(ctx, canvas, helpers) {
    const modes = [
      'source-over', 'source-in', 'source-out', 'source-atop',
      'destination-over', 'destination-in', 'destination-out', 'destination-atop',
      'lighter', 'copy', 'xor', 'multiply',
      'screen', 'overlay', 'darken', 'lighten',
      'color-dodge', 'color-burn', 'hard-light', 'soft-light',
      'difference', 'exclusion', 'hue', 'saturation',
    ];

    helpers.controls.innerHTML = `<span style="color:var(--text-dim)">아래 그리드는 각 모드로 파란 원(destination) 위에 주황 사각형(source)을 합성한 결과입니다.</span>`;

    draw(ctx, helpers, modes);
  },
});

function draw(ctx, helpers, modes) {
  const w = helpers.width();
  const h = helpers.height();
  ctx.clearRect(0, 0, w, h);

  const cols = 6;
  const cellW = w / cols;
  const cellH = 95;

  modes.forEach((mode, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = col * cellW;
    const cy = row * cellH;

    ctx.save();
    // 각 셀마다 클리핑해서 서로의 그림이 삐져나오지 않게 함
    ctx.beginPath();
    ctx.rect(cx + 4, cy + 4, cellW - 8, cellH - 22);
    ctx.clip();

    // 체커보드 배경을 그려서 "투명해진 부분"이 눈에 보이게 함
    drawCheckerboard(ctx, cx + 4, cy + 4, cellW - 8, cellH - 22);

    // 1) destination: 파란 원
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#4dabf7';
    ctx.beginPath();
    ctx.arc(cx + cellW / 2 - 14, cy + cellH / 2 - 16, 26, 0, Math.PI * 2);
    ctx.fill();

    // 2) source: 이 모드로 합성되는 주황 사각형
    ctx.globalCompositeOperation = mode;
    ctx.fillStyle = '#ff9f43';
    ctx.fillRect(cx + cellW / 2 - 6, cy + cellH / 2 - 26, 46, 46);

    ctx.restore();

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#555';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mode, cx + cellW / 2, cy + cellH - 6);
    ctx.textAlign = 'left';
  });
}

function drawCheckerboard(ctx, x, y, w, h) {
  const size = 8;
  for (let yy = 0; yy < h; yy += size) {
    for (let xx = 0; xx < w; xx += size) {
      const even = (Math.floor(xx / size) + Math.floor(yy / size)) % 2 === 0;
      ctx.fillStyle = even ? '#f1f2f6' : '#e2e4ea';
      ctx.fillRect(x + xx, y + yy, size, size);
    }
  }
}

})();
