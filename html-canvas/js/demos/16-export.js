(function () {
/**
 * 16-export.js — 캔버스 내보내기 (toDataURL / toBlob)
 * ------------------------------------------------------------------
 *  - canvas.toDataURL('image/png') : 캔버스 내용을 base64 로 인코딩된 문자열로 즉시 반환합니다.
 *    문자열이라 다루기 쉽지만, 큰 이미지일수록 base64 인코딩 오버헤드로 메모리를 더 씁니다.
 *  - canvas.toBlob(callback, 'image/png', quality) : 비동기로 Blob 객체를 만들어줍니다.
 *    실제 파일 업로드나 다운로드에는 이 방식이 더 효율적입니다 (콜백 기반이라 비동기).
 *  - <a download="파일명" href="...">.click() 을 코드로 실행하면 브라우저가 파일 다운로드 창을 띄웁니다.
 *  - JPEG로 내보낼 때는 두 번째 인자에 'image/jpeg', 세 번째 인자에 0~1 사이 품질을 지정합니다.
 */
registerDemo({
  id: 'export',
  category: '5. 저장 & 내보내기',
  title: '이미지로 내보내기 (Export)',
  desc: 'toDataURL / toBlob 으로 캔버스 결과물을 PNG/JPEG 파일로 저장하기',
  file: 'js/demos/16-export.js',
  points: [
    'toDataURL() 은 동기적으로 base64 문자열을 즉시 반환합니다 (간단하지만 무거움).',
    'toBlob() 은 콜백 기반 비동기 방식으로, 실제 다운로드/업로드에 더 적합합니다.',
    '동적으로 만든 <a download> 태그를 클릭시키면 파일 저장 다이얼로그가 열립니다.',
    'JPEG 로 내보낼 때는 quality(0~1) 를 지정해 파일 크기와 화질을 조절할 수 있습니다.',
  ],
  init(ctx, canvas, helpers) {
    drawArt(ctx, helpers);

    helpers.controls.innerHTML = `
      <button id="e-png">⬇ PNG로 저장 (toBlob)</button>
      <button id="e-jpeg">⬇ JPEG로 저장 (품질 0.5)</button>
      <button id="e-dataurl">📋 Data URL 미리보기</button>
      <span id="e-status" style="color:var(--text-dim)"></span>
    `;
    const status = document.getElementById('e-status');

    helpers.on(document.getElementById('e-png'), 'click', () => {
      // toBlob: 비동기로 Blob 생성 → Object URL 로 변환해서 다운로드 링크에 연결
      canvas.toBlob((blob) => {
        downloadBlob(blob, 'canvas-export.png');
        status.textContent = `PNG 저장됨 (${(blob.size / 1024).toFixed(1)} KB)`;
      }, 'image/png');
    });

    helpers.on(document.getElementById('e-jpeg'), 'click', () => {
      // JPEG 는 투명도를 지원하지 않으므로, 먼저 흰 배경을 깔아준 복사본을 만들어 내보냅니다.
      const flat = document.createElement('canvas');
      flat.width = canvas.width;
      flat.height = canvas.height;
      const fctx = flat.getContext('2d');
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, flat.width, flat.height);
      fctx.drawImage(canvas, 0, 0);

      flat.toBlob(
        (blob) => {
          downloadBlob(blob, 'canvas-export.jpg');
          status.textContent = `JPEG 저장됨 (${(blob.size / 1024).toFixed(1)} KB, 품질 0.5)`;
        },
        'image/jpeg',
        0.5
      );
    });

    helpers.on(document.getElementById('e-dataurl'), 'click', () => {
      // toDataURL: 동기적으로 즉시 base64 문자열을 얻음
      const url = canvas.toDataURL('image/png');
      status.textContent = `Data URL 길이: ${url.length.toLocaleString()}자 (앞부분: ${url.slice(0, 40)}...)`;
    });
  },
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 메모리 누수 방지를 위해 잠시 후 Object URL 을 해제
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function drawArt(ctx, helpers) {
  const w = helpers.width();
  const h = helpers.height();
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#5b6cff');
  grad.addColorStop(1, '#ff6bd6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 30 + 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 34px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Export Me!', w / 2, h / 2);
  ctx.font = '14px -apple-system, sans-serif';
  ctx.fillText('아래 버튼으로 이 그림을 파일로 저장해보세요', w / 2, h / 2 + 30);
  ctx.textAlign = 'left';
}

})();
