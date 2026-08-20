(function () {
/**
 * 12-draw-app.js — 마우스/터치로 그리는 자유 드로잉 앱
 * ------------------------------------------------------------------
 *  - pointerdown/pointermove/pointerup 이벤트로 마우스와 터치를 동시에 지원합니다
 *    (mouse/touch 이벤트를 따로 처리할 필요 없이 Pointer Events 하나로 통합됩니다).
 *  - 그리는 원리는 단순합니다: pointerdown 에서 시작점을 moveTo 하고,
 *    pointermove 마다 lineTo 로 이전 위치와 현재 위치를 이어 선을 그립니다.
 *  - getBoundingClientRect() 로 "브라우저 화면 좌표"를 "캔버스 내부 좌표"로 변환해야
 *    캔버스가 CSS로 리사이즈되어도 그리기 위치가 어긋나지 않습니다.
 *  - lineCap='round' + lineJoin='round' 를 쓰면 빠르게 움직여도 선이 끊기지 않고 부드럽습니다.
 *  - '지우개' 는 실제로는 globalCompositeOperation='destination-out' 을 이용해
 *    "그리는 게 아니라 지우는" 방식으로 구현합니다.
 */
registerDemo({
  id: 'draw-app',
  category: '4. 인터랙션 & 애니메이션',
  title: '자유 드로잉 앱 (그림판)',
  desc: 'Pointer Events 로 만드는 미니 그림판: 브러시 색상/굵기, 지우개(destination-out)',
  file: 'js/demos/12-draw-app.js',
  points: [
    'pointerdown → pointermove(그리기) → pointerup 순서로 드래그 드로잉을 구현합니다.',
    'getBoundingClientRect() 로 브라우저 좌표를 캔버스 내부 좌표로 정확히 변환합니다.',
    'lineCap/lineJoin 을 round 로 하면 빠른 드래그에도 선이 매끄럽게 이어집니다.',
    '지우개는 실제 삭제가 아니라 destination-out 합성 모드로 "구멍을 내는" 방식입니다.',
  ],
  init(ctx, canvas, helpers) {
    const w = helpers.width();
    const h = helpers.height();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    let drawing = false;
    let last = null;
    let tool = 'brush';

    helpers.controls.innerHTML = `
      <label>색상 <input id="d-color" type="color" value="#5b6cff" /></label>
      <label>굵기 <input id="d-size" type="range" min="2" max="40" value="8" /></label>
      <button id="d-eraser">🧽 지우개</button>
      <button id="d-brush">🖌️ 브러시</button>
      <button id="d-clear">전체 지우기</button>
    `;
    const colorInput = document.getElementById('d-color');
    const sizeInput = document.getElementById('d-size');
    const eraserBtn = document.getElementById('d-eraser');
    const brushBtn = document.getElementById('d-brush');
    const clearBtn = document.getElementById('d-clear');

    function setTool(next) {
      tool = next;
      eraserBtn.style.outline = tool === 'eraser' ? '2px solid #5b6cff' : 'none';
      brushBtn.style.outline = tool === 'brush' ? '2px solid #5b6cff' : 'none';
    }
    setTool('brush');

    helpers.on(brushBtn, 'click', () => setTool('brush'));
    helpers.on(eraserBtn, 'click', () => setTool('eraser'));
    helpers.on(clearBtn, 'click', () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, helpers.width(), helpers.height());
    });

    function toCanvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function strokeTo(pos) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Number(sizeInput.value);

      if (tool === 'eraser') {
        // 지우개: 새로 그리는 대신, 이미 그려진 부분을 "투명하게 지워버리는" 합성 모드
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // destination-out 에서는 alpha만 의미 있음
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = colorInput.value;
      }

      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    helpers.on(canvas, 'pointerdown', (e) => {
      drawing = true;
      last = toCanvasPos(e);
      // 점(클릭만 했을 때)도 찍히도록 아주 짧은 선을 그림
      strokeTo({ x: last.x + 0.01, y: last.y + 0.01 });
      canvas.setPointerCapture(e.pointerId);
    });

    helpers.on(canvas, 'pointermove', (e) => {
      if (!drawing) return;
      const pos = toCanvasPos(e);
      strokeTo(pos);
      last = pos;
    });

    const stop = () => (drawing = false);
    helpers.on(canvas, 'pointerup', stop);
    helpers.on(canvas, 'pointerleave', stop);
    helpers.on(canvas, 'pointercancel', stop);
  },
});

})();
