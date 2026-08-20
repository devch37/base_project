(function () {
/**
 * 11-offscreen.js — 오프스크린 캔버스 & 더블 버퍼링
 * ------------------------------------------------------------------
 * 매 프레임 복잡한 내용을 처음부터 다시 그리면 느려질 수 있습니다.
 * 그래서 "화면에 보이지 않는" 별도의 캔버스(오프스크린 캔버스)에 미리 한 번만
 * 무거운 그림을 그려두고, 실제 화면에는 그 결과물을 drawImage 로 "복사"만 하는
 * 기법을 씁니다. (canvas → canvas 로 drawImage 가능하다는 점을 이용)
 *
 *  - document.createElement('canvas') 로 화면에 붙이지 않는 캔버스를 만들 수 있습니다.
 *  - (지원 브라우저에서는) canvas.transferControlToOffscreen() 으로 진짜 OffscreenCanvas
 *    객체를 얻어 Web Worker 에서 렌더링할 수도 있습니다 (메인 스레드 부담을 줄임).
 *  - "더블 버퍼링": 애니메이션 중 매번 변하지 않는 배경은 캐싱하고, 변하는 요소만
 *    실시간 캔버스에 다시 그리면 훨씬 효율적입니다.
 */
registerDemo({
  id: 'offscreen',
  category: '3. 이미지 & 픽셀',
  title: '오프스크린 캔버스 (더블 버퍼링)',
  desc: '무거운 배경을 별도 캔버스에 미리 그려두고 재사용해서 애니메이션 성능을 확보하는 기법',
  file: 'js/demos/11-offscreen.js',
  points: [
    'document.createElement("canvas") 로 화면에 붙이지 않는 오프스크린 캔버스를 만듭니다.',
    '별 500개처럼 매 프레임 안 바뀌는 배경은 한 번만 그려서 caching 해둡니다.',
    '실시간 캔버스에서는 drawImage(offscreenCanvas, 0, 0) 로 캐시된 결과만 복사합니다.',
    '움직이는 요소(우주선)만 매 프레임 다시 그려서 다시 그리는 양을 최소화합니다.',
  ],
  init(ctx, canvas, helpers) {
    const w = helpers.width();
    const h = helpers.height();

    // ---------- 1) 오프스크린 캔버스에 "무거운" 별 배경을 딱 한 번만 렌더링 ----------
    const bg = document.createElement('canvas'); // DOM에 붙이지 않음 = 화면에 안 보임
    bg.width = w;
    bg.height = h;
    const bgCtx = bg.getContext('2d');
    bgCtx.fillStyle = '#0b1026';
    bgCtx.fillRect(0, 0, w, h);
    const stars = [];
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.4 + 0.2;
      stars.push({ x, y });
      bgCtx.beginPath();
      bgCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
      bgCtx.arc(x, y, r, 0, Math.PI * 2);
      bgCtx.fill();
    }
    // 은하수 느낌의 큰 그라디언트 원도 미리 그려서 캐싱
    const nebula = bgCtx.createRadialGradient(w * 0.7, h * 0.3, 10, w * 0.7, h * 0.3, 220);
    nebula.addColorStop(0, 'rgba(120,80,255,0.35)');
    nebula.addColorStop(1, 'rgba(120,80,255,0)');
    bgCtx.fillStyle = nebula;
    bgCtx.fillRect(0, 0, w, h);

    // ---------- 2) 실시간 프레임에서는 이 배경을 "복사"만 하고, 우주선만 새로 그림 ----------
    let ship = { x: w / 2, y: h - 60, angle: -Math.PI / 2 };
    let frame = 0;
    let lastFpsTime = performance.now();
    let fpsFrames = 0;
    let fps = 0;

    helpers.loop((t) => {
      frame++;
      fpsFrames++;
      if (t - lastFpsTime > 500) {
        fps = Math.round((fpsFrames * 1000) / (t - lastFpsTime));
        fpsFrames = 0;
        lastFpsTime = t;
      }

      // 오프스크린 캔버스를 화면에 그대로 "붙여넣기" (다시 그리지 않음!)
      ctx.drawImage(bg, 0, 0);

      // 우주선은 마우스를 따라가며 매 프레임 새로 그려야 하는 "변하는" 요소
      const targetAngle = Math.atan2(mouse.y - ship.y, mouse.x - ship.x);
      ship.angle += (targetAngle - ship.angle) * 0.08;
      ship.x += (mouse.x - ship.x) * 0.04;
      ship.y += (mouse.y - ship.y) * 0.04;

      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(10, 14);
      ctx.lineTo(0, 6);
      ctx.lineTo(-10, 14);
      ctx.closePath();
      ctx.fillStyle = '#5b6cff';
      ctx.fill();
      // 엔진 불꽃 (반짝임 효과로 매 프레임 다르게)
      ctx.beginPath();
      ctx.moveTo(-5, 10);
      ctx.lineTo(0, 20 + Math.sin(frame * 0.5) * 6);
      ctx.lineTo(5, 10);
      ctx.fillStyle = '#ffa94d';
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#fff';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(`FPS: ${fps}  (별 ${stars.length}개는 캐시된 배경, 우주선만 매 프레임 재렌더링)`, 16, 24);
      ctx.fillText('마우스를 움직여 우주선을 조종해보세요', 16, 42);
    });

    const mouse = { x: w / 2, y: h / 2 };
    helpers.on(canvas, 'pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
  },
});

})();
