(function () {
/**
 * 10-pixels.js — 픽셀 단위 조작 (ImageData)
 * ------------------------------------------------------------------
 *  - getImageData(x, y, w, h) : 캔버스의 특정 영역을 픽셀 배열로 읽어옵니다.
 *    반환되는 ImageData.data 는 Uint8ClampedArray 로, [R,G,B,A, R,G,B,A, ...] 형태입니다.
 *    (한 픽셀당 4바이트, 값 범위는 0~255 로 자동 clamp 됩니다)
 *  - putImageData(imageData, x, y) : 수정한 픽셀 배열을 다시 캔버스에 그려 넣습니다.
 *  - 이 두 메서드로 흑백/반전/세피아/모자이크 같은 이미지 필터를 직접 구현할 수 있습니다.
 *    (CSS filter 속성과 달리, 픽셀 데이터를 완전히 직접 제어할 수 있다는 게 핵심 차이입니다)
 */
registerDemo({
  id: 'pixels',
  category: '3. 이미지 & 픽셀',
  title: '픽셀 조작 (ImageData)',
  desc: 'getImageData/putImageData 로 직접 구현하는 흑백/반전/세피아/모자이크 필터',
  file: 'js/demos/10-pixels.js',
  points: [
    'ImageData.data 는 [R,G,B,A, R,G,B,A, ...] 순서의 1차원 배열(Uint8ClampedArray)입니다.',
    '픽셀 n의 R값 인덱스는 n*4, G는 n*4+1, B는 n*4+2, A는 n*4+3 입니다.',
    'Uint8ClampedArray 는 0~255를 벗어나는 값을 자동으로 잘라주어(clamp) 별도 처리가 필요 없습니다.',
    '모자이크는 일정 블록 단위로 대표 픽셀 색을 복사해서 해상도를 낮추는 방식입니다.',
    'getImageData/putImageData 도 transform 의 영향을 받지 않아 devicePixelRatio 배율 보정이 필요합니다.',
  ],
  init(ctx, canvas, helpers) {
    let img, originalData;
    const IMG_X = 20,
      IMG_Y = 50,
      IMG_W = 300,
      IMG_H = 220;
    // getImageData/putImageData 는 CTM(transform)의 영향을 받지 않는 "캔버스 원본 픽셀"
    // 좌표를 사용합니다. devicePixelRatio 대응으로 canvas.width 가 CSS 크기보다 크므로
    // (fitCanvasToDisplaySize 참고), 위 논리 좌표에 이 배율을 곱해서 실제 픽셀 영역을 읽어야 합니다.
    const dpr = canvas.width / helpers.width();

    helpers.controls.innerHTML = `
      <button data-f="original">원본</button>
      <button data-f="grayscale">흑백</button>
      <button data-f="invert">반전</button>
      <button data-f="sepia">세피아</button>
      <button data-f="mosaic">모자이크</button>
    `;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="220">
        <rect width="300" height="220" fill="#ffe8cc"/>
        <circle cx="90" cy="90" r="55" fill="#ff922b"/>
        <rect x="160" y="40" width="110" height="90" fill="#4dabf7"/>
        <polygon points="90,150 40,210 140,210" fill="#40c057"/>
        <circle cx="220" cy="170" r="35" fill="#e64980"/>
      </svg>`;
    img = new Image();
    img.onload = () => {
      draw();
      applyFilter('original');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

    helpers.controls.querySelectorAll('button').forEach((btn) => {
      helpers.on(btn, 'click', () => applyFilter(btn.dataset.f));
    });

    function draw() {
      const w = helpers.width();
      const h = helpers.height();
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, IMG_X, IMG_Y, IMG_W, IMG_H);
      // 필터 적용 전, 원본 픽셀 데이터를 한 번 저장해둔다 (매번 재계산의 기준이 됨)
      originalData = ctx.getImageData(IMG_X * dpr, IMG_Y * dpr, IMG_W * dpr, IMG_H * dpr);

      ctx.fillStyle = '#555';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText('위 버튼을 눌러 픽셀 필터를 적용해보세요 →', 20, 300);
      ctx.fillText('getImageData 로 읽은 Uint8ClampedArray 를 직접 수정합니다', 20, 320);
    }

    function applyFilter(type) {
      // 항상 "원본" 데이터를 복제해서 시작해야 필터를 중첩 적용하지 않고 깨끗하게 바뀝니다.
      const imageData = new ImageData(
        new Uint8ClampedArray(originalData.data),
        originalData.width,
        originalData.height
      );
      const data = imageData.data;

      if (type === 'grayscale') {
        for (let i = 0; i < data.length; i += 4) {
          // 사람 눈이 초록에 더 민감하다는 것을 반영한 가중 평균 (luminosity 공식)
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
      } else if (type === 'invert') {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
      } else if (type === 'sepia') {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i],
            g = data[i + 1],
            b = data[i + 2];
          data[i] = r * 0.393 + g * 0.769 + b * 0.189;
          data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
          data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
        }
      } else if (type === 'mosaic') {
        const block = 12;
        const { width, height } = imageData;
        for (let by = 0; by < height; by += block) {
          for (let bx = 0; bx < width; bx += block) {
            // 블록의 대표값으로 좌상단 픽셀 색을 사용
            const idx = (by * width + bx) * 4;
            const r = data[idx],
              g = data[idx + 1],
              b = data[idx + 2];
            for (let yy = 0; yy < block && by + yy < height; yy++) {
              for (let xx = 0; xx < block && bx + xx < width; xx++) {
                const i = ((by + yy) * width + (bx + xx)) * 4;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
              }
            }
          }
        }
      }
      // type === 'original' 이면 아무 수정 없이 그대로 다시 그림

      ctx.putImageData(imageData, IMG_X * dpr, IMG_Y * dpr);
    }
  },
});

})();
