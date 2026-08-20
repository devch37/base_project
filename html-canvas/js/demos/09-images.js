(function () {
/**
 * 09-images.js — 이미지 그리기 (drawImage)
 * ------------------------------------------------------------------
 * drawImage 는 인자 개수에 따라 세 가지 방식으로 동작합니다.
 *   1) drawImage(img, dx, dy)                              → 원본 크기 그대로, (dx,dy) 위치에 그림
 *   2) drawImage(img, dx, dy, dw, dh)                       → (dw,dh) 크기로 리사이즈해서 그림
 *   3) drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)       → 원본 이미지의 (sx,sy,sw,sh) 영역만
 *                                                              잘라내서(crop) (dx,dy,dw,dh) 위치/크기로 그림
 *      → 이 9-인자 버전이 "스프라이트 시트"에서 한 조각만 꺼내 쓸 때 핵심적으로 사용됩니다.
 *
 * 이 데모에서는 외부 이미지 파일 없이도 동작하도록, SVG 를 data URL 로 만들어
 * new Image() 의 소스로 사용합니다 (캔버스로 직접 그려서 이미지를 "생성"할 수도 있습니다).
 */
registerDemo({
  id: 'images',
  category: '3. 이미지 & 픽셀',
  title: '이미지 그리기 (drawImage)',
  desc: 'drawImage 의 3가지 시그니처(그대로/리사이즈/크롭)와 스프라이트 시트 잘라내기',
  file: 'js/demos/09-images.js',
  points: [
    'drawImage(img,dx,dy) / (img,dx,dy,dw,dh) / (img,sx,sy,sw,sh,dx,dy,dw,dh) 3가지 형태가 있습니다.',
    '9-인자 버전은 원본 이미지 일부만 잘라 그리는 "크롭/스프라이트" 용도로 가장 많이 쓰입니다.',
    '이미지는 반드시 로드가 끝난 뒤(onload / decode()) 그려야 빈 화면이 그려지는 것을 막을 수 있습니다.',
    'canvas 자체도 drawImage 의 소스로 사용할 수 있어(canvas→canvas) 캐싱/합성에 활용됩니다.',
  ],
  init(ctx, canvas, helpers) {
    const w = helpers.width();
    const h = helpers.height();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#888';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.fillText('이미지 로딩 중...', 20, 30);

    // ---------- 이미지 소스를 코드로 생성 (외부 파일 의존성 없음) ----------
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="240" height="180">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#74c0fc"/>
            <stop offset="1" stop-color="#e7f5ff"/>
          </linearGradient>
        </defs>
        <rect width="240" height="180" fill="url(#sky)"/>
        <circle cx="200" cy="35" r="20" fill="#ffe066"/>
        <path d="M0 140 L60 90 L110 130 L160 70 L240 130 L240 180 L0 180 Z" fill="#63e6be"/>
        <path d="M0 160 L80 120 L150 155 L240 150 L240 180 L0 180 Z" fill="#38d9a9"/>
      </svg>`;
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const img = new Image();
    img.onload = () => draw(ctx, helpers, img);
    img.src = dataUrl;
  },
});

function draw(ctx, helpers, img) {
  const w = helpers.width();
  const h = helpers.height();
  ctx.clearRect(0, 0, w, h);
  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillStyle = '#555';

  // ---------- 1) drawImage(img, dx, dy): 원본 크기 그대로 ----------
  ctx.drawImage(img, 20, 30);
  ctx.fillText('drawImage(img, x, y) — 원본 크기', 20, 225);

  // ---------- 2) drawImage(img, dx, dy, dw, dh): 리사이즈 ----------
  ctx.drawImage(img, 300, 30, 130, 100);
  ctx.fillText('원본 절반 크기로 리사이즈', 300, 145);

  ctx.drawImage(img, 460, 30, 240, 240); // 확대
  ctx.fillText('확대 (업스케일)', 460, 285);

  // ---------- 3) drawImage 9-인자: 특정 영역만 크롭해서 그리기 ----------
  // 원본(240x180) 이미지의 왼쪽 위 120x90 영역(하늘+해)만 잘라서 그림
  ctx.drawImage(img, 0, 0, 120, 90, 20, 260, 160, 120);
  ctx.fillText('9-인자 crop: 왼쪽 위 1/4 영역만', 20, 400);

  // 원본의 오른쪽 아래(땅 부분)만 크롭
  ctx.drawImage(img, 60, 90, 180, 90, 220, 260, 220, 110);
  ctx.fillText('9-인자 crop: 아래쪽 땅 영역만', 220, 400);

  // ---------- 4) 스프라이트 시트에서 프레임 하나 꺼내기 시연 ----------
  // 가상의 4프레임 스프라이트 시트를 캔버스로 직접 "생성"
  const sheet = document.createElement('canvas');
  sheet.width = 160;
  sheet.height = 40;
  const sctx = sheet.getContext('2d');
  const colors = ['#ff6b6b', '#ffb347', '#20c997', '#5b6cff'];
  colors.forEach((c, i) => {
    sctx.fillStyle = c;
    sctx.beginPath();
    sctx.arc(20 + i * 40, 20, 14, 0, Math.PI * 2);
    sctx.fill();
  });
  // 스프라이트 시트에서 3번째(인덱스 2) 프레임만 잘라 확대해서 그리기
  const frame = 2;
  ctx.drawImage(sheet, frame * 40, 0, 40, 40, 480, 260, 100, 100);
  ctx.fillText(`스프라이트 시트 ${frame + 1}번째 프레임만 추출`, 460, 400);
}

})();
